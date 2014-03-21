/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

if(typeof CONTEXT_PATH != "undefined"){ // production
  requireCfg['paths']['cdf'] = CONTEXT_PATH+'content/pentaho-cdf/js';
} else { // build
  requireCfg['paths']['cdf'] = "cdf";
}

requireCfg['shim']['cdf/cdf-module'] = [
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
	'cdf/jquery.tooltip',
	
	'cdf/simile/ajax/scripts/json',
	'cdf/json',

	'cdf/CoreComponents'
];


requireCfg['shim']['cdf/CoreComponents'] = [
	'cdf/components/core',
	'cdf/components/ccc',
    'cdf/components/input'	,
    'cdf/components/jfreechart',    
    'cdf/components/maps',
    'cdf/components/navigation',
    'cdf/components/pentaho',
    'cdf/components/simpleautocomplete',
	'cdf/components/table'
];

requireCfg['shim']['cdf/Dashboards'] = [
    'cdf/Base',
    'cdf/underscore',
    'cdf/backbone',
    'cdf/mustache', 
    'cdf/lib/shims',
    'cdf/jquery.blockUI'
];

requireCfg['shim']['cdf/backbone'] = ['cdf/underscore'];

requireCfg['shim']['cdf/components/core']       = ['cdf/Dashboards'];
requireCfg['shim']['cdf/components/input']      = ['cdf/components/core'];
requireCfg['shim']['cdf/components/jfreechart'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/maps']       = ['cdf/components/core'];
requireCfg['shim']['cdf/components/navigation'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/pentaho']    = ['cdf/components/core'];
requireCfg['shim']['cdf/components/simpleautocomplete'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/table']      = ['cdf/components/core'];

requireCfg['shim']['cdf/jquery'] = {
  exports: '$'
}
requireCfg['shim']['cdf/jquery.ui']              = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery-impromptu.3.1']   = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery-ui-datepicker-i18n'] = ['cdf/jquery.ui'];
requireCfg['shim']['cdf/jquery.bgiframe']        = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.blockUI']         = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.corner']          = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.eventstack']      = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.i18n.properties'] = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.jdMenu']          = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.positionBy']      = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.sparkline']       = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.tooltip']         = ['cdf/jquery'];

requireCfg['shim']['cdf/simile/ajax/scripts/json'] = ['cdf/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf/json'] = ['cdf/simile/ajax/simile-ajax-api'];
