/*
 * This file serves to inform the RequireJS system about CDF's modules. It's loaded by way of the plugin
 * <external-resources> mechanism
 */
requireCfg['paths']['cdf'] = CONTEXT_PATH+'content/pentaho-cdf/js';
requireCfg['shim'] = {};
requireCfg['shim']['cdf/cdf-module'] = ['cdf/Base', 'cdf/Dashboards',
'cdf/jquery',
'cdf/jquery-impromptu.3.1',
'cdf/jquery-ui-datepicker-i18n',
'cdf/jquery.bgiframe',
'cdf/jquery.blockUI',
'cdf/jquery.corner',
'cdf/jquery.eventstack',
'cdf/jquery.i18n.properties',
'cdf/jquery.jdMenu',
'cdf/jquery',
'cdf/jquery.positionBy',
'cdf/jquery.sparkline',
'cdf/jquery.tooltip',
'cdf/jquery.ui',
'cdf/simile/ajax/simile-ajax-api',
'cdf/simile/ajax/scripts/json',
'cdf/json',
'cdf/CoreComponents'];