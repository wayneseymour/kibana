/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export const ADD_EXCEPTION_BTN = '[data-test-subj="add-exception-menu-item"]';

export const ADD_ENDPOINT_EXCEPTION_BTN = '[data-test-subj="add-endpoint-exception-menu-item"]';

export const ALERT_COUNT_TABLE_FIRST_ROW_COUNT =
  '[data-test-subj="alertsCountTable"] tr:nth-child(1) td:nth-child(2) .euiTableCellContent__text';

export const ALERT_CHECKBOX = '[data-test-subj~="select-event"].euiCheckbox__input';

export const ALERT_GRID_CELL = '[data-test-subj="dataGridRowCell"]';

export const ALERT_RULE_NAME = '[data-test-subj="formatted-field-kibana.alert.rule.name"]';

export const ALERT_RISK_SCORE = '[data-test-subj="formatted-field-kibana.alert.risk_score"]';

export const ALERT_SEVERITY = '[data-test-subj="formatted-field-kibana.alert.severity"]';

export const ALERT_DATA_GRID = '[data-test-subj="euiDataGridBody"]';

export const ALERTS = '[data-test-subj="events-viewer-panel"][data-test-subj="event"]';

export const ALERTS_COUNT =
  '[data-test-subj="events-viewer-panel"] [data-test-subj="server-side-event-count"]';

export const ALERTS_TREND_SIGNAL_RULE_NAME_PANEL =
  '[data-test-subj="render-content-kibana.alert.rule.name"]';

export const CLOSE_ALERT_BTN = '[data-test-subj="close-alert-status"]';

export const CLOSE_SELECTED_ALERTS_BTN = '[data-test-subj="close-alert-status"]';

export const CLOSED_ALERTS_FILTER_BTN = '[data-test-subj="closedAlerts"]';

export const DESTINATION_IP = '[data-test-subj^=formatted-field][data-test-subj$=destination\\.ip]';

export const EMPTY_ALERT_TABLE = '[data-test-subj="tGridEmptyState"]';

export const EXPAND_ALERT_BTN = '[data-test-subj="expand-event"]';

export const TAKE_ACTION_BTN = '[data-test-subj="take-action-dropdown-btn"]';

export const TAKE_ACTION_MENU = '[data-test-subj="takeActionPanelMenu"]';

export const CLOSE_FLYOUT = '[data-test-subj="euiFlyoutCloseButton"]';

export const GROUP_BY_TOP_INPUT = '[data-test-subj="groupByTop"] [data-test-subj="comboBoxInput"]';

export const HOST_NAME = '[data-test-subj^=formatted-field][data-test-subj$=host\\.name]';

export const ACKNOWLEDGED_ALERTS_FILTER_BTN = '[data-test-subj="acknowledgedAlerts"]';

export const LOADING_ALERTS_PANEL = '[data-test-subj="loading-alerts-panel"]';

export const MANAGE_ALERT_DETECTION_RULES_BTN = '[data-test-subj="manage-alert-detection-rules"]';

export const MARK_ALERT_ACKNOWLEDGED_BTN = '[data-test-subj="acknowledged-alert-status"]';

export const ALERTS_REFRESH_BTN = '[data-test-subj="querySubmitButton"]';

export const ALERTS_HISTOGRAM_PANEL_LOADER = '[data-test-subj="loadingPanelAlertsHistogram"]';

export const ALERTS_CONTAINER_LOADING_BAR = '[data-test-subj="events-container-loading-true"]';

export const NUMBER_OF_ALERTS =
  '[data-test-subj="events-viewer-panel"] [data-test-subj="server-side-event-count"]';

export const OPEN_ALERT_BTN = '[data-test-subj="open-alert-status"]';

export const OPENED_ALERTS_FILTER_BTN = '[data-test-subj="openAlerts"]';

export const OPEN_ALERT_DETAILS_PAGE_CONTEXT_MENU_BTN =
  '[data-test-subj="open-alert-details-page-menu-item"]';

export const PROCESS_NAME_COLUMN = '[data-test-subj="dataGridHeaderCell-process.name"]';
export const PROCESS_NAME = '[data-test-subj="formatted-field-process.name"]';

