/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

import oboe from 'oboe';
import { pipeline } from 'node:stream';
import fs from 'fs';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { toError } from 'fp-ts/Either';
import { readdir } from 'fs/promises';
import {
  appendToFile,
  errFilePath,
  handlePipelinedStreams,
  passThroughOrDecompress,
  PathLikeOrString,
  PredicateFn,
} from './load_utils';
import { createCreateIndexStream as originalMakeIndexOrDataStreamStream } from '../lib';

const doesNotStartWithADot: PredicateFn = (x) => !x.startsWith('.');
const readDirectory = (predicate: PredicateFn) => {
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
    TE.getOrElse(handleErrToFile(errFilePath)(archivePath))
  )();

const pipelineAll =
  (needsDecompression: boolean) => (entryAbsPath: PathLikeOrString) => (indexingArgs) => {
    return oboe(
      pipeline(
        fs.createReadStream(entryAbsPath),
        passThroughOrDecompress(needsDecompression),
        originalMakeIndexOrDataStreamStream(indexingArgs),
        // new PassThrough(),
        handlePipelinedStreams(entryAbsPath)
      )
    );
  };
export const allWrapper$ =
  (entryAbsPath: PathLikeOrString) =>
  (needsDecompression: boolean) =>
  (handler: () => any) =>
  (indexingArgs) =>
    // readAndMaybeUnzipUsingSaxParserThenMakeIndexOrDataStream$(needsDecompression)(entryAbsPath)(
    //   indexingArgs
    // ).on('done', handler);
    pipelineAll(needsDecompression)(entryAbsPath)(indexingArgs).on('done', handler);

const FILE_OUT_RECORD_LIMIT = process.env.FILE_OUT_RECORD_LIMIT ?? 3;
const fileOutRecordLimitNotReached = (counter: number): boolean => counter < FILE_OUT_RECORD_LIMIT;
export const handleStreamToFileWithLimit =
  (counter: number) =>
  (record: any): void => {
    if (fileOutRecordLimitNotReached(counter))
      appendToFile((): string => 'stream_out.txt')(JSON.stringify(record, null, 2));
    counter++;
  };

const handleErrToFile = (filePathF: () => string) => (archivePath: string) => (reason: Error) => {
  const failedMsg = `${JSON.stringify({ ...reason, archiveThatFailed: archivePath }, null, 2)}`;

  try {
    throw new Error(`${reason}`);
  } catch (err) {
    console.warn(failedMsg);
    appendToFile(filePathF)(failedMsg);
  }

  return toError(reason);
};
