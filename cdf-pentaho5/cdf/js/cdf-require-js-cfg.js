/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

/* this file allows platform plugins to use the non-RequireJS version of CDF */

if(typeof CONTEXT_PATH != 'undefined') { // production
  requireCfg['paths']['cdf-legacy'] = CONTEXT_PATH + 'plugin/pentaho-cdf/api/resources/js-legacy';
} else { // build / unit tests
  requireCfg['paths']['cdf-legacy'] = 'cdf/js-legacy';
}

if(!requireCfg.map) requireCfg.map = {};
if(!requireCfg.map['*']) requireCfg.map['*'] = {};

requireCfg.map['*']['cdf/cdf-module'] = 'cdf-legacy/cdf-module';

requireCfg['shim']['cdf-legacy/cdf-module'] = [
  'cdf-legacy/lib/jQuery/jquery.ui',
  'cdf-legacy/lib/impromptu/jquery-impromptu',
  'cdf-legacy/lib/jquery-ui-datepicker-i18n',
  'cdf-legacy/lib/bgiframe/jquery.bgiframe',
  'cdf-legacy/lib/blockUI/jquery.blockUI',
  'cdf-legacy/lib/corner/jquery.corner',
  'cdf-legacy/lib/eventstack/jquery.eventstack',
  'cdf-legacy/lib/i18n/jquery.i18n.properties',
  'cdf-legacy/lib/jdMenu/jquery.jdMenu',
  'cdf-legacy/lib/positionBy/jquery.positionBy',
  'cdf-legacy/lib/simile/ajax/scripts/json',
  'cdf-legacy/lib/json',
  'cdf-legacy/CoreComponents'
];

requireCfg['shim']['cdf-legacy/CoreComponents'] = [
  'cdf-legacy/components/core',
  'cdf-legacy/components/ccc',
  'cdf-legacy/components/input',
  'cdf-legacy/components/jfreechart',    
  'cdf-legacy/components/maps',
  'cdf-legacy/components/navigation',
  'cdf-legacy/components/pentaho',
  'cdf-legacy/components/simpleautocomplete',
  'cdf-legacy/components/table'
];

requireCfg['shim']['cdf-legacy/Dashboards'] = [
  'cdf-legacy/Dashboards.Main',
  'cdf-legacy/Dashboards.Query',
  'cdf-legacy/Dashboards.AddIns',
  'cdf-legacy/Dashboards.Bookmarks',
  'cdf-legacy/Dashboards.Legacy',
  'cdf-legacy/Dashboards.Notifications',
  'cdf-legacy/Dashboards.RefreshEngine',
  'cdf-legacy/Dashboards.Utils'
];

requireCfg['shim']['cdf-legacy/Dashboards.Main'] = [
  'cdf-legacy/lib/base/Base',
  'cdf-legacy/lib/underscore/underscore',
  'cdf-legacy/lib/backbone/backbone',
  'cdf-legacy/lib/mustache/mustache',
  'cdf-legacy/lib/shims',
  'cdf-legacy/lib/blockUI/jquery.blockUI',
  'cdf-legacy/lib/uriQueryParser/jquery-queryParser',
  'cdf-legacy/Dashboards.Startup',
  'cdf-legacy/cdf-base'
];

requireCfg['shim']['cdf-legacy/cdf-base'] = ['cdf-legacy/wd'];

requireCfg['shim']['cdf-legacy/lib/backbone/backbone']    = ['cdf-legacy/lib/underscore/underscore'];

requireCfg['shim']['cdf-legacy/Dashboards.Startup']       = ['cdf-legacy/lib/shims'];
requireCfg['shim']['cdf-legacy/Dashboards.AddIns']        = ['cdf-legacy/Dashboards.Main', 'cdf-legacy/Dashboards.Query'];
requireCfg['shim']['cdf-legacy/Dashboards.Bookmarks']     = ['cdf-legacy/Dashboards.Main'];
requireCfg['shim']['cdf-legacy/Dashboards.Legacy']        = ['cdf-legacy/Dashboards.Main'];
requireCfg['shim']['cdf-legacy/Dashboards.Notifications'] = ['cdf-legacy/Dashboards.Main'];
requireCfg['shim']['cdf-legacy/Dashboards.Query']         = ['cdf-legacy/Dashboards.Main'];
requireCfg['shim']['cdf-legacy/Dashboards.RefreshEngine'] = ['cdf-legacy/Dashboards.Main'];
requireCfg['shim']['cdf-legacy/Dashboards.Utils']         = ['cdf-legacy/Dashboards.Main'];

requireCfg['shim']['cdf-legacy/components/core']          = ['cdf-legacy/Dashboards'];
requireCfg['shim']['cdf-legacy/components/input']         = [
  'cdf-legacy/components/core',
  'cdf-legacy/inputHelper'
];
requireCfg['shim']['cdf-legacy/components/jfreechart'] = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/maps']       = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/navigation'] = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/pentaho']    = [
  'cdf-legacy/components/core',
  'cdf-legacy/components/Pentaho.Analyzer',
  'cdf-legacy/components/Pentaho.JPivot',
  'cdf-legacy/components/Pentaho.Reporting',
  'cdf-legacy/components/Pentaho.XAction'
];
requireCfg['shim']['cdf-legacy/components/simpleautocomplete'] = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/table']              = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/Pentaho.Analyzer']   = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/Pentaho.JPivot']     = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/Pentaho.Reporting']  = ['cdf-legacy/components/core'];
requireCfg['shim']['cdf-legacy/components/Pentaho.XAction']    = ['cdf-legacy/components/core'];

