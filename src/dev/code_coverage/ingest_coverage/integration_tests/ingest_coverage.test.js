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

import expect from '@kbn/expect';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { green, always as F } from '../utils';

import { STATIC_SITE_URL_PROP_NAME, TOTALS_INDEX, COVERAGE_INDEX } from '../constants';

const ROOT_DIR = resolve(__dirname, '../../../../..');
const MOCKS_DIR = resolve(__dirname, './mocks');
const staticSiteUrlRegexes = {
  staticHostIncluded: /https:\/\/kibana-coverage\.elastic\.dev/,
  jobNameIncluded: /jobs\/elastic\+kibana\+code-coverage/,
  timeStampIncluded: /\d{4}-\d{2}-\d{2}T\d{2}.*\d{2}.*\d{2}Z/,
};
const env = {
  BUILD_ID: 407,
  CI_RUN_URL: 'https://kibana-ci.elastic.co/job/elastic+kibana+code-coverage/407/',
  STATIC_SITE_URL_BASE: 'https://kibana-coverage.elastic.dev/jobs/elastic+kibana+code-coverage',
  TIME_STAMP: '2020-03-02T21:11:47Z',
  ES_HOST: 'https://super:changeme@some.fake.host:9243',
  NODE_ENV: 'integration_test',
};
const includesSiteUrlPredicate = x => x.includes(STATIC_SITE_URL_PROP_NAME);
const siteUrlLines = specificLinesOnly(includesSiteUrlPredicate);
const splitByNewLine = x => x.split('\n');
const siteUrlsSplitByNewLine = siteUrlLines(splitByNewLine);
const siteUrlsSplitByNewLineWithoutBlanks = siteUrlsSplitByNewLine(notBlankLines);

