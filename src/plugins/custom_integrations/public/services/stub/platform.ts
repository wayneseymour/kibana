/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { CustomIntegrationsPlatformService } from '../platform';
import { PluginServiceFactory } from '../types';
import { CustomIntegrationsStartDependencies } from '../../types';

/**
 * A type definition for a factory to produce the `CustomIntegrationsPlatformService` with stubbed output.
 */
export type CustomIntegrationsPlatformServiceFactory = PluginServiceFactory<
  CustomIntegrationsPlatformService,
  CustomIntegrationsStartDependencies
>;

/**
 * A factory to produce the `CustomIntegrationsPlatformService` with stubbed output.
 */
export const platformServiceFactory: CustomIntegrationsPlatformServiceFactory = () => ({
  getBasePath: () => '/basePath',
  getAbsolutePath: (path: string): string => `https://example.com/basePath${path}`,
});
