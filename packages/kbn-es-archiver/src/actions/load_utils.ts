/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Client } from '@elastic/elasticsearch';

import { Readable } from 'stream';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { toError } from 'fp-ts/Either';
import fs, { writeFileSync } from 'fs';
import { resolve } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';
import { readdir } from 'fs/promises';
import { ES_CLIENT_HEADERS } from '../client_headers';

type Arrow2Readable = () => Readable;
interface FX {
  (filename: string): Arrow2Readable;
  (value: string, index: number, array: string[]): Arrow2Readable;
}
// export async function recordStream(streamFactoryFn: FX, inputDir: string): Promise<PassThrough> {
//   return concatStreamProviders(
//     prioritizeMappings(await readDirectory(inputDir)).map(streamFactoryFn),
//     {
//       objectMode: true,
//     }
//   );
// }

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
// pipe a series of streams into each other so that data and errors
// flow from the first stream to the last. Errors from the last stream
// are not listened for
export const readablesToReadable = (...streams: Readable[]): Readable =>
  streams.reduce((source: Readable, dest: Readable) =>
    source.once('error', (error) => dest.destroy(error)).pipe(dest as any)
  );

export type PredicateFunction = (a: string) => boolean;
export type PathLikeOrString = fs.PathLike | string;
export type ArchivePathEntry = string;

const errFilePath = () => resolve(REPO_ROOT, 'esarch_failed_load_action_archives.txt');
const handleErrToFile = (archivePath) => (reason) => {
  const { code, stack, message } = reason;

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
    writeFileSync(errFilePath(), `${failedMsg},\n`, { flag: 'a', encoding: 'utf8' });
  }

  return toError(reason);
};
const doesNotStartWithADot: PredicateFunction = (x) => !x.startsWith('.');
const readDirectory = (predicate: PredicateFunction) => {
  return async (path: string) => (await readdir(path)).filter(predicate);
};

const mappingsAndArchiveFileNames = async (pathToDirectory: PathLikeOrString) =>
  await readDirectory(doesNotStartWithADot)(pathToDirectory);

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
    TE.getOrElse((e) => handleErrToFile(archivePath)(e))
  )();