export const REASON =
  '[data-test-subj="dataGridRowCell"][data-gridcell-column-id="kibana.alert.reason"]';

export const RISK_SCORE = '[data-test-subj^=formatted-field][data-test-subj$=risk_score]';

export const RULE_NAME = '[data-test-subj^=formatted-field][data-test-subj$=rule\\.name]';

export const SELECTED_ALERTS = '[data-test-subj="selectedShowBulkActionsButton"]';

export const SELECT_AGGREGATION_CHART = '[data-test-subj="chart-select-table"]';

export const SEND_ALERT_TO_TIMELINE_BTN = '[data-test-subj="send-alert-to-timeline-button"]';

export const OPEN_ANALYZER_BTN = '[data-test-subj="view-in-analyzer"]';

export const ANALYZER_NODE = '[data-test-subj="resolver:node"';

export const SEVERITY = '[data-test-subj^=formatted-field][data-test-subj$=severity]';

export const SOURCE_IP = '[data-test-subj^=formatted-field][data-test-subj$=source\\.ip]';

export const TAKE_ACTION_POPOVER_BTN = '[data-test-subj="selectedShowBulkActionsButton"]';

export const TIMELINE_CONTEXT_MENU_BTN = '[data-test-subj="timeline-context-menu-button"]';

export const TIMELINE_CONTEXT_MENU = '[data-test-subj="actions-context-menu"]';

export const USER_NAME = '[data-test-subj^=formatted-field][data-test-subj$=user\\.name]';

export const ATTACH_ALERT_TO_CASE_BUTTON = '[data-test-subj="add-to-existing-case-action"]';

export const ATTACH_TO_NEW_CASE_BUTTON = '[data-test-subj="add-to-new-case-action"]';

export const USER_COLUMN = '[data-gridcell-column-id="user.name"]';

export const HOST_RISK_HEADER_COLIMN =
  '[data-test-subj="dataGridHeaderCell-host.risk.calculated_level"]';

export const HOST_RISK_COLUMN = '[data-gridcell-column-id="host.risk.calculated_level"]';

export const USER_RISK_HEADER_COLIMN =
  '[data-test-subj="dataGridHeaderCell-user.risk.calculated_level"]';

export const USER_RISK_COLUMN = '[data-gridcell-column-id="user.risk.calculated_level"]';

export const ACTION_COLUMN = '[data-gridcell-column-id="default-timeline-control-column"]';

export const DATAGRID_CHANGES_IN_PROGRESS = '[data-test-subj="body-data-grid"] .euiProgress';

export const EVENT_CONTAINER_TABLE_LOADING = '[data-test-subj="events-container-loading-true"]';

export const EVENT_CONTAINER_TABLE_NOT_LOADING =
  '[data-test-subj="events-container-loading-false"]';

export const FILTER_BADGE = '[data-test-subj^="filter-badge"]';

export const CELL_FILTER_IN_BUTTON =
  '[data-test-subj="dataGridColumnCellAction-security-default-cellActions-filterIn"]';
export const CELL_FILTER_OUT_BUTTON =
  '[data-test-subj="dataGridColumnCellAction-security-default-cellActions-filterOut"]';
export const CELL_ADD_TO_TIMELINE_BUTTON =
  '[data-test-subj="dataGridColumnCellAction-security-default-cellActions-addToTimeline"]';
export const CELL_SHOW_TOP_FIELD_BUTTON =
  '[data-test-subj="dataGridColumnCellAction-security-default-cellActions-showTopN"]';
export const CELL_COPY_BUTTON =
  '[data-test-subj="dataGridColumnCellAction-security-default-cellActions-copyToClipboard"]';

export const ACTIONS_EXPAND_BUTTON = '[data-test-subj="euiDataGridCellExpandButton"]';

export const SHOW_TOP_N_HEADER =
  '[data-test-subj="topN-container"] [data-test-subj="header-section-title"]';

export const ALERTS_HISTOGRAM_LEGEND =
  '[data-test-subj="alerts-histogram-panel"] [data-test-subj="withHoverActionsButton"]';

export const SELECT_HISTOGRAM = '[data-test-subj="chart-select-trend"]';
