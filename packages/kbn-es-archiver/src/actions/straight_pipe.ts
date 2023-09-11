/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

// This just 'outs' the records to the terminal
// export const straightPipe = async (pathToArchiveDirectory: PathLikeOrString): Promise<void> => {
//   (await archiveEntries(pathToArchiveDirectory))
//     .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
//     .map(pipe(jsonStanza$Subscription, subscribe));
// };

import { Client } from '@elastic/elasticsearch';

import { bufferCount, fromEventPattern } from 'rxjs';
import { ToolingLog } from '@kbn/tooling-log';
import { PathLikeOrString, resolveAndAnnotateForDecompression, Annotated } from './load_utils';
import {
  pipelineAll,
  archiveEntries,
  prependStreamOut,
  Void2String,
  recordsIndexName,
  handleStreamToFileWithLimit,
} from './straight_pipe_utils';

const BUFFER_SIZE = process.env.BUFFER_SIZE || 100;

const streamOutF: Void2String = () => 'stream_out.txt';

const i = 0;
const handleNextSingle = (client: Client) => async (singleJsonRecord) => {
  const _index = recordsIndexName(singleJsonRecord);
  // console.log(`\nλjs _index: \n\t${_index}`);
  const payload = [{ index: { _index } }, singleJsonRecord];
  handleStreamToFileWithLimit(streamOutF)(0)(singleJsonRecord);

  console.log(`\nλjs payload: \n${JSON.stringify(payload, null, 2)}`);
};

type BufferedJsonRecordsCollection = any[];

const handleNextBuffered =
  (client: Client) => (log: ToolingLog) => async (xs: BufferedJsonRecordsCollection) => {
    console.log(`\nλjs xs: \n${JSON.stringify(xs, null, 2)}`);
    handleStreamToFileWithLimit(streamOutF)(0)(xs);
    process.exit(666); // Trez Exit Expression
    // const _index = recordsIndexName(singleJsonRecord);
    // console.log(`\nλjs _index: \n\t${_index}`);
    // const payload = [{ index: { _index } }, singleJsonRecord];

    // console.log(`\nλjs payload: \n${JSON.stringify(payload, null, 2)}`);
  };

export const straightPipeAll =
  (pathToArchiveDirectory: PathLikeOrString) =>
  (log: ToolingLog) =>
  async (...indexOrDataStreamCreationArgs) => {
    prependStreamOut(streamOutF);
    (await archiveEntries(pathToArchiveDirectory))
      .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
      .forEach((x: Annotated) => {
        const { entryAbsPath, needsDecompression } = x;

        const foldedStreams = (_) =>
          pipelineAll(needsDecompression)(entryAbsPath)(indexOrDataStreamCreationArgs).on(
            'done',
            _
          );

        const { client } = indexOrDataStreamCreationArgs;
        fromEventPattern(foldedStreams)
          .pipe(bufferCount(BUFFER_SIZE))
          .subscribe(handleNextBuffered(client)(log));
      });
  };

enum BulkOperation {
  Create = 'create',
  Index = 'index',
}

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
// // function parseSumthin(xs) {
// //   return xs.flatMap((doc) => {
// //     return [{ index: { _index } }, doc];
// //   });
// // }
