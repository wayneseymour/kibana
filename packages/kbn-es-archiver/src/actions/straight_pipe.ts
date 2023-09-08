/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import { pipe } from 'fp-ts/lib/function';
import {
  PathLikeOrString,
  archiveEntries,
  resolveAndAnnotateForDecompression,
  jsonStanza$Subscription,
  subscribe,
  Annotated,
  appendToFile,
  saxParserJsonStanzaThenCreateIndex$,
} from './load_utils';

export const straightPipe = async (pathToArchiveDirectory: PathLikeOrString): Promise<void> => {
  (await archiveEntries(pathToArchiveDirectory))
    .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory)) // This internal iteration is only handling 2 strings
    .map(pipe(jsonStanza$Subscription, subscribe));
};

const handleStreamToFile = (counter: number) => (record: any) => {
  counter < 5
    ? // counter > 86_200
      appendToFile(() => 'stream_out.txt')(JSON.stringify(record, null, 2))
    : () => {};
  counter++;
};

export const straightPipeWithIndexCreation =
  (pathToArchiveDirectory: PathLikeOrString) =>
  // async ({ client, stats, skipExisting, docsOnly, log }) => {
  async (...indexingArgs) => {
    (await archiveEntries(pathToArchiveDirectory))
      .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory)) // This internal iteration is only handling 2 strings
      .forEach((x: Annotated) => {
        const { entryAbsPath, needsDecompression } = x;
        console.log(`\nλjs entryAbsPath: \n\t${entryAbsPath}`);

        const i: number = 0;
        // saxParserJsonStanza$(entryAbsPath)(needsDecompression)(handleStreamToFile(i));
        saxParserJsonStanzaThenCreateIndex$(entryAbsPath)(needsDecompression)(
          handleStreamToFile(i)
        )(indexingArgs);
      });
    // .map(pipe(jsonStanza$Subscription, subscribe));
  };
