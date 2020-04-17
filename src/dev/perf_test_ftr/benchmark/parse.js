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

import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { noop, pretty } from '../utils/utils';
import { fromNullable } from '../utils/either';

// parse :: string -> obj -> void
export const parse = rawLine => log => fromNullable(rawLine).fold(noop, stream(log));

const regexes = {
  succeeded: /a/,
  failed: /b/,
  timeMsecs: /c/,
  timeSecs: /d/,
  name: /e/,
};
function stream(log) {
  return rawLine =>
    of(rawLine)
      .pipe(
        map(obj),
        map(passFail)
        // I THINK WE NEED ANOTHER STREAM TO OBSERVE
        // THAT WILL RUN ALL THE REGEXES, MAYBE
      )
      .subscribe(obj => {
        log.verbose(`### Parsed: \n${pretty(obj)}\n`);
      });
}

function passFail(obj) {
  return {
    ...obj,
  };
}

function obj(rawLine) {
  return {
    rawLine,
  };
}
