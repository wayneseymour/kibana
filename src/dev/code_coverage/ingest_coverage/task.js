/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/* eslint no-unused-vars: 0 */

import { pipe } from './utils';

export const task = (fork) => ({
  fork,
  map: (f) => task((rej, res) => fork(rej, pipe(f, res))),
  chain: (f) => task((rej, res) => fork(rej, (x) => f(x).fork(rej, res))),
  fold: (f, g) =>
    task((rej, res) =>
      fork(
        (x) => f(x).fork(rej, res),
        (x) => g(x).fork(rej, res)
      )
    ),
});

task.of = (x) => (rej, res) => res(x);
task.fromPromised = (fn) => (...args) =>
  task((rej, res) =>
    fn(...args)
      .then(res)
      .catch(rej)
  );
task.rejected = (x) => task((rej, res) => rej(x));