describe('Ingesting Coverage to Cluster', () => {
  const verboseArgs = [ 'scripts/ingest_coverage.js', '--verbose', '--path', ];

  const justTotalPath = 'jest-combined/coverage-summary-just-total.json';
  const noTotalsPath = 'jest-combined/coverage-summary-NO-total.json';
  const bothIndexesPath = 'jest-combined/coverage-summary-manual-mix.json';

  describe('with NODE_ENV set to "integration_test"', () => {
    describe(`and debug || verbose turned on`, () => {

      describe(`to the [${TOTALS_INDEX}] index`, () => {
        const mutableTotalsIndexLoggingChunks = [];
        beforeAll(done => {
          const ingestAndMutateAsync = ingestAndMutate(done);
          const ingestAndMutateAsyncWithPath = ingestAndMutateAsync(justTotalPath);
          const verboseIngestAndMutateAsyncWithPath = ingestAndMutateAsyncWithPath(verboseArgs);

          verboseIngestAndMutateAsyncWithPath(mutableTotalsIndexLoggingChunks);
        });

        it(`should say it's Just Logging when sending to the totals index: [${TOTALS_INDEX}]`, () => {
          const actual = mutableTotalsIndexLoggingChunks.filter(x => x.includes('debg ### Just Logging'));
          const re = new RegExp(TOTALS_INDEX);
          expect(re.test(actual)).to.be(true);
        });

        it(`should have a link to the index page for the specific test runner`, () => {
          const totalsIndexRegexes = {
            ...staticSiteUrlRegexes,
            folderStructureIncluded: /live_cc_app\//,
            endsInDotHtml: /.html$/,
          };

          const justUrl = text => x =>
            x.split(text)[1].trim()

          const splitFromText = justUrl('staticSiteUrl:');

            siteUrlsSplitByNewLineWithoutBlanks(mutableTotalsIndexLoggingChunks)
              .filter(x => x.includes('### staticSiteUrl'))
              .map(splitFromText)
              .forEach(expectAllRegexesToPass(totalsIndexRegexes))
        });

      });
      describe(`to the [${COVERAGE_INDEX}] index`, () => {
        const mutableCoverageIndexChunks = [];

        beforeAll(done => {
          const ingestAndMutateAsync = ingestAndMutate(done);
          const ingestAndMutateAsyncWithPath = ingestAndMutateAsync(noTotalsPath);
          const verboseIngestAndMutateAsyncWithPath = ingestAndMutateAsyncWithPath(verboseArgs);
          verboseIngestAndMutateAsyncWithPath(mutableCoverageIndexChunks);
        });

        it('should result in every posted item having a site url that meets all regex assertions',
          F(siteUrlsSplitByNewLineWithoutBlanks(mutableCoverageIndexChunks)
            .forEach(expectAllRegexesToPass({
                ...staticSiteUrlRegexes,
                folderStructureIncluded: /live_cc_app\/coverage_data\/(?:.*|.*-combined)\//,
                endsInDotJsDotHtml: /.js.html$/,
              }),
            ),
          ),
        );

        describe(`with a jsonSummaryPath containing the text 'combined'`, () => {
          const combinedMsg = 'combined';

          const because = 'currently, they are all combined, per how we merge them in ci using "nyc"';
          it(`should always result in a distro of ${combinedMsg}, because: ${because}`, () => {
            const includesDistroPredicate = x => x.includes('distro');
            const distroLines = specificLinesOnly(includesDistroPredicate);
            const distroLinesSplitByNewLine = distroLines(splitByNewLine);
            const distroLinesSplitByNewLineWithoutBlanks = distroLinesSplitByNewLine(notBlankLines);

            distroLinesSplitByNewLineWithoutBlanks(mutableCoverageIndexChunks)
              .filter(includesDistroPredicate)
              .forEach(x => expect(x).to.contain(combinedMsg));
          });
        });
      });

      describe(`to both indexes in the same push`, () => {
        const mutableBothIndexesChunks = [];

        beforeAll(done => {
          const ingestAndMutateAsync = ingestAndMutate(done);
          const ingestAndMutateAsyncWithPath = ingestAndMutateAsync(bothIndexesPath);
          const verboseIngestAndMutateAsyncWithPath = ingestAndMutateAsyncWithPath(verboseArgs);
          verboseIngestAndMutateAsyncWithPath(mutableBothIndexesChunks);
        });

        it('should result in every posted item having a site url that meets all regex assertions',
          F(siteUrlsSplitByNewLineWithoutBlanks(mutableBothIndexesChunks)
            .forEach(expectAllRegexesToPass({
              ...staticSiteUrlRegexes,
              folderStructureIncluded: /live_cc_app\/coverage_data\/(?:.*|.*-combined)\//,
            }))
          )
        );

        it('should result in the "just logging" message being present in the log', () => {
          expect(mutableBothIndexesChunks.some(x => x.includes('Just Logging'))).to.be(true);
        });
        it('should result in the "actually sending" message NOT being present in the log', () => {
          expect(mutableBothIndexesChunks.every(x => !x.includes('Actually sending...'))).to.be(true);
        });
      });

    });
  });

});

function ingestAndMutate (done) {
  return summaryPathSuffix => args => xs => {
    const coverageSummaryPath = resolve(MOCKS_DIR, summaryPathSuffix);
    const opts = [
      ...args,
      coverageSummaryPath,
    ];
    const ingest = spawn(process.execPath, opts, { cwd: ROOT_DIR, env });

    ingest.stdout.on('data', x => xs.push(x + ''));
    ingest.on('close', done);
  };
}

function specificLinesOnly (predicate) {
  return splitByNewLine => notBlankLines => xs =>
    xs.filter(predicate)
      .map(x => splitByNewLine(x).reduce(notBlankLines));
}

function notBlankLines (acc, item) {
  if (item != '') return item;
  return acc;
}

function expectAllRegexesToPass (staticSiteUrlRegexes) {
  return urlLine =>
    Object.entries(staticSiteUrlRegexes)
      .forEach(regexTuple => {
        if (!regexTuple[1].test(urlLine))
          throw new Error(`\n### ${green('FAILED')} Asserting: [${regexTuple[0]}]\n\tAgainst: [\n${urlLine}\n]`);
      });
}
