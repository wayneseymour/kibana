/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import { bufferCount, fromEventPattern } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToolingLog } from '@kbn/tooling-log';
import { straightPipeIngestList } from './straight_pipe_ingest';
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
  (pathToArchiveDirectory: PathLikeOrString) => (log: ToolingLog) => async (destOpts) => {
    prependStreamOut(streamOutFileNameFn);

    const annotatedMappingsAndDataFileObjects: Annotated[] = (
      await archiveEntries(pathToArchiveDirectory)
    ).map(resolveAndAnnotateForDecompression(pathToArchiveDirectory));

    const { client } = destOpts;
    for (const annotated of annotatedMappingsAndDataFileObjects)
      foldAndLiftBuffered(log)(destOpts)(annotated)
        .pipe(map(addIndexNameForBulkIngest(client)(log)))
        .subscribe(straightPipeIngestList(client)(log));
  };

/*
 Pipelining the read stream that's prioritized to have the mappings json || data file (zipped or not),
 into a maybe-decompress stream,
 then, into a create the index or data stream, stream :) lol
 */
const foldAndLiftBuffered = (log: ToolingLog) => (destOpts) => (x: Annotated) => {
  const { entryAbsPath, needsDecompression } = x;
  const foldedStreams = (_) =>
    pipelineAll(needsDecompression)(entryAbsPath)(destOpts).on('done', _);
  return fromEventPattern(foldedStreams).pipe(bufferCount(BUFFER_SIZE));
};
