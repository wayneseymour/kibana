/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { flow, identity, pipe } from 'fp-ts/lib/function'
import * as Password from './password'
import crypto from 'crypto'
import * as E from 'fp-ts/lib/Either'

const pipeline = flow(
  Password.of,
  Password.validate({ minLength: 8, capitalLetterRequired: true }),
  E.map(
    Password
      .hash((value) => crypto.createHash('md5').update(value).digest('hex'),
    ),
  ),
)

export const runTaskEitherDemo = () => {
  console.log(pipe('pw123', pipeline))
  console.log(pipe('Password123', pipeline))//?
};

runTaskEitherDemo();
