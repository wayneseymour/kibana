/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import { bufferCount, fromEventPattern } from 'rxjs';
import { ToolingLog } from '@kbn/tooling-log';
import { PathLikeOrString, resolveAndAnnotateForDecompression, Annotated } from './load_utils';
import {
  prependStreamOut,
  pipelineAll,
  archiveEntries,
  addIndexNameForBulkIngest,
  streamOutFileNameFn,
} from './straight_pipe_utils';

const BUFFER_SIZE = process.env.BUFFER_SIZE || 100;

export const straightPipeAll =
  (pathToArchiveDirectory: PathLikeOrString) =>
  (log: ToolingLog) =>
  // TODO-TRE: Drop non-needed keys
  async (...indexOrDataStreamCreationArgs) => {
    // TODO-TRE: Drop stream "outing" when actually running
    // against serverless.
    prependStreamOut(streamOutFileNameFn);

    // const annotatedMappingsAndDataFileObjects: Annotated[] = (await archiveEntries(pathToArchiveDirectory))
    //   .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory));

    (await archiveEntries(pathToArchiveDirectory))
      .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
      .forEach(f(log)(indexOrDataStreamCreationArgs));
  };

const f = (log: ToolingLog) => (destOpts) => (x: Annotated) => {
  const { entryAbsPath, needsDecompression } = x;

  /*
   Pipelining the read stream that's prioritized to have the mappings json || data file (zipped or not),
   into a maybe-decompress stream,
   then, into a create the index or data stream, stream :) lol
   */
  const foldedStreams = (_) =>
    pipelineAll(needsDecompression)(entryAbsPath)(destOpts).on('done', _);

  const { client } = destOpts;

  fromEventPattern(foldedStreams)
    .pipe(bufferCount(BUFFER_SIZE))
    .subscribe((as) => {
      const updated = addIndexNameForBulkIngest(client)(log)(as);
      console.log(`\nλjs updated: \n${JSON.stringify(updated, null, 2)}`);
    });
};
