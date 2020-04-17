/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint no-unused-vars: 0 */

import expect from '@kbn/expect';
import { resolve } from 'path';
// import { spawn } from 'child_process';
import readline from 'readline';
import { createReadStream } from 'fs';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const ROOT_DIR = resolve(__dirname, '../../../..');
const mockFilePath = 'src/dev/perf_test_ftr/__tests__/__mocks__/3_blank_lines.txt';
const resolvedMockFilePath = resolve(ROOT_DIR, mockFilePath);

const ftrOutputLines$ = ftrOutputFilePath => {
  const rl = readline.createInterface({ input: createReadStream(ftrOutputFilePath) });
  return fromEvent(rl, 'line').pipe(takeUntil(fromEvent(rl, 'close')));
};

describe(`Running the 'perf_test_ftr_benchmark' app / script`, () => {
  // const verboseArgs = ['debug_perf_test_ftr_benchmark', '--verbose', '--line'];

  describe('with verbose turned on', () => {
    it(`should ???`, done => {
      ftrOutputLines$(resolvedMockFilePath).subscribe(
        x => {
          console.log(`\n### x: \n\t${x}`);
        },
        err => console.error(err),
        _ => done()
      );
      expect(true).to.be(true);
    });
  });
});

// function ingestAndMutate(done) {
//   return summaryPathSuffix => args => xs => {
//     const coverageSummaryPath = resolve(MOCKS_DIR, summaryPathSuffix);
//     const opts = [...args, coverageSummaryPath];
//     const ingest = spawn(process.execPath, opts, { cwd: ROOT_DIR, env });
//
//     ingest.stdout.on('data', x => xs.push(x + ''));
//     ingest.on('close', done);
//   };
// }
