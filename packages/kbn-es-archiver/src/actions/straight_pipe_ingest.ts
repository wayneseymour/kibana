/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import { Client } from '@elastic/elasticsearch';
import { ToolingLog } from '@kbn/tooling-log';
import { BufferedJsonRecordsCollection } from './straight_pipe_utils';

export const straightPipeIngestList =
  (client: Client) => (log: ToolingLog) => async (body: BufferedJsonRecordsCollection) => {
    await straightPipeBulkIngest();

    async function straightPipeBulkIngest() {
      console.log('\nλjs ingesting');
      console.log(`\nλjs body.length: \n\t${body.length}`);
      console.log(`\nλjs body[0]: \n${JSON.stringify(body[0], null, 2)}`);

      // const bulkResponse = await client.bulk({ refresh: true, body });

      // {
      //   headers: ES_CLIENT_HEADERS,
      // });
      // console.log(`\nλjs bulkResponse: \n${JSON.stringify(bulkResponse, null, 2)}`);
      //
      // handleErrors(body, bulkResponse)(log);
    }
  };

// const ingest = (indexOrDataStreamCreationArgs) => async (record: any) => {
//   // console.log(`\nλjs docs: \n${JSON.stringify(docs, null, 2)}`);
//
//   const { client, stats, skipExisting, docsOnly, log, useCreate } =
//     indexOrDataStreamCreationArgs[0];
//   const readable = Stream.Readable.from(record);
//   readable.on('data', (chunk) => {
//     console.log(chunk); // will be called once with `"input string"`
//   });
//   // const body = [{ index: { _index: 'date-nested' } }, record];
//   // console.log(`\nλjs body: \n${JSON.stringify(body, null, 2)}`);
//   // const bulkResponse = await client.bulk({ refresh: true, body });
//   // console.log(`\nλjs bulkResponse: \n${JSON.stringify(bulkResponse, null, 2)}`);
// };
//
