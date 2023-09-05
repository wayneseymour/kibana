/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import {from, fromEventPattern} from 'rxjs';
import {map, concat} from 'rxjs/operators';
import {REPO_ROOT} from '@kbn/repo-info';
import * as zlib from 'zlib';
import {readdir} from 'fs/promises';
import * as fs from 'fs';
import oboe from 'oboe';
import {pipe} from 'fp-ts/function';
import {resolve} from 'path';
import {toError} from 'fp-ts/Either';
// import * as TE from 'fp-ts/TaskEither';
import {prioritizeMappings} from '../lib';
import {writeFileSync} from 'fs';


type PredicateFunction = (a: string) => boolean;
type PathLikeOrString = fs.PathLike | string;

const doesNotStartWithADot: PredicateFunction = (x) => !x.startsWith('.');
const readDirectory = (predicate: PredicateFunction) => {
  return async (path: string) => (await readdir(path)).filter(predicate);
};

// const subscribeToDecompressionStream = (archivePath: PathLikeOrString) => {
//   decompressionObservable(archivePath).subscribe({
//     next: (x) => console.log('\nλjs decompression stream - next, x:', x),
//     error: (err) => console.log('error:', err),
//     complete: () => console.log('the end'),
//   });
// };

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

const errFilePath = () => resolve(REPO_ROOT, 'esarch_failed_load_action_archives.txt');
const handleErrToFile = (archivePath) => (reason) => {
  const {code, stack, message} = reason;

  const caught = {
    code,
    stack,
    message,
    archiveThatFailed: archivePath,
  };
  const failedMsg = `${JSON.stringify(caught, null, 2)}`;

  try {
    throw new Error(`${reason}`);
  } catch (err) {
    console.error(failedMsg);
    writeFileSync(errFilePath(), `${failedMsg},\n`, {flag: 'a', encoding: 'utf8'});
  }

  return toError(reason);
}


type ArchivePathEntry = string;

const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
  resolve(archivePath as string, x);

const mappingsAndArchiveFileNames = async (pathToDirectory: PathLikeOrString) =>
  await readDirectory(doesNotStartWithADot)(pathToDirectory);

const resolveAndPrioritizeArchiveEntriesObservable =
  (pathToDirectory: PathLikeOrString) => (xs: ArchivePathEntry[]) =>
    from(pipe(prioritizeMappings)(xs)).pipe(map(resolveEntry(pathToDirectory)));

// const archiveEntries = async (archivePath: PathLikeOrString) => await pipe(
//   TE.tryCatch(
//     async () => await mappingsAndArchiveFileNames(archivePath),
//     (reason: any) => toError(reason)
//   ),
//   TE.map((x) => {
//     console.log(`\nλjs task either x: \n\t${x}`);
//     return x;
//   }),
//   TE.getOrElse((e) => handleErrToFile(archivePath)(e))
// )();

const toStr = (x: BufferSource) => `${x}`;
const noop = () => {
};

export const begin = async (pathToCompressedFile: PathLikeOrString) => {
  // pathToCompressedFile =
  //   "/Users/trezworkbox/dev/main.worktrees/can-we-oboe/x-pack/test/functional/es_archives/ml/farequote/data.json.gz";
    // "/Users/trezworkbox/dev/main.worktrees/can-we-oboe/myfarequote.txt"
    // "/Users/trezworkbox/dev/main.worktrees/straight-pipe-using-sax-parser/x-pack/test/functional/es_archives/logstash_functional/data.json.gz";


  console.log(`\nλjs pathToCompressedFile: \n\t${pathToCompressedFile}`);



  const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
    resolve(archivePath as string, x);

  const mappingsAndArchiveFileNames = async (x: PathLikeOrString) =>
    await readDirectory(doesNotStartWithADot)(x);

  const resolveAndPrioritizeArchiveEntriesObservable =
    (archivePath: PathLikeOrString) => (xs: ArchivePathEntry[]) =>
      from(pipe(prioritizeMappings)(xs)).pipe(map(resolveEntry(archivePath)));




  const obj$ = (x) => oboe(fs.createReadStream(x).pipe(zlib.createGunzip()));
  const json$ = (x) =>
    obj$(x).on("done", (obj) => {
      console.log(`\nλjs obj: \n${JSON.stringify(obj, null, 2)}`);
    });
  json$(pathToCompressedFile);
  // fromEventPattern???
};

