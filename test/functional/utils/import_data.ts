/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import { SuperTest } from 'supertest';
import { ToolingLog } from '@kbn/dev-utils';

const mark = '[SavedObjects - Import]';

export const importData = (
  appName: string,
  archiveDir = 'test/functional/fixtures/exported_saved_objects',
  archiveName = 'exported.ndjson'
) => (supertest: SuperTest<any>) => async (log: ToolingLog) => {
  const srcFilePath = join(archiveDir, appName, archiveName);
  await supertest
    .post('/api/saved_objects/_import')
    .query({ overwrite: true })
    .set('kbn-xsrf', 'anything')
    .attach('file', readFileSync(srcFilePath), srcFilePath)
    .expect(200)
    .then(() => log.info(`${mark} import successful of ${srcFilePath}`))
    .catch((err: any) => log.error(`${mark} caught error - import response: \n\t${err.message}`));
};
