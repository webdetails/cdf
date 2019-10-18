/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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

/**
 * Configuration file for cdf core libs
 */
(function() {

  /* globals ENVIRONMENT_CONFIG, CONTEXT_PATH, FULL_QUALIFIED_URL */

  if(!requireCfg.map) requireCfg.map = {};
  if(!requireCfg.map['*']) requireCfg.map['*'] = {};
  if(!requireCfg.map['cdf']) requireCfg.map['cdf'] = {};

  //RequireJS css! loader plugin 0.1.2
  // Do NOT overwrite common-ui's global mapping.
  // Otherwise, files bundled with the common-ui mapping would not
  // be found in the bundle under the cdf css plugin mapping and cause
  // these to be fetched again, or worse, if `bundles` is used,
  // to possibly fail loading altogether.
  if(requireCfg.map['*']['css'] === undefined) {
    requireCfg.map['*']['css'] = 'cdf/lib/require-css/css';
  }

  requireCfg.config = requireCfg.config || {};

  var requirePaths = requireCfg.paths,
      requireShims = requireCfg.shim,
      requireConfig = requireCfg.config;

  if(!requireConfig['amd']) {
    requireConfig['amd'] = {};
  }

  if(!requireConfig['amd']['shim']) {
    requireConfig['amd']['shim'] = {};
  }

  var amdShim = requireConfig['amd']['shim'];

  var isDebug = typeof document === "undefined" || document.location.href.indexOf("debug=true") > 0;
  var isCdfPathDefined = typeof ENVIRONMENT_CONFIG !== "undefined" &&
                         typeof ENVIRONMENT_CONFIG.paths !== "undefined" &&
                         typeof ENVIRONMENT_CONFIG.paths["cdf"] !== "undefined";

  var prefix = "";
  if (isCdfPathDefined) { // environment is configured, checking
    prefix = requirePaths['cdf/lib'] = ENVIRONMENT_CONFIG.paths["cdf"] + "/lib";

  } else if (typeof KARMA_RUN !== "undefined") { // unit tests
    prefix = requirePaths['cdf/lib'] = 'target/test-javascript/lib';

  } else {
    var cdfResourcesPath = 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '/lib' : '/compressed/lib');

    if (typeof CONTEXT_PATH !== "undefined") { // production
      // if (!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
      prefix = requirePaths['cdf/lib'] = CONTEXT_PATH + cdfResourcesPath;

    } else if (typeof FULL_QUALIFIED_URL !== "undefined") { // embedded
      // if (!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
      prefix = requirePaths['cdf/lib'] = FULL_QUALIFIED_URL + cdfResourcesPath;

    } else { // build
      prefix = requirePaths['cdf/lib'] = "cdf/lib";

    }
  }

  //RequireJS text! loader plugin 2.0.14
  requirePaths['text'] = prefix + '/require-text/text';

  // configure text! plugin for usage in embedded environments (CORS)
  requireConfig['text'] = {
    onXhr: function(xhr/*, url*/) {
      //Called after the XHR has been created and after the
      //xhr.open() call, but before the xhr.send() call.
      //Useful time to set headers.
      xhr.withCredentials = true;
    }
  };

  // RequireJS amd! loader plugin. Wraps non-AMD scripts as AMD modules on the fly,
  // to be used when a shim isn't enough (see plugin prescript and postscript).
  requirePaths['amd'] = prefix + '/require-amd/nonamd';

  // RequireJS dash! loader plugin 0.0.1
  requirePaths['dash'] = prefix + '/require-dashboard/dashboard';

  //modernizr 2.8.3
  requirePaths['cdf/lib/modernizr'] = prefix + '/modernizr/modernizr-2.8.3';

  //Google Caja HTML Sanitizer 0.1.3 with dependencies
  requirePaths['cdf/lib/sanitizer/lib/html4'] = prefix + '/sanitizer/lib/html4';
  requireShims['cdf/lib/sanitizer/lib/html4'] = {
    exports: 'html4'
  };
  requirePaths['cdf/lib/sanitizer/lib/uri'] = prefix + '/sanitizer/lib/uri';
  requireShims['cdf/lib/sanitizer/lib/uri'] = {
    exports: 'URI'
  };
  requirePaths['cdf/lib/sanitizer'] = prefix + '/sanitizer/sanitizer';
  requireShims['cdf/lib/sanitizer'] = {
    exports: 'Sanitizer',
    deps: ['cdf/lib/sanitizer/lib/html4', 'cdf/lib/sanitizer/lib/uri']
  };

  //jquery without globally scoped variables
  requirePaths['cdf/lib/jquery'] = prefix + '/jQuery/jquery';
  requireShims['cdf/lib/jquery'] = {
    exports: '$',
    init: function() {
      return $.noConflict(true);
    }
  };
  //mapping all jquery requests from inside cdf to 'cdf/lib/jquery'
  requireCfg.map['cdf']['jquery'] = 'cdf/lib/jquery';

  //jquery.ui 1.10.4
  requirePaths['cdf/lib/jquery.ui'] = prefix + "/jQuery/jquery.ui";
  amdShim["cdf/lib/jquery.ui"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/theme/cupertino/jquery-ui-1.10.4.custom": ""
    },
    prescript: "var setTimeout = window.setTimeout.bind(window);\n" // Prevent setTimeout from throwing an 'Invalid calling object' exception on IE11 and Edge
  };

  //jquery.blockUI 2.66.0
  requirePaths['cdf/lib/jquery.blockUI'] = prefix + "/blockUI/jquery.blockUI";
  amdShim["cdf/lib/jquery.blockUI"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "amd!cdf/lib/jquery.ui": ""
    },
    prescript: "var setTimeout = window.setTimeout.bind(window);\n" // Prevent setTimeout from throwing an 'Invalid calling object' exception on IE11 and Edge
  };

  //jquery-impromptu 5.2.4
  requirePaths['cdf/lib/jquery.impromptu'] = prefix + "/impromptu/jquery-impromptu";
  amdShim["cdf/lib/jquery.impromptu"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/impromptu/jquery-impromptu": ""
    }
  };

  //jquery.fancybox
  requirePaths['cdf/lib/jquery.fancybox'] = prefix + "/fancybox/jquery.fancybox";
  amdShim["cdf/lib/jquery.fancybox"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/fancybox/jquery.fancybox": "",
      "css!cdf/lib/cdf-fancybox/cdf-fancybox": ""
    }
  };

  //daterangepicker.jQuery 01.19.2008
  requirePaths['cdf/lib/daterangepicker.jQuery'] = prefix + "/daterangepicker/daterangepicker.jQuery";
  amdShim["cdf/lib/daterangepicker.jQuery"] = {
    exports: "jQuery",
    deps: {
      "amd!cdf/lib/jquery.ui": "jQuery",
      "css!cdf/lib/daterangepicker/ui.daterangepicker": ""
    },
    prescript: "define = function(arr, setup) { setup(jQuery) };"
  };

  //underscore 1.8.3
  requirePaths['cdf/lib/underscore'] = prefix + "/underscore/underscore";
  amdShim['cdf/lib/underscore'] = {
    postscript: "return _.noConflict();",
    prescript: "var setTimeout = window.setTimeout.bind(window);\n" // Prevent setTimeout from throwing an 'Invalid calling object' exception on IE11 and Edge
  };

  //backbone 1.2.3
  requirePaths['cdf/lib/backbone'] = prefix + "/backbone/backbone";
  amdShim["cdf/lib/backbone"] = {
    deps: {
      "cdf/lib/jquery": "jQuery",
      "amd!cdf/lib/underscore" : "_"
    },
    prescript: "var _self = self;\n" // storing the real `self`
    + "var self = {jQuery: jQuery, _: _};\n" // mocking self
    + "self.self = self;\n"
    + "(function() {\n",
    postscript: "}.call(self));\n"
    + "var Backbone = self.Backbone;\n"
    + "self = _self; \n" // recovering the real self
    + "return Backbone;"
  };

  //mustache 0.8.1
  requirePaths['cdf/lib/mustache'] = prefix + "/mustache/mustache";

  //mustache-wax 0.9.0
  requirePaths['cdf/lib/mustache-wax'] = prefix + "/mustacheWax/mustache-wax";
  amdShim["cdf/lib/mustache-wax"] = {
    exports: "Mustache",
    deps: {
      "cdf/lib/mustache": "Mustache"
    },
    prescript: "var root = {Mustache: Mustache};\n"
    + "(function() {\n",
    postscript: "}.call(root));\n"
    + "return root.Mustache;"
  };

  //Base 1.1a
  requirePaths['cdf/lib/Base'] = prefix + "/base/Base";

  //BaseEvents
  requirePaths['cdf/lib/BaseEvents'] = prefix + "/baseEvents/BaseEvents";

  //BaseSelectionTree
  requirePaths['cdf/lib/BaseSelectionTree'] = prefix + "/baseSelectionTree/BaseSelectionTree";
  requirePaths['cdf/lib/Tree'] = prefix + "/baseSelectionTree/Tree";


  //datatables 1.10.1
  requirePaths['cdf/lib/datatables'] = prefix + "/dataTables/js/jquery.dataTables";
  amdShim["cdf/lib/datatables"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/dataTables/css/jquery.dataTables_themeroller": "",
      "css!cdf/lib/dataTables/css/jquery.dataTables": ""
    }
  };

  //captify
  requirePaths['cdf/lib/captify'] = prefix + "/captify/captify";
  amdShim["cdf/lib/captify"] = {
    exports: "$",
    deps: {
      "cdf/lib/jquery": "$",
      "css!cdf/lib/captify": ""
    }
  };

  //bgiframe 3.0.1
  requirePaths['cdf/lib/jquery.bgiframe'] = prefix + "/bgiframe/jquery.bgiframe";
  amdShim["cdf/lib/jquery.bgiframe"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery"
    }
  };

  //positionBy 1.0.7 (2008-01-29)
  requirePaths['cdf/lib/jquery.positionBy'] = prefix + "/positionBy/jquery.positionBy";
  amdShim["cdf/lib/jquery.positionBy"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery"
    }
  };

  //jdMenu 1.4.1 (2008-03-31)
  requirePaths['cdf/lib/jquery.jdMenu'] = prefix + "/jdMenu/jquery.jdMenu";
  amdShim["cdf/lib/jquery.jdMenu"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "amd!cdf/lib/jquery.positionBy": "",
      "amd!cdf/lib/jquery.bgiframe": "",
      "css!cdf/lib/jquery.jdMenu": "",
      "css!cdf/lib/jdMenu/jquery.jdMenu.slate": ""
    },
    prescript: "var $ = jQuery;"
  };

  //jquery i18n
  requirePaths['cdf/lib/cdf.jquery.i18n'] = prefix + "/i18n/cdf.jquery.i18n";
  requirePaths['cdf/lib/jquery.i18n'] = prefix + "/i18n/jquery.i18n.properties";
  amdShim["cdf/lib/jquery.i18n"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery"
    }
  };

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
  amdShim["cdf/lib/queryParser"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery"
    }
  };

  //jQuery sparkline 2.1.2
  requirePaths['cdf/lib/jquery.sparkline'] = prefix + "/sparkline/jquery.sparkline";
  amdShim["cdf/lib/jquery.sparkline"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery"
    }
  };

  //jQuery corner 2.13
  requirePaths['cdf/lib/jquery.corner'] = prefix + "/corner/jquery.corner";
  amdShim["cdf/lib/jquery.corner"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery"
    }
  };

  //jQuery Select2 4.0.3
  requirePaths['cdf/lib/jquery.select2'] = prefix + "/select2/select2";
  amdShim["cdf/lib/jquery.select2"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/select2/select2": ""
    }
  };

  //jQuery Chosen 0.9.1
  requirePaths['cdf/lib/jquery.chosen'] = prefix + "/chosen/chosen.jquery";
  amdShim['cdf/lib/jquery.chosen'] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/chosen/chosen": ""
    }
  };

  //jQuery MultiSelect UI Widget 1.12
  requirePaths['cdf/lib/jquery.multiselect'] = prefix + "/hynds/jquery.multiselect";
  amdShim['cdf/lib/jquery.multiselect'] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "amd!cdf/lib/jquery.ui": "",
      "css!cdf/lib/hynds/jquery.multiselect": ""
    }
  };

  //shims
  requirePaths['cdf/lib/shims'] = prefix + "/shims";

  /*
   * Dashboard types shims (Bootstrap)
   */

  //HTML5 Shiv 3.7.2 (IE8)
  requirePaths['cdf/lib/html5shiv'] = prefix + '/html5shiv/html5shiv';

  //Respond.js v1.4.0 (IE8, load after bootstrap.css)
  requirePaths['cdf/lib/respond'] = prefix + '/respond/respond';
  requireShims['cdf/lib/respond'] = ['amd!cdf/lib/bootstrap'];

  //bootstrap 3.1.1
  requirePaths['cdf/lib/bootstrap'] = prefix + '/Bootstrap/js/bootstrap';
  amdShim["cdf/lib/bootstrap"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/Bootstrap/css/bootstrap.css": ""
    }
  };

  //Font Awesome 4.0.3 (CSS only)

  // Raphaël 2.1.2 ( + Eve 0.4.2) AMD compatible
  requirePaths['cdf/lib/raphael'] = prefix + '/Raphael/raphael';

  // Base64
  requirePaths['cdf/lib/base64'] = prefix + '/base64';
  requireShims['cdf/lib/base64'] = {
    exports: 'Base64'
  };

  // Moment 2.24.0
  requirePaths['cdf/lib/moment'] = prefix + '/moment/moment';
  requireConfig['cdf/lib/moment'] = {
    noGlobal: true
  };

  //mapping all moment requests from inside cdf to 'cdf/lib/moment'
  requireCfg.map['cdf']['moment'] = 'cdf/lib/moment';

  // Moment-timezone with data 0.5.13-2017b
  requirePaths['cdf/lib/moment-timezone'] = prefix + '/moment-timezone/moment-timezone-with-data';
  amdShim["cdf/lib/moment-timezone"] = {
    exports: "moment",
    deps: {
      "cdf/lib/moment": "moment"
    }
  };

  //xmla4js
  requirePaths['cdf/lib/xmla'] = prefix + "/xmla/Xmla";
  amdShim["cdf/lib/xmla"] = {
    exports: "Xmla"
  };

  // backbone.treeModel
  requirePaths['cdf/lib/backbone.treemodel'] = prefix + "/backboneTreemodel/backbone.treemodel";
  amdShim["cdf/lib/backbone.treemodel"] = {
    exports: "Backbone",
    deps: {
      "amd!cdf/lib/underscore" : "_",
      "amd!cdf/lib/backbone" : "Backbone"
    },
    prescript: "var root = { Backbone: Backbone, _: _ };\n"
    + "(function() {\n",
    postscript: "}.call(root));\n"
    + "return root.Backbone;"
  };

  // mCustomScrollbar: jquery mousewheel plugin v3.1.12, MIT License
  requirePaths['cdf/lib/jquery.mCustomScrollbar'] = prefix + "/mCustomScrollbar/jquery.mCustomScrollbar.concat.min";
  amdShim["cdf/lib/jquery.mCustomScrollbar"] = {
    exports: "jQuery",
    deps: {
      "cdf/lib/jquery": "jQuery",
      "css!cdf/lib/mCustomScrollbar/jquery.mCustomScrollbar.min": ""
    }
  };

})();
