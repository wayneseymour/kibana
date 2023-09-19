/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { resolve, relative, dirname } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { Readable } from 'stream';
import { ToolingLog } from '@kbn/tooling-log';
import { REPO_ROOT } from '@kbn/repo-info';
import type { KbnClient } from '@kbn/test';
import type { Client } from '@elastic/elasticsearch';
import { createPromiseFromStreams } from '@kbn/utils';

import { constants, createGzip } from 'zlib';
import { isMappingFile } from '../lib/archives/filenames';
import { prependStreamOutJsonArchive } from './straight_pipe_utils';
import { isGzip, createStats, prioritizeMappings, readDirectory } from '../lib';
import { mkDirAndIgnoreAllErrors } from '../../../../test/api_integration/apis/local_and_ess_is_es_archiver_slow/utils';

// pipe a series of streams into each other so that data and errors
// flow from the first stream to the last. Errors from the last stream
// are not listened for
const fold = (...streams: Readable[]) =>
  streams.reduce((source, dest) =>
    source.once('error', (error) => dest.destroy(error)).pipe(dest as any)
  );
const compress = (a) => async (b) => {
  await createPromiseFromStreams([
    createReadStream(a),
    createGzip({ level: constants.Z_BEST_COMPRESSION }),
    createWriteStream(b),
  ]);
};
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
  const name = relative(REPO_ROOT, inputDir);
  const stats = createStats(name, log);
  const files = prioritizeMappings(await readDirectory(inputDir));
  const kibanaPluginIds = await kbnClient.plugins.getEnabledIds();
  const lineEnd = ',\n';

  const isDocNotMappingFile = (x) => (isMappingFile(x) ? false : true);
  const head = `${resolve(REPO_ROOT, 'x-pack/test_serverless')}`;

  for await (const fName of files) {
    const absolute = resolve(inputDir, fName);
    const isDoc = isDocNotMappingFile(absolute);
    let newDirName = '';
    let newFileName = '';
    const needsDecompression = isGzip(fName);

    const re = /es_archive[s|r]\/(.+$)/;

    const tail = (x): string | undefined => re.exec(x)![1];

    if (isDoc) {
      const dir = `${dirname(absolute)}`;
      newDirName = `${head}/functional/es_archives/${tail(dir)}`;
      newFileName = `${newDirName}/data.json`;

      console.log(`\nλjs newDirName: \n\t${newDirName}`);
      console.log(`\nλjs newFileName: \n\t${newFileName}`);

      await mkDirAndIgnoreAllErrors(newDirName)(log);
      prependStreamOutJsonArchive(() => newFileName);
    }

    // await pipeline(
    //   createReadStream(absolute),
    //   needsDecompression ? createGunzip() : new PassThrough(),
    //   createReplaceStream('\r\n', '\n'),
    //   createSplitStream(RECORD_SEPARATOR),
    //   createFilterStream<string>((l) => !!l.match(/[^\s]/)),
    //   createMapStream<string>((json) => JSON.parse(json.trim())),
    //   new Transform({
    //     readableObjectMode: true,
    //     writableObjectMode: true,
    //
    //     transform(chunk, encoding, callback) {
    //       if (isDoc) {
    //         const addJsonStanza = (chunk: any) => {
    //
    //           const writeToFile = writeFileSync.bind(null, newFileName);
    //
    //           const x = `${JSON.stringify(chunk, null, 2)}${lineEnd}`
    //
    //           const appendUtf8 = { flag: 'a', encoding };
    //
    //           writeToFile(x, appendUtf8);
    //         }
    //
    //
    //         addJsonStanza(chunk);
    //       }
    //       callback();
    //     },
    //
    //   }),
    // )

    needsDecompression ? await compress(newFileName)(`${newFileName}.gz`) : log.verbose('\nλjs Not compressing', newFileName);
  }

  // // a single stream that emits records from all archive files, in
  // // order, so that createIndexStream can track the state of indexes
  // // across archives and properly skip docs from existing indexes
  // const recordStream = concatStreamProviders(
  //   files.map((filename) => () => {
  //     log.info('[%s] Loading %j', name, filename);
  //
  //     return fold(
  //       createReadStream(resolve(inputDir, filename)),
  //       ...createParseArchiveStreams({ gzip: isGzip(filename) }),
  //     );
  //   }),
  //   { objectMode: true }
  // );
  //
  // const progress = new Progress();
  // progress.activate(log);
  //
  // await createPromiseFromStreams([
  //   recordStream,
  //   createCreateIndexStream({ client, stats, skipExisting, docsOnly, log }),
  //   createIndexDocRecordsStream(client, stats, progress, useCreate),
  // ]);

  // progress.deactivate();
  // const result = stats.toJSON();
  //
  // const indicesWithDocs: string[] = [];
  // for (const [index, { docs }] of Object.entries(result)) {
  //   if (docs && docs.indexed > 0) {
  //     log.info('[%s] Indexed %d docs into %j', name, docs.indexed, index);
  //     indicesWithDocs.push(index);
  //   }
  // }
  //
  // await client.indices.refresh(
  //   {
  //     index: indicesWithDocs.join(','),
  //     allow_no_indices: true,
  //   },
  //   {
  //     headers: ES_CLIENT_HEADERS,
  //   }
  // );
  //
  // // If we affected saved objects indices, we need to ensure they are migrated...
  // if (Object.keys(result).some((k) => k.startsWith(MAIN_SAVED_OBJECT_INDEX))) {
  //   await migrateSavedObjectIndices(kbnClient);
  //   log.debug('[%s] Migrated Kibana index after loading Kibana data', name);
  //
  //   if (kibanaPluginIds.includes('spaces')) {
  //     // WARNING affected by #104081. Assumes 'spaces' saved objects are stored in MAIN_SAVED_OBJECT_INDEX
  //     await createDefaultSpace({ client, index: MAIN_SAVED_OBJECT_INDEX });
  //     log.debug(`[%s] Ensured that default space exists in ${MAIN_SAVED_OBJECT_INDEX}`, name);
  //   }
  // }
  //
  // return result;
}
