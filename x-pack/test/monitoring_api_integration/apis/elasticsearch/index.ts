/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../../api_integration/ftr_provider_context';
import { installPackage } from '../../packages';

export default function ({ loadTestFile, getService }: FtrProviderContext) {
  describe('Elasticsearch', () => {
    before(() => installPackage(getService('supertest'), 'elasticsearch'));

    loadTestFile(require.resolve('./ccr'));
    // @klacabane will handle un-skipping the tests wittin ./indices
    // loadTestFile(require.resolve('./indices'));
    loadTestFile(require.resolve('./ml_jobs'));
    loadTestFile(require.resolve('./nodes'));
    loadTestFile(require.resolve('./overview'));
  });
}
