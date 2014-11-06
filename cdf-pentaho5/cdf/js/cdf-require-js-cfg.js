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
  requireCfg['paths']['cdf'] = CONTEXT_PATH+'content/pentaho-cdf/js';
} else { // build
  requireCfg['paths']['cdf'] = "cdf";
}

if(!requireCfg['map']) requireCfg['map'] = {};

requireCfg['shim']['cdf/cdf-module'] = [
  'cdf/jquery.ui',
  'cdf/jquery-impromptu',
  'cdf/jquery-ui-datepicker-i18n',
  'cdf/jquery.bgiframe',
  'cdf/jquery.blockUI',
  'cdf/jquery.corner',
  'cdf/jquery.eventstack',
  'cdf/jquery.i18n.properties',
  'cdf/jquery.jdMenu',
  'cdf/jquery.positionBy',

  'cdf/simile/ajax/scripts/json',
  'cdf/json',

  'cdf/CoreComponents'
];


requireCfg['shim']['cdf/CoreComponents'] = [
  'cdf/components/core',
  'cdf/components/ccc',
  'cdf/components/input'  ,
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
  'cdf/Base',
  'cdf/underscore',
  'cdf/backbone',
  'cdf/mustache', 
  'cdf/lib/shims',
  'cdf/jquery.blockUI',
  'cdf/uriQueryParser/jquery-queryParser',
  'cdf/Dashboards.Startup',
  'cdf/cdf-base'
];

requireCfg['shim']['cdf/cdf-base'] = [
  'cdf/wd'
];

requireCfg['shim']['cdf/backbone'] = ['cdf/underscore'];

requireCfg['shim']['cdf/Dashboards.Startup'] = ['cdf/lib/shims'];

requireCfg['shim']['cdf/Dashboards.AddIns']        = ['cdf/Dashboards.Main', 'cdf/Dashboards.Query'];
requireCfg['shim']['cdf/Dashboards.Bookmarks']     = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Legacy']        = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Notifications'] = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Query']         = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.RefreshEngine'] = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Utils']         = ['cdf/Dashboards.Main'];

requireCfg['shim']['cdf/components/core']       = ['cdf/Dashboards'];
requireCfg['shim']['cdf/components/input']      = [
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

requireCfg['shim']['cdf/jquery'] = {
  exports: '$',
  init: function() {
    return $;
  }
};

// AMD compatible libs already define themselves anonymously, yet depend on 
// module "jquery", which is defined by jQuery.js
requireCfg['map']['cdf'] = {
    'jquery': 'cdf/jquery'
};
//requireCfg['shim']['cdf/jquery.blockUI']            = ['cdf/jquery'];
//requireCfg['shim']['cdf/jquery.bgiframe']           = ['cdf/jquery'];
//requireCfg['shim']['cdf/jquery.sparkline']          = ['cdf/jquery'];

requireCfg['shim']['cdf/jquery.ui']                 = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery-impromptu']          = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery-ui-datepicker-i18n'] = ['cdf/jquery.ui'];
requireCfg['shim']['cdf/jquery.corner']             = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.eventstack']         = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.i18n.properties']    = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.jdMenu']             = ['cdf/jquery'];
requireCfg['shim']['cdf/jquery.positionBy']         = ['cdf/jquery'];

requireCfg['shim']['cdf/uriQueryParser/jquery-queryParser'] = ['cdf/jquery'];

requireCfg['shim']['cdf/simile/ajax/scripts/json'] = ['cdf/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf/json'] = ['cdf/simile/ajax/simile-ajax-api'];


