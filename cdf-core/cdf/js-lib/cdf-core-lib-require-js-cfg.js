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
  var requirePaths = requireCfg.paths,
      requireShims = requireCfg.shim;

  if(typeof CONTEXT_PATH !== "undefined"){ // production
    requirePaths['cdf/lib'] = CONTEXT_PATH+'content/pentaho-cdf/js';
  } else if(typeof KARMA_RUN !== "undefined") { // test
    requirePaths['cdf/lib'] = 'cdf/js-lib';
  } else {
    requirePaths['cdf/lib'] = "../cdf/js-lib";
  }

  //jquery 1.7.1
  requirePaths['jquery'] = "cdf/js-lib/jquery/jquery";
  requirePaths['cdf/lib/jquery'] = "cdf/js-lib/jquery/cdf-jquery";

  //jquery.ui 1.8.14
  requirePaths['cdf/lib/jquery.ui'] = "cdf/js-lib/jquery/jquery.ui";
  requireShims['cdf/lib/jquery.ui'] = {
    exports: '$',
    deps: ['cdf/lib/jquery']
  };

  //jquery.blockUI 2.66.0
  requirePaths['cdf/lib/jquery.blockUI'] = "cdf/js-lib/jquery/jquery.blockUI";
  requireShims['cdf/lib/jquery.blockUI'] = {
    exports: '$',
    deps: ['cdf/lib/jquery']
  };

  //underscore 1.6.0
  requirePaths['underscore'] = "cdf/js-lib/underscore/underscore";
  requirePaths['cdf/lib/underscore'] = requirePaths['underscore'];
  requireShims['cdf/lib/underscore'] = {exports: '_'};

  //backbone 1.1.2
  requirePaths['backbone'] = "cdf/js-lib/backbone/backbone";
  requirePaths['cdf/lib/backbone'] = requirePaths['backbone'];

  //mustache 0.8.2
  requirePaths['cdf/lib/mustache'] = "cdf/js-lib/mustache/mustache";
  requireShims['cdf/lib/mustache'] = {exports: 'Mustache'};

  //Base 1.1a
  requirePaths['cdf/lib/Base'] = "cdf/js-lib/base/Base";
  requireShims['cdf/lib/Base'] = {exports: 'Base'};

  //datatables 1.10.1-dev
  requirePaths['cdf/lib/datatables'] = "cdf/js-lib/datatables/js/jquery.datatables";

  //autobox
  requireShims['cdf/lib/autobox/jquery.templating'] = ["cdf/lib/jquery"];
  requireShims['cdf/lib/autobox/jquery.ui.autobox'] = ["cdf/lib/jquery"];
  requireShims['cdf/lib/autobox/jquery.ui.autobox.ext'] = ["cdf/lib/jquery"];

  //shims
  requirePaths['cdf/lib/shims'] = "cdf/js-lib/shims";

})();




