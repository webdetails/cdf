requireCfg['paths']['cdf'] = CONTEXT_PATH+'content/pentaho-cdf/js';
requireCfg['shim']['cdf/cdf-module'] = ['cdf/Dashboards',
	'cdf/jquery.ui',
	'cdf/jquery-impromptu.3.1',
	'cdf/jquery-ui-datepicker-i18n',
	'cdf/jquery.bgiframe',
	'cdf/jquery.blockUI',
	'cdf/jquery.corner',
	'cdf/jquery.eventstack',
	'cdf/jquery.i18n.properties',
	'cdf/jquery.jdMenu',
	'cdf/jquery.positionBy',
	'cdf/jquery.sparkline',
	'cdf/jquery.tooltip',
	'cdf/simile/ajax/simile-ajax-api',
	'cdf/simile/ajax/scripts/json',
	'cdf/json',
	'cdf/CoreComponents'];

requireCfg['shim']['cdf/Dashboards'] = ['cdf/Base'];
requireCfg['shim']['cdf/CoreComponents'] = ['cdf/Dashboards'];
requireCfg['shim']['cdf/jquery.ui'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery-impromptu.3.1'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery-ui-datepicker-i18n'] = ['cdf/jquery.ui'];
requireCfg['shim']['cdf/jquery.bgiframe'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.blockUI'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.corner'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.eventstack'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.i18n.properties'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.jdMenu'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.positionBy'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.sparkline'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.tooltip'] = ['cdf/jquery'];

requireCfg['shim']['cdf/simile/ajax/scripts/json'] = ['cdf/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf/json'] = ['cdf/simile/ajax/simile-ajax-api'];


