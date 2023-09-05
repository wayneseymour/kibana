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
  readAndUnzip$(x).on('done', (obj) => {
    console.log(`\nλjs obj: \n${JSON.stringify(obj, null, 2)}`);
    // process.exit(666); // Trez Exit Expression
  });
export const begin = async (pathToArchiveDirectory: PathLikeOrString) => {
  // pathToArchiveDirectory =
  //   "/Users/trezworkbox/dev/main.worktrees/can-we-oboe/x-pack/test/functional/es_archives/ml/farequote/data.json.gz";
  // "/Users/trezworkbox/dev/main.worktrees/can-we-oboe/myfarequote.txt"
  // "/Users/trezworkbox/dev/main.worktrees/straight-pipe-using-sax-parser/x-pack/test/functional/es_archives/logstash_functional/data.json.gz";
  // console.log(`\nλjs pathToArchiveDirectory: \n\t${pathToArchiveDirectory}`);

  (await archiveEntries(pathToArchiveDirectory))
    .map(resolveEntry(pathToArchiveDirectory))
    .map((entry) => {
      jsonStanza$(entry);
    });
};
