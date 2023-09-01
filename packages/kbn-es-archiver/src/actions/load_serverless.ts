/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import { from, fromEventPattern } from 'rxjs';
import { map } from 'rxjs/operators';
import * as zlib from 'zlib';
import { readdir } from 'fs/promises';
import * as fs from 'fs';
import oboe from 'oboe';
import { pipe } from 'fp-ts/function';
import { resolve } from 'path';
import { prioritizeMappings } from '../lib';

type PredicateFunction = (a: string) => boolean;
type PathLikeOrString = fs.PathLike | string;

const doesNotStartWithADot: PredicateFunction = (x) => !x.startsWith('.');
const readDirectory = (predicate: PredicateFunction) => {
  return async (path: string) => (await readdir(path)).filter(predicate);
};

const toStr = (x: BufferSource) => `${x}`;
const decompressionObservable = (x: PathLikeOrString) =>
  from(fs.createReadStream(x).pipe(zlib.createGunzip())).pipe(map(toStr));

// const subscribeToDecompressionStream = (archivePath: PathLikeOrString) => {
//   decompressionObservable(archivePath).subscribe({
//     next: (x) => console.log('\nλjs decompression stream - next, x:', x),
//     error: (err) => console.log('error:', err),
//     complete: () => console.log('the end'),
//   });
// };

const jsonStanza$ = (x) => (_) => oboe(fs.createReadStream(x)).on('done', _);
const jsonStanzaObservable = (x) => fromEventPattern(jsonStanza$(x));

// const subscribeToStreamingJsonStream = (archivePath) => {
//   archivePath =
//     '/Users/trezworkbox/dev/scratches/src/js/streams/native-nodejs-streams/gunzip/someotherfile.txt';
//   console.log(`\nλjs archivePath: \n\t${archivePath}`);
//
//   jsonStanzaObservable(archivePath).subscribe({
//     next: (x) => console.log(`\nλjs jsonStanzas stream - next, x: \n${JSON.stringify(x, null, 2)}`),
//     error: (err) => console.log('error:', err),
//     complete: () => console.log('the end'),
//   });
// };

type ArchivePathEntry = string;

const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
  resolve(archivePath as string, x);

const mappingsAndArchiveFileNames = async (x: PathLikeOrString) =>
  await readDirectory(doesNotStartWithADot)(x);

const resolveAndPrioritizeArchiveEntriesObservable =
  (archivePath: PathLikeOrString) => (xs: ArchivePathEntry[]) =>
    from(pipe(prioritizeMappings)(xs)).pipe(map(resolveEntry(archivePath)));

export const begin = async (archivePath: PathLikeOrString): Promise<void> => {
  // const archiveFilePath =
  //   '/Users/trezworkbox/dev/scratches/src/js/streams/native-nodejs-streams/gunzip/someotherfile.txt.gz';
  // subscribeToDecompressionStream(archivePath);
  // subscribeToStreamingJsonStream(archivePath);

  // archivePath =
  //   '/Users/trezworkbox/dev/scratches/src/js/streams/native-nodejs-streams/gunzip/archive-path';

  resolveAndPrioritizeArchiveEntriesObservable(archivePath)(
    await mappingsAndArchiveFileNames(archivePath)
  ).subscribe({
    next: (x) => console.log('\nλjs next, x:', x),
    error: (err) => console.log('error:', err),
    complete: () => console.log('the end'),
  });

  // concat(decompressionObservable(archiveFilePath), jsonStanzaObservable(archivePath)).subscribe({

  // concat(decompressionObservable(archivePath), jsonStanzaObservable(archivePath)).subscribe({
  //   next: (x) => console.log('\nλjs next, x:', x),
  //   error: (err) => console.log('error:', err),
  //   complete: () => console.log('the end'),
  // });
};
