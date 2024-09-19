/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { Story } from '@storybook/react';
import { FieldReadOnly } from '../../field_readonly';
import type { DiffableRule } from '../../../../../../../../../common/api/detection_engine';
import { SeverityMappingReadOnly } from './severity_mapping';
import { mockCustomQueryRule } from '../../storybook/mocks';

export default {
  component: SeverityMappingReadOnly,
  title:
    'Rule Management/Prebuilt Rules/Upgrade Flyout/ThreeWayDiff/FieldReadOnly/severity_mapping',
};

interface TemplateProps {
  finalDiffableRule: DiffableRule;
}

const Template: Story<TemplateProps> = (args) => {
  return <FieldReadOnly fieldName="severity_mapping" finalDiffableRule={args.finalDiffableRule} />;
};

export const Default = Template.bind({});

Default.args = {
  finalDiffableRule: mockCustomQueryRule({
    severity_mapping: [
      {
        field: 'event.severity',
        operator: 'equals',
        severity: 'low',
        value: 'LOW',
      },
      {
        field: 'google_workspace.alert.metadata.severity',
        operator: 'equals',
        severity: 'high',
        value: 'VERY HIGH',
      },
    ],
  }),
};
