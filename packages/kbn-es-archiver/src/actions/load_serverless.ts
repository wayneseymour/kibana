/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import * as zlib from 'zlib';
import * as fs from 'fs';
import oboe from 'oboe';
import { pipeline, PassThrough } from 'node:stream';
import { resolve } from 'path';
import { fromEventPattern } from 'rxjs';
import { pipe } from 'fp-ts/lib/function';
import { PathLikeOrString, archiveEntries, ArchivePathEntry } from './load_utils';

const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
  resolve(archivePath as string, x);
const gzip = true;
const readAndUnzip$ = (x) =>
  oboe(
    pipeline(fs.createReadStream(x), gzip ? zlib.createGunzip() : new PassThrough(), (err) => {
      if (err) {
        console.error('Pipeline failed.', err);
      } else {
        console.log('Pipeline succeeded.');
      }
    })
  );
const jsonStanza$ = (pathToFile: PathLikeOrString) => (_: any) =>
  readAndUnzip$(pathToFile).on('done', _);
export const begin = async (pathToArchiveDirectory: PathLikeOrString) => {
  (await archiveEntries(pathToArchiveDirectory))
    .map(resolveEntry(pathToArchiveDirectory))
    .map((resolvedArchiveDirectoryEntry) =>
      pipe(jsonStanza$(resolvedArchiveDirectoryEntry), fromEventPattern).subscribe({
        next: (x) => console.log(`\nλjs streamed - x: \n${JSON.stringify(x, null, 2)}`),
        error: (err) => console.log('error:', err),
        complete: () => console.log('the end'),
      })
    );
};
