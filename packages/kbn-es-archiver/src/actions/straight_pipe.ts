/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import { fromEventPattern } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToolingLog } from '@kbn/tooling-log';
import { Readable } from 'stream';
import { pipeline } from 'node:stream';
import { PathLikeOrString, resolveAndAnnotateForDecompression, Annotated } from './load_utils';
import {
  prependStreamOut,
  pipelineAll,
  archiveEntries,
  streamOutFileNameFn,
} from './straight_pipe_utils';
import { createCreateIndexStream } from '../lib';

const BUFFER_SIZE = process.env.BUFFER_SIZE || 100;

const createIndex$ = (destOpts) => (x) => {
  const s = new Readable({ objectMode: true });
  s.push(x);
  s.push(null);

  pipeline(s, createCreateIndexStream(destOpts), (err) => {
    if (err) console.error(`\nλjs err: \n${JSON.stringify(err, null, 2)}`);
  });

  return x;
};
export const straightPipeAll =
  (pathToArchiveDirectory: PathLikeOrString) => (log: ToolingLog) => async (destOpts) => {
    prependStreamOut(streamOutFileNameFn);

    const annotatedMappingsAndDataFileObjects: Annotated[] = (
      await archiveEntries(pathToArchiveDirectory)
    ).map(resolveAndAnnotateForDecompression(pathToArchiveDirectory));

    for (const annotated of annotatedMappingsAndDataFileObjects)
      foldAndLift(log)(destOpts)(annotated)
        .pipe(map(createIndex$(destOpts)))
        .subscribe({
          // next: (x) => console.log('\nλjs next, x:', x),
          next: (x) => console.log('_'),
          error: (err) => console.log('error:', err),
          complete: () => console.log('the end'),
        });
  };

const foldAndLift = (log: ToolingLog) => (destOpts) => (x: Annotated) => {
  const { entryAbsPath, needsDecompression } = x;
  const foldedStreams = (_) =>
    pipelineAll(needsDecompression)(entryAbsPath)(destOpts).on('done', _);
  return fromEventPattern(foldedStreams);
};

// foldAndLift(log)(destOpts)(annotated)
//   // .pipe(bufferCount(BUFFER_SIZE))
//   // .pipe(map(addIndexNameForBulkIngest(client)(log)))
//   // .subscribe(straightPipeIngestList(client)(log));
//   .subscribe(createIndex$(destOpts));
