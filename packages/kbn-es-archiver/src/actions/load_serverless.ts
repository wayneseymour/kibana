/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one * or more contributor license agreements. Licensed under the Elastic License * 2.0 and the Server Side Public License, v 1; you may not use this file except * in compliance with, at your election, the Elastic License 2.0 or the Server * Side Public License, v 1. */

import * as zlib from 'zlib';
import * as fs from 'fs';
import oboe from 'oboe';
import { resolve } from 'path';
import { PathLikeOrString, archiveEntries, ArchivePathEntry } from './load_utils';

const toStr = (x: BufferSource) => `${x}`;
const noop = () => {};
const resolveEntry = (archivePath: PathLikeOrString) => (x: ArchivePathEntry) =>
  resolve(archivePath as string, x);
const readAndUnzip$ = (x) => oboe(fs.createReadStream(x).pipe(zlib.createGunzip()));
const jsonStanza$ = (x) =>
  readAndUnzip$(x).on('done', function theUglyCallback(obj) {
    console.log(`\nλjs obj: \n${JSON.stringify(obj, null, 2)}`);
    // process.exit(666); // Trez Exit Expression
  });
export const begin = async (pathToArchiveDirectory: PathLikeOrString) => {
  (await archiveEntries(pathToArchiveDirectory)) // an array of one or two strings
    .map(resolveEntry(pathToArchiveDirectory)) // map the agove array into relative paths
    .map((entry) => {
      jsonStanza$(entry); // stream the contents (unzipped), via a callback
    });
};
