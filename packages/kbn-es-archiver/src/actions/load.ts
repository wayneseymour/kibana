/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { resolve, relative } from 'path';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { ToolingLog } from '@kbn/tooling-log';
import { REPO_ROOT } from '@kbn/repo-info';
import type { KbnClient } from '@kbn/test';
import type { Client } from '@elastic/elasticsearch';
import { createPromiseFromStreams, concatStreamProviders } from '@kbn/utils';
import { MAIN_SAVED_OBJECT_INDEX } from '@kbn/core-saved-objects-server';
import { pipe } from 'fp-ts/function';
import { ES_CLIENT_HEADERS } from '../client_headers';

import {
  isGzip,
  createStats,
  prioritizeMappings,
  readDirectory,
  createParseArchiveStreams,
  createCreateIndexStream,
  // createIndexDocRecordsStream,
  createIndexDocRecordsStreamSvrLess,
  migrateSavedObjectIndices,
  // Progress,
  createDefaultSpace,
} from '../lib';

// pipe a series of streams into each other so that data and errors
// flow from the first stream to the last. Errors from the last stream
// are not listened for
const pipeline = (...streams: Readable[]) =>
  streams.reduce((source, dest) =>
    source.once('error', (error) => dest.destroy(error)).pipe(dest as any)
  );

const logLoad = (generalName: string) => (log: ToolingLog) => (mappingsOrArchiveName: string) => {
  log.info('[%s] Loading %j', generalName, mappingsOrArchiveName);
  // console.info('[%s] Loading %j', generalName, mappingsOrArchiveName);
  return mappingsOrArchiveName;
};
const res = (dir: string) => (file: string) => resolve(dir, file);

export async function loadAction({
  inputDir,
  skipExisting,
  useCreate,
  docsOnly,
  client,
  log,
  kbnClient,
}: {
  inputDir: string;
  skipExisting: boolean;
  useCreate: boolean;
  docsOnly?: boolean;
  client: Client;
  log: ToolingLog;
  kbnClient: KbnClient;
}) {
  const archiveGeneralName = relative(REPO_ROOT, inputDir);
  const stats = createStats(archiveGeneralName, log);
  const mappingsFileAndArchive = prioritizeMappings(await readDirectory(inputDir));

  // a single stream that emits records from all archive files, in
  // order, so that createIndexStream can track the state of indexes
  // across archives and properly skip docs from existing indexes
  const recordsFromMappingsAndArchiveOrdered = concatStreamProviders(
    mappingsFileAndArchive.map((mappingsOrArchiveName) => () => {
      return pipeline(
        pipe(
          mappingsOrArchiveName,
          logLoad(archiveGeneralName)(log),
          res(inputDir),
          createReadStream
        ),
        ...createParseArchiveStreams({ gzip: isGzip(mappingsOrArchiveName) })
      );
    }),
    { objectMode: true }
  );

  // const progress = new Progress();
  // progress.activate(log);

  await createPromiseFromStreams([
    recordsFromMappingsAndArchiveOrdered,
    createCreateIndexStream({ client, stats, skipExisting, docsOnly, log }),
    // createIndexDocRecordsStream(client, stats, progress, useCreate),
    createIndexDocRecordsStreamSvrLess(client, stats, useCreate),
  ]);

  // progress.deactivate();
  const result = stats.toJSON();

  const indicesWithDocs: string[] = [];
  for (const [index, { docs }] of Object.entries(result)) {
    if (docs && docs.indexed > 0) {
      log.info('[%s] Indexed %d docs into %j', archiveGeneralName, docs.indexed, index);
      indicesWithDocs.push(index);
    }
  }

  await client.indices.refresh(
    {
      index: indicesWithDocs.join(','),
      allow_no_indices: true,
    },
    {
      headers: ES_CLIENT_HEADERS,
    }
  );

  // If we affected saved objects indices, we need to ensure they are migrated...
  if (Object.keys(result).some((k) => k.startsWith(MAIN_SAVED_OBJECT_INDEX))) {
    await migrateSavedObjectIndices(kbnClient);
    log.debug('[%s] Migrated Kibana index after loading Kibana data', archiveGeneralName);

    // WARNING affected by #104081. Assumes 'spaces' saved objects are stored in MAIN_SAVED_OBJECT_INDEX
    if ((await kbnClient.plugins.getEnabledIds()).includes('spaces')) {
      await createDefaultSpace({ client, index: MAIN_SAVED_OBJECT_INDEX });
      log.debug(
        `[%s] Ensured that default space exists in ${MAIN_SAVED_OBJECT_INDEX}`,
        archiveGeneralName
      );
    }
  }

  return result;
}
