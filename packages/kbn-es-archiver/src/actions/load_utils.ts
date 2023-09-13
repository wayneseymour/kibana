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
import fs, { createReadStream } from 'fs';
import * as zlib from 'zlib';
import oboe from 'oboe';
import { pipeline, PassThrough } from 'node:stream';
import { resolve } from 'path';
import { concatStreamProviders } from '@kbn/utils';
import { ES_CLIENT_HEADERS } from '../client_headers';
import { createParseArchiveStreams, isGzip } from '../lib';

export interface Annotated {
  entryAbsPath: string;
  needsDecompression: boolean;
}

// export type Boolean2PathLikeString2Stream = (a: boolean) => (b: PathLikeOrString) => Oboe;
export type Pathlike2ResolvedPathLike2Annotated = (a: PathLikeOrString) => (b: string) => Annotated;
export type PredicateFn = (a: string) => boolean;
export type PathLikeOrString = string | fs.PathLike;

export type ArchivePathEntry = string;

const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
  resolve(archivePath as string, x);

const annotateForDecompression =
  (predicate: PredicateFn) =>
  (entryAbsPath: any): Annotated => ({
    needsDecompression: predicate(entryAbsPath) ? true : false,
    entryAbsPath,
  });

// TODO-TRE: Remove ambiguity in variable name
export const resolveAndAnnotateForDecompression: Pathlike2ResolvedPathLike2Annotated =
  (pathToArchiveDirectory) => (entryAbsPath) =>
    pipe(entryAbsPath, resolveEntry(pathToArchiveDirectory), annotateForDecompression(isGzip));

// const readAndMaybeUnzipUsingSaxParser$: Boolean2PathLikeString2Stream =
const readAndMaybeUnzipUsingSaxParser$ = (needsDecompression) => (entryAbsPath) =>
  oboe(
    pipeline(
      fs.createReadStream(entryAbsPath),
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

const reportStreamPassOrFail = (err?: Error) => (archiveRelativePath: PathLikeOrString) => {
  if (err) console.warn(`\nλjs Pipeline failed for \n\t[${archiveRelativePath}]\n`, err);
  else console.log(`\nλjs Pipeline succeeded for \n\t[${archiveRelativePath}]\n`);
};

export const handlePipelinedStreams = (entryAbsPath: PathLikeOrString) => (err: Error) => {
  // pipe(
  //   entryAbsPath,
  //   relative.bind(null, REPO_ROOT),
  //   err ? reportStreamPassOrFail(err) : reportStreamPassOrFail()
  // );
};

export const passThroughOrDecompress = (needsDecompression: boolean) =>
  needsDecompression ? zlib.createGunzip() : new PassThrough();

export const saxParserJsonStanza$ =
  (entryAbsPath: PathLikeOrString) => (needsDecompression: boolean) => (handler: () => any) =>
    readAndMaybeUnzipUsingSaxParser$(needsDecompression)(entryAbsPath).on('done', handler);

// TODO-TRE: Fix type info
export const subscribe = (subscriptionF) => (obj: Annotated) => {
  subscriptionF(obj).subscribe({
    next: (x: string) => console.log(`\nλjs streamed - xf: \n${JSON.stringify(x, null, 2)}`),
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

// a single stream that emits records from all archive files, in
// order, so that createIndexStream can track the state of indexes
// across archives and properly skip docs from existing indexes
export const readDir$AndCreateStanzasViaHandJamming$ =
  (archiveDirectory: string) => (maybeMappingsAndDocsFileNamesFromArchive: string[]) =>
    concatStreamProviders(
      maybeMappingsAndDocsFileNamesFromArchive.map((filename: string) => () => {
        return foldStreams(
          createReadStream(resolve(archiveDirectory, filename)),
          ...createParseArchiveStreams({ gzip: isGzip(filename) })
        );
      }),
      { objectMode: true }
    );
// TODO-TRE: I think the above fn is now a duplicate of an TaskEither

// pipe a series of streams into each other so that data and errors
// flow from the first stream to the last. Errors from the last stream
// are not listened for
const foldStreams = (...streams: Readable[]) =>
  streams.reduce((source, dest) =>
    source.once('error', (error) => dest.destroy(error)).pipe(dest as any)
  );
