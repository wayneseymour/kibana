/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

/* eslint no-console: ["error",{ allow: ["log", "warn"] }] */

// This just 'outs' the records to the terminal
// export const straightPipe = async (pathToArchiveDirectory: PathLikeOrString): Promise<void> => {
//   (await archiveEntries(pathToArchiveDirectory))
//     .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
//     .map(pipe(jsonStanza$Subscription, subscribe));
// };

import { PathLikeOrString, resolveAndAnnotateForDecompression, Annotated } from './load_utils';
import {
  pipelineAll,
  archiveEntries,
  handleStreamToFileWithLimit,
  prependStreamOut,
  Void2String,
} from './straight_pipe_utils';

const streamOutF: Void2String = () => 'stream_out.txt';

export const straightPipeAll =
  (pathToArchiveDirectory: PathLikeOrString) =>
  async (...indexOrDataStreamCreationArgs) => {
    prependStreamOut(streamOutF);
    (await archiveEntries(pathToArchiveDirectory))
      .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
      .forEach((x: Annotated) => {
        const { entryAbsPath, needsDecompression } = x;
        pipelineAll(needsDecompression)(entryAbsPath)(indexOrDataStreamCreationArgs).on(
          'done',
          (shouldBeASingleRecord) => {
            handleStreamToFileWithLimit(streamOutF)(0)(shouldBeASingleRecord);
          }
        );
      });
  };
