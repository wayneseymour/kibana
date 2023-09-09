/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

// This just 'outs' the records to the terminal
// export const straightPipe = async (pathToArchiveDirectory: PathLikeOrString): Promise<void> => {
//   (await archiveEntries(pathToArchiveDirectory))
//     .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
//     .map(pipe(jsonStanza$Subscription, subscribe));
// };

import Stream from 'stream';
import { of } from 'rxjs';
import { ES_CLIENT_HEADERS } from '../client_headers';
import { PathLikeOrString, resolveAndAnnotateForDecompression, Annotated } from './load_utils';
import {
  pipelineAll,
  archiveEntries,
  prependStreamOut,
  Void2String,
  // handleStreamToFileWithLimitAndContinue,
  // handleStreamToFileWithLimit,
} from './straight_pipe_utils';

const streamOutF: Void2String = () => 'stream_out.txt';

const i = 0;

export const straightPipeAll =
  (pathToArchiveDirectory: PathLikeOrString) =>
  async (...indexOrDataStreamCreationArgs) => {
    prependStreamOut(streamOutF);
    (await archiveEntries(pathToArchiveDirectory))
      .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
      .forEach((x: Annotated) => {
        const { entryAbsPath, needsDecompression } = x;
        pipelineAll(needsDecompression)(entryAbsPath)(indexOrDataStreamCreationArgs).on(
          'done',
          (singleJsonRecord) => {
            // if (i < 3)
            //   console.log(
            //     `\nλjs shouldBeASingleRecord: \n\t${JSON.stringify(singleJsonRecord, null, 2)}`
            //   );
            // if (i > 3) process.exit(666); // Trez Exit Expression
            //
            // i++;

            // handleStreamToFileWithLimit(streamOutF)(0)(singleJsonRecord)

            // handleStreamToFileWithLimitAndContinue(streamOutF)(0)(singleJsonRecord)
            of(singleJsonRecord).subscribe(async (record) => {
              await indexDocWith(indexOrDataStreamCreationArgs)(record);
            });
          }
        );
      });
  };
const indexDocWith =
  ({ client }) =>
  async (singleRecord: any) => {
    // console.log(`\nλjs doc: \n${JSON.stringify(doc, null, 2)}`);

    // doc.id ?
    await client.helpers.bulk(
      {
        retries: 5,
        datasource: [singleRecord],
        onDocument(doc) {
          return [{ index: { _index: 'date-nested' } }, doc];
        },
        onDrop(dropped) {
          console.log('\nλjs Dropped!!!');
          const dj = JSON.stringify(dropped.document);
          const ej = JSON.stringify(dropped.error);
          console.log(`\nλjs dj: \n${JSON.stringify(dj, null, 2)}`);
          console.log(`\nλjs ej: \n${JSON.stringify(ej, null, 2)}`);
        },
      },
      {
        headers: ES_CLIENT_HEADERS,
      }
    );

    // if (errors.length) {
    //   throw new AggregateError(errors);
    // }
    //
    // for (const doc of docs) {
    //   stats.indexedDoc(doc.data_stream || doc.index);
    // }
  };

enum BulkOperation {
  Create = 'create',
  Index = 'index',
}

const ingest = (indexOrDataStreamCreationArgs) => async (record: any) => {
  // console.log(`\nλjs docs: \n${JSON.stringify(docs, null, 2)}`);

  const { client, stats, skipExisting, docsOnly, log, useCreate } =
    indexOrDataStreamCreationArgs[0];
  const readable = Stream.Readable.from(record);
  readable.on('data', (chunk) => {
    console.log(chunk); // will be called once with `"input string"`
  });
  // const body = [{ index: { _index: 'date-nested' } }, record];
  // console.log(`\nλjs body: \n${JSON.stringify(body, null, 2)}`);
  // const bulkResponse = await client.bulk({ refresh: true, body });
  // console.log(`\nλjs bulkResponse: \n${JSON.stringify(bulkResponse, null, 2)}`);
};

// function parseSumthin(xs) {
//   return xs.flatMap((doc) => {
//     return [{ index: { _index } }, doc];
//   });
// }
