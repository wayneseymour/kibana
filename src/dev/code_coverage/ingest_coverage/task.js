/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/* eslint new-cap: 0 */
/* eslint no-unused-vars: 0 */

import { exec, execFile } from 'child_process';
import { promisify } from 'util';

import { pipe } from './utils';

export const Task = (fork) => ({
  /**
   * The fn that executes the async computation
   */
  fork,
  /**
   * Functor; Think of this like [].map...you get an array back right?
   * In this case, you get a Task back
   */
  map: (f) => Task((rej, res) => fork(rej, pipe(f, res))),
  /**
   * Monad; makes it possible to compose together an `a -> Task b` fn
   *  with a `b -> Task c` fn,
   *   and get a `a -> Task c` fn
   *   instead of `a -> Task Task c`.
   *   Think of it like [].flatMap.
   */
  chain: (f) => {
    Task((rej, res) => fork(rej, (x) => f(x).fork(rej, res)));
  },
  // fold: (leftFn, rightFn) => {
  //   return Task((rej, res) => {
  //       return fork(
  //         (x) => {d
  //           return leftFn(x).fork(rej, res);
  //         },
  //         (x) => {
  //           return rightFn(x).fork(rej, res);
  //         },
  //       );
  //     }
  //   )
  // },
});

Task.of = (x) => (rej, res) => res(x);
Task.fromPromised = (fn) => (...args) => {
  return Task((rej, res) => {
      return fn(...args)
        .then(x => {
          return res(x);
        })
        .catch(x => {
          return rej(x);
        });
    },
  );
};
Task.rejected = (x) => Task((rej, res) => rej(x));
