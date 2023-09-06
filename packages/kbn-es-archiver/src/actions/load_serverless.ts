/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import * as zlib from 'zlib';
import * as fs from 'fs';
import oboe from 'oboe';
import { pipeline, PassThrough } from 'node:stream';
import { resolve } from 'path';
import { fromEventPattern } from 'rxjs';
import { pipe } from 'fp-ts/lib/function';
import { PathLikeOrString, archiveEntries, ArchivePathEntry } from './load_utils';
import { isGzip } from '../lib';
// import type { Subscription} from 'rxjs';

const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
  resolve(archivePath as string, x);
interface Annotated {
  absolutePathOfEntry: string;
  needsDecompression: boolean;
}
type PredicateFn = (a: string) => boolean;
const annotateForDecompression =
  (predicate: PredicateFn) =>
  (absolutePathOfEntry: any): Annotated => ({
    needsDecompression: predicate(absolutePathOfEntry) ? true : false,
    absolutePathOfEntry,
  });
const prepareForStanzation: (a: PathLikeOrString) => (b: string) => Annotated =
  (pathToArchiveDirectory) => (entry) =>
    pipe(entry, resolveEntry(pathToArchiveDirectory), annotateForDecompression(isGzip));
const readAndUnzip$ = (needsDecompression: boolean) => (x: PathLikeOrString) =>
  oboe(
    pipeline(
      fs.createReadStream(x),
      needsDecompression ? zlib.createGunzip() : new PassThrough(),
      (err) => {
        if (err) {
          console.warn('\nλjs Pipeline failed.', err);
        } else {
          console.log('\nλjs Pipeline succeeded.');
        }
      }
    )
  );

const jsonStanzaExtended$ =
  (pathToFile: PathLikeOrString) => (needsDecompression: boolean) => (_: any) =>
    readAndUnzip$(needsDecompression)(pathToFile).on('done', _);

const subscription = ({ absolutePathOfEntry, needsDecompression }: Annotated) =>
  pipe(jsonStanzaExtended$(absolutePathOfEntry)(needsDecompression), fromEventPattern);
const subscribe = (subscriptionF) => (obj: Annotated) => {
  subscriptionF(obj).subscribe({
    next: (x: string) => console.log(`\nλjs streamed - x: \n${JSON.stringify(x, null, 2)}`),
    error: (err: Error) => console.log('error:', err),
    complete: () => console.log('the end'),
  });
};
export const begin = async (pathToArchiveDirectory: PathLikeOrString) => {
  (await archiveEntries(pathToArchiveDirectory))
    .map(prepareForStanzation(pathToArchiveDirectory)) // This internal iteration is only handling 2 strings
    .map(pipe(subscription, subscribe));
};
