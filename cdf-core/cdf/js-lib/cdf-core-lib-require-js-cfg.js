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
  if(typeof CONTEXT_PATH !== "undefined"){ // production vs debug
    prefix = requirePaths['cdf/lib'] = CONTEXT_PATH + 'api/repos/pentaho-cdf/js' + (isDebug ? '/lib' : '/compressed/lib');
  } else if(typeof KARMA_RUN !== "undefined") { // test
    prefix = requirePaths['cdf/lib'] = 'cdf/js-lib';
  } else if(typeof FULLY_QUALIFIED_URL != "undefined") { // embedded production vs debug
    prefix = requirePaths['cdf/lib'] = FULLY_QUALIFIED_URL + 'api/repos/pentaho-cdf/js/lib' + (isDebug ? '/lib' : '/compressed/lib');
  } else { // build
    prefix = requirePaths['cdf/lib'] = "cdf/lib";
  }

  //jquery 1.7.1
  requirePaths['jquery'] = prefix + "/jquery/jquery";
  requirePaths['cdf/lib/jquery'] = prefix + "/jquery/cdf-jquery";

  //jquery.ui 1.8.14
  // TODO: CSS to be included (js/lib/theme/*)
  requirePaths['cdf/lib/jquery.ui'] = prefix + "/jquery/jquery.ui";
  requireShims['cdf/lib/jquery.ui'] = {
    exports: '$',
    deps: [
      'cdf/lib/jquery',
      'css!cdf/lib/theme/cupertino/jquery-ui-1.8.custom'
    ]
  };

  //jquery.blockUI 2.66.0
  requirePaths['cdf/lib/jquery.blockUI'] = prefix + "/jquery/jquery.blockUI";
  requireShims['cdf/lib/jquery.blockUI'] = {
    deps: ['cdf/lib/jquery']
  };

  //jquery.tooltip 1.3
  // TODO: CSS to be included
  requirePaths['cdf/lib/jquery.tooltip'] = prefix + "/jquery/jquery.tooltip";
  requireShims['cdf/lib/jquery.tooltip'] = {
    deps: ['cdf/lib/jquery']
  };

  //daterangepicker.jQuery 01.19.2008
  // TODO: CSS to be included
  requirePaths['cdf/lib/daterangepicker.jQuery'] = prefix + "/daterangepicker/daterangepicker.jQuery";
  requireShims['cdf/lib/daterangepicker.jQuery'] = {
    deps: ['cdf/lib/jquery']
  };

  //underscore 1.6.0
  requirePaths['underscore'] = prefix + "/underscore/underscore";
  requirePaths['cdf/lib/underscore'] = requirePaths['underscore'];
  requireShims['cdf/lib/underscore'] = {exports: '_'};

  //backbone 1.1.2
  requirePaths['backbone'] = prefix + "/backbone/backbone";
  requirePaths['cdf/lib/backbone'] = requirePaths['backbone'];

  //mustache 0.8.2
  requirePaths['cdf/lib/mustache'] = prefix + "/mustache/mustache";
  requireShims['cdf/lib/mustache'] = {exports: 'Mustache'};

  //Base 1.1a
  requirePaths['cdf/lib/Base'] = prefix + "/base/Base";
  requireShims['cdf/lib/Base'] = {exports: 'Base'};

  //datatables 1.10.1-dev
  requirePaths['cdf/lib/datatables'] = prefix + "/datatables/js/jquery.datatables";

  //autobox
  requireShims['cdf/lib/autobox/jquery.templating'] = ["cdf/lib/jquery"];
  requireShims['cdf/lib/autobox/jquery.ui.autobox'] = ["cdf/lib/jquery"];
  requireShims['cdf/lib/autobox/jquery.ui.autobox.ext'] = ["cdf/lib/jquery"];

  //shims
  requirePaths['cdf/lib/shims'] = prefix + "/shims";

})();
