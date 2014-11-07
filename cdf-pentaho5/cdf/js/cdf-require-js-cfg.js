/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
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

if(typeof CONTEXT_PATH != "undefined") { // production
  requireCfg['paths']['cdf'] = CONTEXT_PATH + 'content/pentaho-cdf/js-legacy';
} else { // build
  requireCfg['paths']['cdf'] = "cdf";
}

requireCfg['shim']['cdf/cdf-module'] = [
  'cdf/lib/jquery-migrate-1.2.1',
  'cdf/lib/jquery/jquery.ui',
  'cdf/lib/impromptu/jquery-impromptu',
  'cdf/lib/jquery-ui-datepicker-i18n',
  'cdf/lib/bgiframe/jquery.bgiframe',
  'cdf/lib/blockUI/jquery.blockUI',
  'cdf/lib/corner/jquery.corner',
  'cdf/lib/eventstack/jquery.eventstack',
  'cdf/lib/i18n/jquery.i18n.properties',
  'cdf/lib/jdMenu/jquery.jdMenu',
  'cdf/lib/positionBy/jquery.positionBy',
  'cdf/lib/simile/ajax/scripts/json',
  'cdf/lib/json',
  'cdf/CoreComponents'
];

requireCfg['shim']['cdf/CoreComponents'] = [
  'cdf/components/core',
  'cdf/components/ccc',
  'cdf/components/input',
  'cdf/components/jfreechart',    
  'cdf/components/maps',
  'cdf/components/navigation',
  'cdf/components/pentaho',
  'cdf/components/simpleautocomplete',
  'cdf/components/table'
];

requireCfg['shim']['cdf/Dashboards'] = [
  'cdf/Dashboards.Main',
  'cdf/Dashboards.Query',
  'cdf/Dashboards.AddIns',
  'cdf/Dashboards.Bookmarks',
  'cdf/Dashboards.Legacy',
  'cdf/Dashboards.Notifications',
  'cdf/Dashboards.RefreshEngine',
  'cdf/Dashboards.Utils'
];
requireCfg['shim']['cdf/Dashboards.Main'] = [
  'cdf/lib/base/Base',
  'cdf/lib/underscore/underscore',
  'cdf/lib/backbone/backbone',
  'cdf/lib/mustache/mustache',
  'cdf/lib/shims',
  'cdf/lib/blockUI/jquery.blockUI',
  'cdf/lib/uriQueryParser/jquery-queryParser.js',
  'cdf/Dashboards.Startup',
  'cdf/cdf-base'
];
requireCfg['shim']['cdf/cdf-base'] = [
  'cdf/wd'
];

requireCfg['shim']['cdf/lib/backbone/backbone']    = ['cdf/lib/underscore/underscore'];

requireCfg['shim']['cdf/Dashboards.Startup']       = ['cdf/lib/shims'];
requireCfg['shim']['cdf/Dashboards.AddIns']        = ['cdf/Dashboards.Main', 'cdf/Dashboards.Query'];
requireCfg['shim']['cdf/Dashboards.Bookmarks']     = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Legacy']        = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Notifications'] = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Query']         = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.RefreshEngine'] = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Utils']         = ['cdf/Dashboards.Main'];

requireCfg['shim']['cdf/components/core']          = ['cdf/Dashboards'];
requireCfg['shim']['cdf/components/input']         = [
  'cdf/components/core',
  'cdf/inputHelper'
];
requireCfg['shim']['cdf/components/jfreechart'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/maps']       = ['cdf/components/core'];
requireCfg['shim']['cdf/components/navigation'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/pentaho']    = [
  'cdf/components/core',
  'cdf/components/Pentaho.Analyzer',
  'cdf/components/Pentaho.JPivot',
  'cdf/components/Pentaho.Reporting',
  'cdf/components/Pentaho.XAction'
];
requireCfg['shim']['cdf/components/simpleautocomplete'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/table']              = ['cdf/components/core'];
requireCfg['shim']['cdf/components/Pentaho.Analyzer']   = ['cdf/components/core'];
requireCfg['shim']['cdf/components/Pentaho.JPivot']     = ['cdf/components/core'];
requireCfg['shim']['cdf/components/Pentaho.Reporting']  = ['cdf/components/core'];
requireCfg['shim']['cdf/components/Pentaho.XAction']    = ['cdf/components/core'];

requireCfg['shim']['cdf/lib/jquery/jquery'] = {
  exports: '$',
  init: function() {
    return $;
  }
}

requireCfg['shim']['cdf/lib/jquery-migrate-1.2.1']         = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/jquery/jquery.ui']             = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/impromptu/jquery-impromptu']   = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/jquery-ui-datepicker-i18n']    = ['cdf/lib/jquery/jquery.ui'];
requireCfg['shim']['cdf/lib/bgiframe/jquery.bgiframe']     = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/blockUI/jquery.blockUI']       = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/corner/jquery.corner']         = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/eventstack/jquery.eventstack'] = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/i18n/jquery.i18n.properties']  = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/jdMenu/jquery.jdMenu']         = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/positionBy/jquery.positionBy'] = ['cdf/lib/jquery/jquery'];
requireCfg['shim']['cdf/lib/sparkline/jquery.sparkline']   = ['cdf/lib/jquery/jquery'];

requireCfg['shim']['cdf/lib/uriQueryParser/jquery-queryParser.js'] = ['cdf/lib/jquery/jquery'];

requireCfg['shim']['cdf/lib/simile/ajax/scripts/json'] = ['cdf/lib/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf/lib/json'] = ['cdf/lib/simile/ajax/simile-ajax-api'];
