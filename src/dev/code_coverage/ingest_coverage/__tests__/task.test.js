/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import request from 'request';
import superagent from 'superagent';
import { promisify } from 'util';
import { Task } from '../task';
import { exec } from 'child_process';
import { REPO_ROOT } from '@kbn/dev-utils';
import { join } from 'path';

const id = (x) => x;

describe(`task monad`, () => {
  const body = (x) => x.body;
  const url = 'https://jsonplaceholder.typicode.com/users/1/todos';
  it(`should eval when fork is called`, () => {
    Task((rej, res) => {
      setTimeout(() => {
        res(1);
      }, 5000);
    })
      .map((one) => one + 2)
      .map((three) => three * 2)
      .fork(x => console.error(`\n### x: \n\t${x}`), (x) => {
        expect(x).toBe(7);
      });
  });
  it(`should not eval until fork is called (assign to var and eval later)`, () => {
    const deferred = Task((rej, res) => {
      setTimeout(() => {
        res(1);
      }, 5000);
    })
      .map((one) => one + 2)
      .map((three) => three * 2);

    deferred
      .fork(x => console.error(`\n### x: \n\t${x}`), (x) => {
        expect(x).toBe(7);
      });
  });
  describe(`'of' fn`, () => {
    it(`should ???`, () => {

    });
  });
  describe(`used with a fn expecting an async callback`, () => {
    it(`should handle the payload in the fork functions's resolve fn (the second arg to .fork)`, () => {
      Task((reject, resolve) => request(url, (err, data) => (err ? reject(err) : resolve(data))))
        .map(body)
        .fork(console.error, (x) => expect(x).toBeTruthy());
    });
  });
  describe(`used with a promise fn`, () => {
    describe(`that calls a bad url`, () => {
      it(`should handle the error in the rejected handler`, () => {
        Task.fromPromised((x) => superagent.get(x))('http://stop.com').fork(
          (e) => expect(e).toBeTruthy(),
          id,
        );
      });
      describe(`that evals successfuly`, () => {
        const execP = promisify(exec);
        const lsTaskFromPromise = Task.fromPromised(execP);
        it(`should handle the success in the resolve fn`, () => {
          lsTaskFromPromise(`ls ${join(REPO_ROOT, 'package.json')}`)
            .map(x => x.stdout)
            .map(x => x.trim())
            .fork(throwLeftFn, x => {
              expect(x).toBe('/Users/tre/development/projects/kibana/package.json');
            });
        });
        describe(`and is used as a var`, () => {
          it(`should still handle the success in the resolve fn`, () => {
            const aTask = lsTaskFromPromise(`ls ${join(REPO_ROOT, 'package.json')}`)
              .map(x => x.stdout)
              .map(x => x.trim())

            aTask
              .fork(throwLeftFn, x => {
                expect(x).toBe('/Users/tre/development/projects/kibana/package.json');
              });

          });
        });
      });
    });
  });
});

function throwLeftFn (x) {
  throw new Error(x);
}
