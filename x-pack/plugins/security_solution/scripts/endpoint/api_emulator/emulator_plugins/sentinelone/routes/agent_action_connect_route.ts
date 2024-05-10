/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ExternalEdrServerEmulatorRouteHandlerMethod } from '../../..';
import { buildSentinelOneRoutePath } from './utils';
import type { EmulatorServerRouteDefinition } from '../../../lib/emulator_server.types';

export const getAgentActionConnectRouteDefinition = (): EmulatorServerRouteDefinition => {
  return {
    path: buildSentinelOneRoutePath('/agents/actions/connect'),
    method: 'POST',
    handler: connectActionRouteHandler,
  };
};

const connectActionRouteHandler: ExternalEdrServerEmulatorRouteHandlerMethod<
  {},
  {},
  {
    filter: {
      ids: string;
    };
  }
> = async (request) => {
  return {
    data: {
      affected: request.payload.filter.ids.split(',').length,
    },
  };
};
