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

(function() {
  if(!requireCfg.map) requireCfg.map = {};
  if(!requireCfg.map['*']) requireCfg.map['*'] = {};

  requireCfg.map['*']['css'] = 'cdf/lib/require-css/css';

  var requirePaths = requireCfg.paths,
      requireShims = requireCfg.shim;

  var isDebug = typeof document == "undefined" || document.location.href.indexOf("debug=true") > 0;

  var prefix = "";
  if(typeof KARMA_RUN !== "undefined") { // test
    prefix = requirePaths['cdf/lib'] = 'cdf/js-lib';
  } else if(typeof CONTEXT_PATH !== "undefined") { // production vs debug
    prefix = requirePaths['cdf/lib'] = CONTEXT_PATH + 'api/repos/pentaho-cdf/js' + (isDebug ? '/lib' : '/compressed/lib');
  } else if(typeof FULLY_QUALIFIED_URL != "undefined") { // embedded production vs debug
    prefix = requirePaths['cdf/lib'] = FULLY_QUALIFIED_URL + 'api/repos/pentaho-cdf/js' + (isDebug ? '/lib' : '/compressed/lib');
  } else { // build
    prefix = requirePaths['cdf/lib'] = "cdf/lib";
  }

  //modernizr 2.8.3
  requirePaths['cdf/lib/modernizr'] = prefix + '/modernizr/modernizr-2.8.3';

  //jquery 1.9.1
  requireCfg.map['*']['cdf/lib/jquery.clean'] = "cdf/lib/jQuery/jquery";
  requireCfg.map['cdf'] = {
    'jquery': "cdf/lib/jQuery/jquery"
  };
  requireShims['cdf/lib/jQuery/jquery'] = {
    exports: '$'
  };

  //jquery migration tool 1.2.1 (this is helpful while the migration to jquery 1.9.1 isn't completely stable)
  requirePaths['cdf/lib/jquery'] = prefix + "/jquery-migrate-1.2.1";
  requireShims['cdf/lib/jquery'] = {
    exports: '$',
    deps: ['cdf/lib/jquery.clean']
  };
  
  //jquery.ui 1.10.4
  requirePaths['cdf/lib/jquery.ui'] = prefix + "/jQuery/jquery.ui";
  requireShims['cdf/lib/jquery.ui'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/theme/cupertino/jquery-ui-1.10.4.custom'
  ];

  //jquery.blockUI 2.66.0
  requirePaths['cdf/lib/jquery.blockUI'] = prefix + "/blockUI/jquery.blockUI";
  requireShims['cdf/lib/jquery.blockUI'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.ui'
  ];

  //jquery-impromptu 5.2.4
  requirePaths['cdf/lib/jquery.impromptu'] = prefix + "/impromptu/jquery-impromptu";
  requireShims['cdf/lib/jquery.impromptu'] = {
    deps: [
      'cdf/lib/jquery',
      'css!cdf/lib/impromptu/jquery-impromptu'
    ]
  };

  //jquery.fancybox 2.1.5
  requirePaths['cdf/lib/jquery.fancybox'] = prefix + "/fancybox/jquery.fancybox";
  requireShims['cdf/lib/jquery.fancybox'] = {
    deps: [
      'cdf/lib/jquery',
      'css!cdf/lib/fancybox/jquery.fancybox'
    ]
  };

  //daterangepicker.jQuery 01.19.2008
  requirePaths['cdf/lib/daterangepicker.jQuery'] = prefix + "/daterangepicker/daterangepicker.jQuery";
  requireShims['cdf/lib/daterangepicker.jQuery'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/daterangepicker/ui.daterangepicker'
  ];

  //underscore 1.6.0
  requirePaths['cdf/lib/underscore'] = prefix + "/underscore/underscore";
  requireShims['cdf/lib/underscore'] = {exports: '_'};

  //backbone 1.1.2
  requirePaths['cdf/lib/backbone'] = prefix + "/backbone/backbone";
  requireShims['cdf/lib/backbone'] = ['cdf/lib/underscore'];

  //mustache 0.8.1
  requirePaths['cdf/lib/mustache'] = prefix + "/mustache/mustache";
  requireShims['cdf/lib/mustache'] = {exports: 'Mustache'};

  //Base 1.1a
  requirePaths['cdf/lib/Base'] = prefix + "/base/Base";
  requireShims['cdf/lib/Base'] = {exports: 'Base'};

  //datatables 1.10.1
  // http://datatables.net/forums/discussion/19412/datatables-and-require-js-conflict
  requirePaths['datatables'] = prefix + "/dataTables/js/jquery.dataTables";
  requirePaths['cdf/lib/datatables'] = prefix + '/dataTables/cdf-datatables';
  requireShims['cdf/lib/datatables'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/dataTables/css/jquery.dataTables'
  ];

  //autobox 0.7.0
  requirePaths['cdf/lib/jquery.ui.autobox'] = prefix + '/autobox/jquery.ui.autobox';
  requireShims['cdf/lib/jquery.ui.autobox'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.ui',
    'css!cdf/lib/autobox/jquery.ui.autobox'
  ];
  requirePaths['cdf/lib/jquery.templating'] = prefix + '/autobox/jquery.templating';
  requireShims['cdf/lib/jquery.templating'] = ['cdf/lib/jquery'];
  requirePaths['cdf/lib/jquery.ui.autobox.ext'] = prefix + '/autobox/jquery.ui.autobox.ext';
  requireShims['cdf/lib/jquery.ui.autobox.ext'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.ui',
    'cdf/lib/jquery.ui.autobox',
    'cdf/lib/jquery.templating'
  ];

  //captify
  requirePaths['cdf/lib/captify'] = prefix + "/captify/captify";
  requireShims['cdf/lib/captify'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/captify'
  ];

  //bgiframe 3.0.1
  requirePaths['cdf/lib/jquery.bgiframe'] = prefix + "/bgiframe/jquery.bgiframe";
  requireShims['cdf/lib/jquery.bgiframe'] = ['cdf/lib/jquery'];

  //positionBy 1.0.7 (2008-01-29)
  requirePaths['cdf/lib/jquery.positionBy'] = prefix + "/positionBy/jquery.positionBy";
  requireShims['cdf/lib/jquery.positionBy'] = ['cdf/lib/jquery'];

  //jdMenu 1.4.1 (2008-03-31)
  requirePaths['cdf/lib/jquery.jdMenu'] = prefix + "/jdMenu/jquery.jdMenu";
  requireShims['cdf/lib/jquery.jdMenu'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.bgiframe',
    'cdf/lib/jquery.positionBy',
    'css!cdf/lib/jquery.jdMenu',
    'css!cdf/lib/jdMenu/jquery.jdMenu.slate'
  ];

  //jquery i18n
  requirePaths['cdf/lib/cdf.jquery.i18n'] = prefix + "/i18n/cdf.jquery.i18n";
  requirePaths['cdf/lib/jquery.i18n'] = prefix + "/i18n/jquery.i18n.properties";
  requireShims['cdf/lib/jquery.i18n'] = ['cdf/lib/jquery'];

  //OpenLayers 2.13.1
  requirePaths['cdf/lib/OpenLayers'] = prefix + "/OpenMap/OpenLayers/OpenLayers";
  requireShims['cdf/lib/OpenLayers'] = {
    exports: 'OpenLayers',
    deps: ['css!cdf/lib/OpenMap/OpenLayers/theme/default/style']
  };

  //OpenStreetMap
  requirePaths['cdf/lib/OpenStreetMap'] = prefix + "/OpenStreetMap";
  requireShims['cdf/lib/OpenStreetMap'] = ['cdf/lib/OpenLayers'];

  //jQuery uriQueryParser 2013
  requirePaths['cdf/lib/queryParser'] = prefix + "/uriQueryParser/jquery-queryParser";
  requireShims['cdf/lib/queryParser'] = ['cdf/lib/jquery'];

  //jQuery sparkline 2.1.2
  requirePaths['cdf/lib/jquery.sparkline'] = prefix + "/sparkline/jquery.sparkline";
  /*
  requireShims['cdf/lib/jquery.sparkline'] = [
    'cdf/lib/jquery'
  ];*/

  //jQuery chosen 1.1.0
  /*
  requirePaths['cdf/lib/jquery.chosen'] = prefix + "/chosen/jquery.chosen";
  requireShims['cdf/lib/jquery.chosen'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/chosen/chosen'
  ];*/

  //jQuery corner 2.13
  requirePaths['cdf/lib/jquery.corner'] = prefix + "/corner/jquery.corner";
  requireShims['cdf/lib/jquery.corner'] = ['cdf/lib/jquery'];

  //jQuery eventstack
  /*
  requirePaths['cdf/lib/jquery.eventstack'] = prefix + "/eventstack/jquery.eventstack";
  requireShims['cdf/lib/jquery.eventstack'] = [
    'cdf/lib/jquery'
  ];*/

  //shims
  requirePaths['cdf/lib/shims'] = prefix + "/shims";

  /*
   * Dashboard types shims (Bootstrap)
   */

  //HTML5 Shiv 3.7.2 (IE8)
  requirePaths['cdf/lib/html5shiv'] = prefix + '/html5shiv/html5shiv';

  //Respond.js v1.4.0 (IE8, load after bootstrap.css)
  requirePaths['cdf/lib/respond'] = prefix + '/respond/respond';
  requireShims['cdf/lib/respond'] = ['cdf/lib/bootstrap'];

  //bootstrap 3.1.1
  requirePaths['cdf/lib/bootstrap'] = prefix + '/Bootstrap/js/bootstrap';
  requireShims['cdf/lib/bootstrap'] = ['css!cdf/lib/Bootstrap/css/bootstrap.css'];

  //Font Awesome 4.0.3 (CSS only)

  // Raphaël 2.1.2 ( + Eve 0.4.2) AMD compatible
  requirePaths['cdf/lib/raphael'] = prefix + '/Raphael/raphael';

})();
