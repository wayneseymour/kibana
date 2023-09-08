/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { relative } from 'path';
import { ToolingLog } from '@kbn/tooling-log';
import { REPO_ROOT } from '@kbn/repo-info';
import type { KbnClient } from '@kbn/test';
import type { Client } from '@elastic/elasticsearch';

import { MAIN_SAVED_OBJECT_INDEX } from '@kbn/core-saved-objects-server';
import { atLeastOne, freshenUp, hasDotKibanaPrefix, indexingOccurred } from './load_utils';
import { createStats, migrateSavedObjectIndices, createDefaultSpace } from '../lib';
import { straightPipeAll } from './straight_pipe';

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
  const relFromRoot = relative.bind(null, REPO_ROOT);
  const relativeArchivePath = relFromRoot(inputDir);

  const stats = createStats(relativeArchivePath, log);
  // await straightPipeWithIndexCreation(relativeArchivePath)({
  await straightPipeAll(relativeArchivePath)({
    client,
    stats,
    skipExisting,
    docsOnly,
    log,
  });
  /*
   The two expressions above could be a promise.all or TaskEither.sequence!
   */

  const result = stats.toJSON();

  const indicesWithDocs: string[] = [];
  for (const [index, { docs }] of Object.entries(result))
    if (indexingOccurred(docs)) indicesWithDocs.push(index);

  await freshenUp(client, indicesWithDocs);

  // If we affected saved objects indices, we need to ensure they are migrated...
  if (atLeastOne(hasDotKibanaPrefix(MAIN_SAVED_OBJECT_INDEX))(result)) {
    await migrateSavedObjectIndices(kbnClient);
    // WARNING affected by #104081. Assumes 'spaces' saved objects are stored in MAIN_SAVED_OBJECT_INDEX
    if ((await kbnClient.plugins.getEnabledIds()).includes('spaces'))
      await createDefaultSpace({ client, index: MAIN_SAVED_OBJECT_INDEX });
  }
  return result;
}
