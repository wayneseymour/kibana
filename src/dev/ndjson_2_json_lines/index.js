/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { resolve } from 'path';
import { run } from '@kbn/dev-cli-runner';
import { pathExists, convert } from './convert';

const ROOT = resolve(__dirname, '../../..');
const flags = {
  string: ['src', 'dest', 'verbose'],
  help: `
--src             Required, path to the file to be converted.
--dest            Required, path to the desired output file.
        `,
};
const resolveRoot = resolve.bind(null, ROOT);

export function convert2JsonLines() {
  run(
    ({ flags, log }) => {
      const src = resolveRoot(flags.src);
      const dest = resolveRoot(flags.dest);

      pathExists(src).truthy ? convert(log)(src)(dest) : log.error(`Does not exist: ${src}`);
    },
    {
      description: `

Convert kibana ndjson into "json lines".
Great for using with "jq".

$ node scripts/ndjson_2_json_lines.js --src test/functional/fixtures/es_archiver/SOME-ARCHIVE/data.json --dest test/functional/fixtures/es_archiver/SOME-ARCHIVE/json_lines.json

      `,
      flags,
    }
  );
}
