/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import readline from 'readline';
import { createReadStream, statSync, writeFileSync } from 'fs';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const blockEndRe = /^}$/;
const encoding = 'utf8';
const appendUtf8 = { flag: 'a', encoding };
const dropWhiteSpace = (x) => x.replaceAll(/\s/g, '');

export const convert = (log) => (src) => (dest) => {
  log.verbose(`\n### Processing: \n\t${src}`);

  const flush = writeFileSync.bind(null, dest);
  const overwrite = flush.bind(null, '');

  overwrite();

  const next = (line) => {
    flush(dropWhiteSpace(line), appendUtf8);
    if (blockEndRe.test(line)) flush(`\n`, appendUtf8);
  };

  const rl = readline.createInterface({ input: createReadStream(src) });
  fromEvent(rl, 'line')
    .pipe(takeUntil(fromEvent(rl, 'close')))
    .subscribe({
      next,
      error: (e) => log.error(e),
      complete: () => log.verbose('\n### Complete'),
    });
};

const tryCatch = (f) => {
  try {
    return {
      truthy: true,
      _: f(),
    };
  } catch (e) {
    return {
      truthy: false,
      _: e,
    };
  }
};

export const pathExists = (x) => tryCatch(() => statSync(x));
