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

import { resolve } from 'path';
import { prok } from '../lib/process';
import { run, createFlagError } from '@kbn/dev-utils';

const ROOT = resolve(__dirname, '../../../..');
const flags = {
  string: ['extPath', 'verbose'],
  help: `
--extPath             Required, path to the directory in which the testing will be performed
        `,
};

export function runPerformanceTests() {
  run(
    ({ flags, log }) => {
      if (flags.extPath === '') throw createFlagError('please provide a single --extPath flag');
      if (flags.verbose) log.verbose(`### Verbose logging enabled`);

      const resolveExternalPath = resolve.bind(null, `${ROOT}/../..`);
      const externalPath = resolveExternalPath(flags.extPath);
      prok(externalPath)(log);
    },
    {
      description: `

Run FTR performance tests

Examples:
???
      `,
      flags,
    }
  );
}