requireCfg['shim']['cdf-legacy/lib/jQuery/jquery'] = {
  exports: '$'
}

// AMD compatible libs already define themselves anonymously, yet depend on 
// module "jquery", which is defined by jQuery.js
requireCfg.map['cdf-legacy'] = { 'jquery': 'cdf-legacy/lib/jQuery/jquery' };
requireCfg.map['*']['cdf-legacy/jquery'] = 'cdf-legacy/lib/jQuery/jquery';

//requireCfg['shim']['cdf/lib/blockUI/jquery.blockUI']     = ['cdf/lib/jQuery/jquery'];
//requireCfg['shim']['cdf/lib/bgiframe/jquery.bgiframe']   = ['cdf/lib/jQuery/jquery'];
//requireCfg['shim']['cdf/lib/sparkline/jquery.sparkline'] = ['cdf/lib/jQuery/jquery'];

requireCfg['shim']['cdf-legacy/lib/jQuery/jquery.ui']             = ['cdf-legacy/lib/jQuery/jquery'];
requireCfg['shim']['cdf-legacy/lib/impromptu/jquery-impromptu']   = ['cdf-legacy/lib/jQuery/jquery'];
requireCfg['shim']['cdf-legacy/lib/jquery-ui-datepicker-i18n']    = ['cdf-legacy/lib/jQuery/jquery.ui'];
requireCfg['shim']['cdf-legacy/lib/corner/jquery.corner']         = ['cdf-legacy/lib/jQuery/jquery'];
requireCfg['shim']['cdf-legacy/lib/eventstack/jquery.eventstack'] = ['cdf-legacy/lib/jQuery/jquery'];
requireCfg['shim']['cdf-legacy/lib/i18n/jquery.i18n.properties']  = ['cdf-legacy/lib/jQuery/jquery'];
requireCfg['shim']['cdf-legacy/lib/jdMenu/jquery.jdMenu']         = ['cdf-legacy/lib/jQuery/jquery'];
requireCfg['shim']['cdf-legacy/lib/positionBy/jquery.positionBy'] = ['cdf-legacy/lib/jQuery/jquery'];

requireCfg['shim']['cdf-legacy/lib/uriQueryParser/jquery-queryParser'] = ['cdf-legacy/lib/jQuery/jquery'];

requireCfg['shim']['cdf-legacy/lib/simile/ajax/scripts/json'] = ['cdf-legacy/lib/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf-legacy/lib/json'] = ['cdf-legacy/lib/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf-legacy/components/FilterComponent'] = [
  'cdf-legacy/lib/backboneTreemodel/backbone.treemodel',
  'cdf-legacy/lib/mCustomScrollbar/jquery.mCustomScrollbar.concat.min',
  'cdf-legacy/lib/mCustomScrollbar/jquery.mCustomScrollbar.min',
  'cdf-legacy/components/filter/lib/baseevents',
  'cdf-legacy/components/filter/js/TreeFilter/TreeFilter',
  'cdf-legacy/components/filter/js/TreeFilter/defaults',
  'cdf-legacy/components/filter/js/TreeFilter/Logger',
  'cdf-legacy/components/filter/js/TreeFilter/models/Tree',
  'cdf-legacy/components/filter/js/TreeFilter/models/SelectionTree',
  'cdf-legacy/components/filter/js/TreeFilter/templates',
  'cdf-legacy/components/filter/js/TreeFilter/views/Abstract',
  'cdf-legacy/components/filter/js/TreeFilter/views/Root',
  'cdf-legacy/components/filter/js/TreeFilter/views/Group',
  'cdf-legacy/components/filter/js/TreeFilter/views/Item',
  'cdf-legacy/components/filter/js/TreeFilter/controllers/Manager',
  'cdf-legacy/components/filter/js/TreeFilter/controllers/RootCtrl',
  'cdf-legacy/components/filter/js/TreeFilter/strategies/AbstractSelect',
  'cdf-legacy/components/filter/js/TreeFilter/strategies/MultiSelect',
  'cdf-legacy/components/filter/js/TreeFilter/strategies/SingleSelect',
  'cdf-legacy/components/filter/js/TreeFilter/extensions/renderers',
  'cdf-legacy/components/filter/js/TreeFilter/extensions/sorters',
  'cdf-legacy/components/filter/js/TreeFilter/data-handlers/InputDataHandler',
  'cdf-legacy/components/filter/js/TreeFilter/data-handlers/OutputDataHandler',
  'cdf-legacy/components/filter/js/TreeFilter/addIns/addIns',
  'cdf-legacy/components/filter/styles/filter',
  'cdf-legacy/components/filter/js/filter'];
