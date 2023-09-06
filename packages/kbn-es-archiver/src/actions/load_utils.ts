/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import type { Client } from '@elastic/elasticsearch';

import { Readable } from 'stream';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { toError } from 'fp-ts/Either';
import fs, { writeFileSync } from 'fs';
import { REPO_ROOT } from '@kbn/repo-info';
import { readdir } from 'fs/promises';
import * as zlib from 'zlib';
import oboe, { Oboe } from 'oboe';
import { pipeline, PassThrough } from 'node:stream';
import { resolve } from 'path';
import { fromEventPattern, Observable } from 'rxjs';
import { ES_CLIENT_HEADERS } from '../client_headers';
import { isGzip } from '../lib';

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

// TODO-TRE: Remove ambiguity in variable name
export const prepareForStanzation: (a: PathLikeOrString) => (b: string) => Annotated =
  (pathToArchiveDirectory) => (entry) =>
    pipe(entry, resolveEntry(pathToArchiveDirectory), annotateForDecompression(isGzip));

const readAndUnzip$: (a: boolean) => (b: PathLikeOrString) => Oboe = (needsDecompression) => (x) =>
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

export const subscription: (a: Annotated) => Observable<any> = ({
  absolutePathOfEntry,
  needsDecompression,
}: Annotated) =>
  pipe(jsonStanzaExtended$(absolutePathOfEntry)(needsDecompression), fromEventPattern);
// TODO-TRE: Fix type info
export const subscribe = (subscriptionF) => (obj: Annotated) => {
  subscriptionF(obj).subscribe({
    next: (x: string) => console.log(`\nλjs streamed - x: \n${JSON.stringify(x, null, 2)}`),
    error: (err: Error) => console.log('error:', err),
    complete: () => console.log('the end'),
  });
};
type Arrow2Readable = () => Readable;
interface FX {
  (filename: string): Arrow2Readable;
  (value: string, index: number, array: string[]): Arrow2Readable;
}

export function docIndicesPushFactory(xs: string[]) {
  return function (idx: string) {
    xs.push(idx);
  };
}
export function atLeastOne(predicate: {
  (x: string): boolean;
  (value: string, index: number, array: string[]): unknown;
}) {
  return (result: {}) => Object.keys(result).some(predicate);
}
export function indexingOccurred(docs: { indexed: any; archived?: number }) {
  return docs && docs.indexed > 0;
}
export async function freshenUp(client: Client, indicesWithDocs: string[]): Promise<void> {
  await client.indices.refresh(
    {
      index: indicesWithDocs.join(','),
      allow_no_indices: true,
    },
    {
      headers: ES_CLIENT_HEADERS,
    }
  );
}
export function hasDotKibanaPrefix(mainSOIndex: string) {
  return (x: string) => x.startsWith(mainSOIndex);
}

export type PredicateFunction = (a: string) => boolean;
export type PathLikeOrString = fs.PathLike | string;
export type ArchivePathEntry = string;

const errFilePath = () => resolve(REPO_ROOT, 'esarch_failed_load_action_archives.txt');
const handleErrToFile = (archivePath: string) => (reason: Error) => {
  const failedMsg = `${JSON.stringify({ ...reason, archiveThatFailed: archivePath }, null, 2)}`;

  try {
    throw new Error(`${reason}`);
  } catch (err) {
    console.warn(failedMsg);
    writeFileSync(errFilePath(), `${failedMsg},\n`, { flag: 'a', encoding: 'utf8' });
  }

  return toError(reason);
};
const doesNotStartWithADot: PredicateFunction = (x) => !x.startsWith('.');
const readDirectory = (predicate: PredicateFunction) => {
  return async (path: string) => (await readdir(path)).filter(predicate);
};

const mappingsAndArchiveFileNames = async (pathToDirectory: PathLikeOrString) =>
  await readDirectory(doesNotStartWithADot)(pathToDirectory as string);

// TODO-TRE: Handle all the cases below?
/*
 Cases:
 One file, zipped or not
 Two files, either zipped or not
 */
export const archiveEntries = async (archivePath: PathLikeOrString) =>
  await pipe(
    TE.tryCatch(
      async () => await mappingsAndArchiveFileNames(archivePath),
      (reason: any) => toError(reason)
    ),
    TE.getOrElse(handleErrToFile(archivePath))
  )();
