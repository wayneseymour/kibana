/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import { pipe } from 'fp-ts/lib/function';
import {
  PathLikeOrString,
  archiveEntries,
  prepareForStanzation,
  subscription,
  subscribe,
} from './load_utils';

export const straightPipe = async (pathToArchiveDirectory: PathLikeOrString): Promise<void> => {
  (await archiveEntries(pathToArchiveDirectory))
    .map(prepareForStanzation(pathToArchiveDirectory)) // This internal iteration is only handling 2 strings
    .map(pipe(subscription, subscribe));
};
