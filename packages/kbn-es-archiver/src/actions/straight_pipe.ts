/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import { PathLikeOrString, resolveAndAnnotateForDecompression, Annotated } from './load_utils';
import {allWrapper$, archiveEntries, handleStreamToFileWithLimit } from './straight_pipe_utils';

// export const straightPipe = async (pathToArchiveDirectory: PathLikeOrString): Promise<void> => {
//   (await archiveEntries(pathToArchiveDirectory))
//     .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
//     .map(pipe(jsonStanza$Subscription, subscribe));
// };

export const straightPipeAll =
  (pathToArchiveDirectory: PathLikeOrString) =>
  async (...indexingArgs) => {
    (await archiveEntries(pathToArchiveDirectory))
      .map(resolveAndAnnotateForDecompression(pathToArchiveDirectory))
      .forEach((x: Annotated) => {
        const { entryAbsPath, needsDecompression } = x;
        console.log(`\nλjs entryAbsPath: \n\t${entryAbsPath}`);

        allWrapper$(entryAbsPath)(needsDecompression)(handleStreamToFileWithLimit(0))(indexingArgs);
      });
    // .map(pipe(jsonStanza$Subscription, subscribe));
  };
