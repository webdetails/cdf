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

requireCfg['paths']['cdf'] = CONTEXT_PATH+'content/pentaho-cdf/js';
requireCfg['shim']['cdf/cdf-module'] = [
  'cdf/jQuery/jquery',
  'cdf/jquery-migrate-1.2.1',
  'cdf/jQuery/jquery.ui',
  'cdf/impromptu/jquery-impromptu',
  'cdf/jquery-ui-datepicker-i18n',
  'cdf/bgiframe/jquery.bgiframe',
  'cdf/blockUI/jquery.blockUI',
  'cdf/corner/jquery.corner',
  'cdf/eventstack/jquery.eventstack',
  'cdf/i18n/jquery.i18n.properties',
  'cdf/jdMenu/jquery.jdMenu',
  'cdf/positionBy/jquery.positionBy',
  'cdf/sparkline/jquery.sparkline',
  'cdf/simile/ajax/simile-ajax-api',
  'cdf/simile/ajax/scripts/json',
  'cdf/json',
  'cdf/underscore/underscore',
  'cdf/backbone/backbone',
  'cdf/mustache/mustache',
  'cdf/base/Base',
  'cdf/Dashboards', 
  'cdf/shims',
  'cdf/lib/CCC/protovis',
  'cdf/lib/CCC/tipsy',
  'cdf/lib/CCC/jquery.tipsy',
  'cdf/lib/CCC/def',
  'cdf/lib/CCC/cdo',
  'cdf/lib/CCC/pvc-d1.0',
  'cdf/lib/CCC/compatVersion'/*,       This should only be introduced when we migrate to Sugar  
  'cdf/components/ccc',
  'cdf/components/core',
  'cdf/components/input'  ,
  'cdf/components/jfreechart',    
  'cdf/components/maps',
  'cdf/components/navigation',
  'cdf/components/pentaho',
  'cdf/components/simpleautocomplete',
  'cdf/components/table'
  */
];

/* This should only be introduced when we migrate to Sugar
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
*/

requireCfg['shim']['cdf/cdf-base'] = ['cdf/wd'];

requireCfg['shim']['cdf/Dashboards'] = [
  'cdf/base/Base',
  'cdf/underscore/underscore',
  'cdf/backbone/backbone',
  'cdf/mustache/mustache',
  'cdf/shims',
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
  'cdf/base/Base',
  'cdf/underscore/underscore',
  'cdf/backbone/backbone',
  'cdf/mustache/mustache',
  'cdf/shims',
  'cdf/blockUI/jquery.blockUI',
  'cdf/uriQueryParser/jquery-queryParser.js',
  'cdf/Dashboards.Startup',
  'cdf/cdf-base'
];
requireCfg['shim']['cdf/Dashboards.Startup']       = ['cdf/shims'];
requireCfg['shim']['cdf/Dashboards.AddIns']        = ['cdf/Dashboards.Main', 'cdf/Dashboards.Query'];
requireCfg['shim']['cdf/Dashboards.Bookmarks']     = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Legacy']        = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Notifications'] = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Query']         = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.RefreshEngine'] = ['cdf/Dashboards.Main'];
requireCfg['shim']['cdf/Dashboards.Utils']         = ['cdf/Dashboards.Main'];


requireCfg['shim']['cdf/underscore/underscore'] = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/backbone/backbone']     = ['cdf/underscore/underscore'];

requireCfg['shim']['cdf/lib/CCC/compatVersion'] = ['cdf/lib/CCC/pvc-d1.0'];
requireCfg['shim']['cdf/lib/CCC/pvc-d1.0']      = ['cdf/lib/CCC/protovis', 'cdf/lib/CCC/tipsy', 'cdf/lib/CCC/jquery.tipsy', 'cdf/lib/CCC/cdo', 'cdf/lib/CCC/def'];
requireCfg['shim']['cdf/lib/CCC/cdo']           = ['cdf/lib/CCC/protovis', 'cdf/lib/CCC/def'];
requireCfg['shim']['cdf/lib/CCC/tipsy']         = ['cdf/lib/CCC/protovis', 'cdf/lib/CCC/jquery.tipsy'];
requireCfg['shim']['cdf/lib/CCC/jquery.tipsy']  = ['cdf/jQuery/jquery'];

requireCfg['shim']['cdf/components/core']       = ['cdf/Dashboards'];
requireCfg['shim']['cdf/components/ccc']        = ['cdf/components/core', 'cdf/lib/CCC/pvc-d1.0'];
requireCfg['shim']['cdf/components/input']      = ['cdf/components/core'];
requireCfg['shim']['cdf/components/jfreechart'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/maps']       = ['cdf/components/core'];
requireCfg['shim']['cdf/components/navigation'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/pentaho'] = [
  'cdf/components/core',
  'cdf/components/Pentaho.JPivot',
  'cdf/components/Pentaho.XAction',
  'cdf/components/Pentaho.Analyzer',
  'cdf/components/Pentaho.Reporting'
];
requireCfg['shim']['cdf/components/simpleautocomplete'] = ['cdf/components/core'];
requireCfg['shim']['cdf/components/table'] = ['cdf/components/core'];

requireCfg['shim']['cdf/jquery-migrate-1.2.1']         = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/jQuery/jquery.ui']             = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/impromptu/jquery-impromptu']   = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/jquery-ui-datepicker-i18n']    = ['cdf/jQuery/jquery.ui'];
requireCfg['shim']['cdf/bgiframe/jquery.bgiframe']     = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/blockUI/jquery.blockUI']       = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/corner/jquery.corner']         = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/eventstack/jquery.eventstack'] = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/i18n/jquery.i18n.properties']  = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/jdMenu/jquery.jdMenu']         = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/positionBy/jquery.positionBy'] = ['cdf/jQuery/jquery'];
requireCfg['shim']['cdf/sparkline/jquery.sparkline']   = ['cdf/jQuery/jquery'];

requireCfg['shim']['cdf/uriQueryParser/jquery-queryParser.js'] = ['cdf/jQuery/jquery'];

requireCfg['shim']['cdf/simile/ajax/scripts/json'] = ['cdf/simile/ajax/simile-ajax-api'];

requireCfg['shim']['cdf/json'] = ['cdf/simile/ajax/simile-ajax-api'];
