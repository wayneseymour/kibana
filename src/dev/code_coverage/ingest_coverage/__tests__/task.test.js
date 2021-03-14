/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import request from 'request';
import superagent from 'superagent';

import { task } from '../task';
import { promisify } from 'util';
import { pipe } from '../utils';
import { exec } from 'child_process';

describe(`task monad`, () => {
  const url = 'https://jsonplaceholder.typicode.com/users/1/todos';
  const body = (x) => x.body;
  const first = (xs) => xs[0];
  const title = (x) => x.title;
  const throwNew = (e) => {
    throw new Error(e);
  };
  describe(`used with a fn expecting an async callback`, () => {
    it(`should handle the payload in the fork functions's resolve fn (the second arg to .fork)`, () => {
      task((reject, resolve) => request(url, (err, data) => (err ? reject(err) : resolve(data))))
        .map(pipe(body, JSON.parse, first, title))
        .fork(throwNew, (x) => expect(x).toBe('delectus aut autem'));
    });
  });
  describe(`used with a promise fn`, () => {
    it(`should handle success in the resolve handler`, () => {
      const execP = promisify(exec);
      const exectaskFromPromise = task.fromPromised(execP);
      const grepCmd =
        'grep x-pack/plugins/lens/public/editor_frame_service/editor_frame/save.ts src/dev/code_coverage/ingest_coverage/__tests__/mocks/team_assign_mock.txt';
      const grep = exectaskFromPromise(grepCmd);

      grep
        .map(pipe((x) => x.stdout, (x) => x.trim()))
        .fork(throwNew, (x) => {
          expect(x).toBe(
            'x-pack/plugins/lens/public/editor_frame_service/editor_frame/save.ts kibana-app'
          );
        });
    });
    describe(`that calls a bad url`, () => {
      it(`should handle the error in the rejected handler`, () => {
        task
          .fromPromised((x) => superagent.get(x))('http://stop.com')
          .fork((e) => expect(e.code).toBe('ENOTFOUND'), throwNew);
      });
    });
  });
});
