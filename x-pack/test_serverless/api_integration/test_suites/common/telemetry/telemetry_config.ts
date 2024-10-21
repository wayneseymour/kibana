/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect } from 'expect';
import { SupertestWithRoleScopeType } from '@kbn/test-suites-xpack/api_integration/deployment_agnostic/services';
import { FtrProviderContext } from '../../../ftr_provider_context';

export default function telemetryConfigTest({ getService }: FtrProviderContext) {
  const roleScopedSupertest = getService('roleScopedSupertest');
  let supertestAdminWithApiKey: SupertestWithRoleScopeType;
  let supertestAdminWithCookieCredentials: SupertestWithRoleScopeType;

  describe('/api/telemetry/v2/config API Telemetry config', function () {
    // see details: https://github.com/elastic/kibana/issues/197009
    this.tags(['failsOnMKI']);
    before(async () => {
      supertestAdminWithApiKey = await roleScopedSupertest.getSupertestWithRoleScope('admin', {
        withCommonHeaders: true,
      });
      supertestAdminWithCookieCredentials = await roleScopedSupertest.getSupertestWithRoleScope(
        'admin',
        {
          useCookieHeader: true,
          withInternalHeaders: true,
        }
      );
    });

    after(async () => {
      await supertestAdminWithApiKey.destroy();
    });

    const baseConfig = {
      allowChangingOptInStatus: false,
      optIn: true,
      sendUsageFrom: 'server',
      telemetryNotifyUserAboutOptInDefault: false,
    };

    it('GET should get the default config', async () => {
      const { body } = await supertestAdminWithApiKey.get('/api/telemetry/v2/config').expect(200);

      expect(body).toMatchObject(baseConfig);
    });

    it('GET should get updated labels after dynamically updating them', async () => {
      const { body: initialConfig } = await supertestAdminWithApiKey
        .get('/api/telemetry/v2/config')
        .expect(200);

      await supertestAdminWithCookieCredentials
        .put('/internal/core/_settings')
        .set('elastic-api-version', '1')
        .send({ 'telemetry.labels.journeyName': 'my-ftr-test' })
        .expect(200, { ok: true });

      await supertestAdminWithApiKey.get('/api/telemetry/v2/config').expect(200, {
        ...initialConfig,
        labels: {
          ...initialConfig.labels,
          journeyName: 'my-ftr-test',
        },
      });

      // Sends "null" to remove the label
      await supertestAdminWithCookieCredentials
        .put('/internal/core/_settings')
        .set('elastic-api-version', '1')
        .send({ 'telemetry.labels.journeyName': null })
        .expect(200, { ok: true });

      await supertestAdminWithApiKey.get('/api/telemetry/v2/config').expect(200, initialConfig);
    });
  });
}
