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
    prefix = requirePaths['cdf/lib'] = FULLY_QUALIFIED_URL + 'api/repos/pentaho-cdf/js/lib' + (isDebug ? '/lib' : '/compressed/lib');
  } else { // build
    prefix = requirePaths['cdf/lib'] = "cdf/lib";
  }

  //modernizr 2.8.3
  requirePaths['cdf/lib/modernizr'] = prefix + '/modernizr/modernizr-2.8.3';

  //jquery 1.7.1
  requirePaths['jquery'] = prefix + "/jquery/jquery";
  requirePaths['cdf/lib/jquery'] = prefix + "/jquery/cdf-jquery";

  //jquery.ui 1.8.14
  requirePaths['cdf/lib/jquery.ui'] = prefix + "/jquery/jquery.ui";
  requireShims['cdf/lib/jquery.ui'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/theme/cupertino/jquery-ui-1.8.custom'
  ];

  //jquery.blockUI 2.66.0
  requirePaths['cdf/lib/jquery.blockUI'] = prefix + "/blockUI/jquery.blockUI";
  requireShims['cdf/lib/jquery.blockUI'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.ui'
  ];

  //jquery.tooltip 1.3
  requirePaths['cdf/lib/jquery.tooltip'] = prefix + "/tooltip/jquery.tooltip";
  requireShims['cdf/lib/jquery.tooltip'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/jquery.tooltip'
  ];

  //jquery-impromptu 3.1
  requirePaths['cdf/lib/jquery.impromptu'] = prefix + "/impromptu/jquery-impromptu.3.1";
  requireShims['cdf/lib/jquery.impromptu'] = {
    deps: [
      'cdf/lib/jquery',
      'css!cdf/lib/impromptu/jquery-impromptu'
    ]
  };

  //jquery.fancybox 1.3.4 11/11/2010
  requirePaths['cdf/lib/jquery.fancybox'] = prefix + "/fancybox/jquery.fancybox-1.3.4";
  requireShims['cdf/lib/jquery.fancybox'] = {
    deps: [
      'cdf/lib/jquery',
      'css!cdf/lib/fancybox/jquery.fancybox-1.3.4'
    ]
  };

  //daterangepicker.jQuery 01.19.2008
  requirePaths['cdf/lib/daterangepicker.jQuery'] = prefix + "/daterangepicker/daterangepicker.jQuery";
  requireShims['cdf/lib/daterangepicker.jQuery'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/daterangepicker/ui.daterangepicker'
  ];

  //underscore 1.6.0
  requirePaths['underscore'] = prefix + "/underscore/underscore";
  requirePaths['cdf/lib/underscore'] = requirePaths['underscore'];
  requireShims['cdf/lib/underscore'] = {exports: '_'};

  //backbone 1.1.2
  requirePaths['backbone'] = prefix + "/backbone/backbone";
  requirePaths['cdf/lib/backbone'] = requirePaths['backbone'];

  //mustache 0.8.1
  requirePaths['cdf/lib/mustache'] = prefix + "/mustache/mustache";
  requireShims['cdf/lib/mustache'] = {exports: 'Mustache'};

  //Base 1.1a
  requirePaths['cdf/lib/Base'] = prefix + "/base/Base";
  requireShims['cdf/lib/Base'] = {exports: 'Base'};

  //datatables 1.10.1-dev
  // http://datatables.net/forums/discussion/19412/datatables-and-require-js-conflict
  requirePaths['datatables'] = prefix + "/dataTables/js/jquery.dataTables";
  requirePaths['cdf/lib/datatables'] = prefix + '/dataTables/cdf-datatables';
  requireShims['cdf/lib/datatables'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/dataTables/css/jquery.dataTables.css'
  ];

  //autobox 0.7.0
  requirePaths['cdf/lib/jquery.ui.autobox'] = prefix + '/autobox/jquery.ui.autobox';
  requireShims['cdf/lib/jquery.ui.autobox'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.ui',
    'css!cdf/lib/autobox/jquery.ui.autobox.css'
  ];
  requirePaths['cdf/lib/jquery.ui.autobox.templating'] = prefix + '/autobox/jquery.templating';
  requireShims['cdf/lib/jquery.ui.autobox.templating'] = [
    'cdf/lib/jquery'
  ];
  requirePaths['cdf/lib/jquery.ui.autobox.ext'] = prefix + '/autobox/jquery.ui.autobox.ext';
  requireShims['cdf/lib/jquery.ui.autobox.ext'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.ui',
    'cdf/lib/jquery.ui.autobox',
    'cdf/lib/jquery.ui.autobox.templating'
  ];

  //captify
  requirePaths['cdf/lib/captify'] = prefix + "/captify/captify";
  requireShims['cdf/lib/captify'] = [
    'cdf/lib/jquery',
    'css!cdf/lib/captify.css'
  ];

  // bgiframe 2.1.1
  requirePaths['cdf/lib/jquery.bgiframe'] = prefix + "/bgiframe/jquery.bgiframe";
  requireShims['cdf/lib/jquery.bgiframe'] = [
    'cdf/lib/jquery'
  ];
  // positionBy 1.0.7 (2008-01-29)
  requirePaths['cdf/lib/jquery.positionBy'] = prefix + "/positionBy/jquery.positionBy";
  requireShims['cdf/lib/jquery.positionBy'] = [
    'cdf/lib/jquery'
  ];
  // jdMenu 1.4.1 (2008-03-31)
  requirePaths['cdf/lib/jquery.jdMenu'] = prefix + "/jdMenu/jquery.jdMenu";
  requireShims['cdf/lib/jquery.jdMenu'] = [
    'cdf/lib/jquery',
    'cdf/lib/jquery.bgiframe',
    'cdf/lib/jquery.positionBy',
    'css!cdf/lib/jdMenu/jquery.jdMenu.css',
    'css!cdf/lib/jdMenu/jquery.jdMenu.slate.css'
  ];

  //shims
  requirePaths['cdf/lib/shims'] = prefix + "/shims";

  /*
   * Dashboard types shims
   */
  //bootstrap 3.1.1
  requirePaths['cdf/lib/bootstrap/bootstrap'] = prefix + '/bootstrap/js/bootstrap';
  requireShims['cdf/lib/bootstrap/bootstrap'] = ['cdf/Dashboard'];

})();
