/* globals requireCfg, packageInfo, getVersionedModuleId */

var modulePath = packageInfo.webRootPath;

requireCfg.config = requireCfg.config || {};

var requirePaths = requireCfg.paths,
  requireShims = requireCfg.shim,
  requireConfig = requireCfg.config;

// configure text! plugin for usage in embedded environments (CORS)
requireConfig[getVersionedModuleId('text')] = {
  onXhr: function(xhr, url) {
    //Called after the XHR has been created and after the
    //xhr.open() call, but before the xhr.send() call.
    //Useful time to set headers.
    xhr.withCredentials = true;
  }
};

// configure cdf's jquery shim
// (not in package.json because functions aren't supported)
requireShims[getVersionedModuleId('cdf/lib/jquery')] = {
  exports: '$',
  init: function() {
    return $.noConflict(true);
  }
};

var isDebug = typeof document == "undefined" || document.location.href.indexOf("debug=true") > 0;

// switch paths to use non-compressed versions
if(isDebug) {
  var prefix = modulePath + '/lib';

  requirePaths[getVersionedModuleId('cdf')] = modulePath;

  requirePaths[getVersionedModuleId('cdf/lib')] = prefix;

  // RequireJS amd! loader plugin. Wraps non-AMD scripts as AMD modules on the fly,
  // to be used when a shim isn't enough (see plugin prescript and postscript).
  requirePaths[getVersionedModuleId('amd')] = prefix + '/require-amd/nonamd';

  requirePaths[getVersionedModuleId('css')] = prefix + '/require-css/css';

  //RequireJS text! loader plugin 2.0.14
  requirePaths[getVersionedModuleId('text')] = prefix + '/require-text/text';

  // RequireJS dash! loader plugin 0.0.1
  requirePaths[getVersionedModuleId('dash')] = prefix + '/require-dashboard/dashboard';

  //modernizr 2.8.3
  requirePaths[getVersionedModuleId('cdf/lib/modernizr')] = prefix + '/modernizr/modernizr-2.8.3';

  //Google Caja HTML Sanitizer 0.1.3 with dependencies
  requirePaths[getVersionedModuleId('cdf/lib/sanitizer/lib/html4')] = prefix + '/sanitizer/lib/html4';
  requirePaths[getVersionedModuleId('cdf/lib/sanitizer/lib/uri')] = prefix + '/sanitizer/lib/uri';
  requirePaths[getVersionedModuleId('cdf/lib/sanitizer')] = prefix + '/sanitizer/sanitizer';

  //jquery without globally scoped variables
  requirePaths[getVersionedModuleId('cdf/lib/jquery')] = prefix + '/jQuery/jquery';

  //jquery.ui 1.10.4
  requirePaths[getVersionedModuleId('cdf/lib/jquery.ui')] = prefix + "/jQuery/jquery.ui";

  //jquery.blockUI 2.66.0
  requirePaths[getVersionedModuleId('cdf/lib/jquery.blockUI')] = prefix + "/blockUI/jquery.blockUI";

  //jquery-impromptu 5.2.4
  requirePaths[getVersionedModuleId('cdf/lib/jquery.impromptu')] = prefix + "/impromptu/jquery-impromptu";

  //jquery.fancybox 2.1.5
  requirePaths[getVersionedModuleId('cdf/lib/jquery.fancybox')] = prefix + "/fancybox/jquery.fancybox";

  //daterangepicker.jQuery 01.19.2008
  requirePaths[getVersionedModuleId('cdf/lib/daterangepicker.jQuery')] = prefix + "/daterangepicker/daterangepicker.jQuery";

  //underscore 1.8.3
  requirePaths[getVersionedModuleId('cdf/lib/underscore')] = prefix + "/underscore/underscore";

  //backbone 1.2.3
  requirePaths[getVersionedModuleId('cdf/lib/backbone')] = prefix + "/backbone/backbone";

  //mustache 0.8.1
  requirePaths[getVersionedModuleId('cdf/lib/mustache')] = prefix + "/mustache/mustache";

  //mustache-wax 0.9.0
  requirePaths[getVersionedModuleId('cdf/lib/mustache-wax')] = prefix + "/mustacheWax/mustache-wax";

  //Base 1.1a
  requirePaths[getVersionedModuleId('cdf/lib/Base')] = prefix + "/base/Base";

  //BaseEvents
  requirePaths[getVersionedModuleId('cdf/lib/BaseEvents')] = prefix + "/baseEvents/BaseEvents";

  //BaseSelectionTree
  requirePaths[getVersionedModuleId('cdf/lib/BaseSelectionTree')] = prefix + "/baseSelectionTree/BaseSelectionTree";
  requirePaths[getVersionedModuleId('cdf/lib/Tree')] = prefix + "/baseSelectionTree/Tree";

  //datatables 1.10.1
  requirePaths[getVersionedModuleId('cdf/lib/datatables')] = prefix + "/dataTables/js/jquery.dataTables";

  //captify
  requirePaths[getVersionedModuleId('cdf/lib/captify')] = prefix + "/captify/captify";

  //bgiframe 3.0.1
  requirePaths[getVersionedModuleId('cdf/lib/jquery.bgiframe')] = prefix + "/bgiframe/jquery.bgiframe";

  //positionBy 1.0.7 (2008-01-29)
  requirePaths[getVersionedModuleId('cdf/lib/jquery.positionBy')] = prefix + "/positionBy/jquery.positionBy";

  //jdMenu 1.4.1 (2008-03-31)
  requirePaths[getVersionedModuleId('cdf/lib/jquery.jdMenu')] = prefix + "/jdMenu/jquery.jdMenu";

  //jquery i18n
  requirePaths[getVersionedModuleId('cdf/lib/cdf.jquery.i18n')] = prefix + "/i18n/cdf.jquery.i18n";
  requirePaths[getVersionedModuleId('cdf/lib/jquery.i18n')] = prefix + "/i18n/jquery.i18n.properties";

  //OpenLayers 2.13.1
  requirePaths[getVersionedModuleId('cdf/lib/OpenLayers')] = prefix + "/OpenMap/OpenLayers/OpenLayers";

  //OpenStreetMap
  requirePaths[getVersionedModuleId('cdf/lib/OpenStreetMap')] = prefix + "/OpenStreetMap";

  //jQuery uriQueryParser 2013
  requirePaths[getVersionedModuleId('cdf/lib/queryParser')] = prefix + "/uriQueryParser/jquery-queryParser";

  //jQuery sparkline 2.1.2
  requirePaths[getVersionedModuleId('cdf/lib/jquery.sparkline')] = prefix + "/sparkline/jquery.sparkline";

  //jQuery corner 2.13
  requirePaths[getVersionedModuleId('cdf/lib/jquery.corner')] = prefix + "/corner/jquery.corner";

  //jQuery Select2 4.0.3
  requirePaths[getVersionedModuleId('cdf/lib/jquery.select2')] = prefix + "/select2/select2";

  //jQuery Chosen 0.9.1
  requirePaths[getVersionedModuleId('cdf/lib/jquery.chosen')] = prefix + "/chosen/chosen.jquery";

  //jQuery MultiSelect UI Widget 1.12
  requirePaths[getVersionedModuleId('cdf/lib/jquery.multiselect')] = prefix + "/hynds/jquery.multiselect";

  //shims
  requirePaths[getVersionedModuleId('cdf/lib/shims')] = prefix + "/shims";

  /*
   * Dashboard types shims (Bootstrap)
   */

  //HTML5 Shiv 3.7.2 (IE8)
  requirePaths[getVersionedModuleId('cdf/lib/html5shiv')] = prefix + '/html5shiv/html5shiv';

  //Respond.js v1.4.0 (IE8, load after bootstrap.css)
  requirePaths[getVersionedModuleId('cdf/lib/respond')] = prefix + '/respond/respond';

  //bootstrap 3.1.1
  requirePaths[getVersionedModuleId('cdf/lib/bootstrap')] = prefix + '/Bootstrap/js/bootstrap';

  //Font Awesome 4.0.3 (CSS only)

  // Raphaël 2.1.2 ( + Eve 0.4.2) AMD compatible
  requirePaths[getVersionedModuleId('cdf/lib/raphael')] = prefix + '/Raphael/raphael';

  // Base64
  requirePaths[getVersionedModuleId('cdf/lib/base64')] = prefix + '/base64';

  // Moment 2.9.0
  requirePaths[getVersionedModuleId('cdf/lib/moment')] = prefix + '/moment/moment';

  // Moment-timezone with data 0.5.13-2017b
  requirePaths[getVersionedModuleId('cdf/lib/moment-timezone')] = prefix + '/moment-timezone/moment-timezone-with-data';

  //xmla4js
  requirePaths[getVersionedModuleId('cdf/lib/xmla')] = prefix + "/xmla/Xmla";

  // backbone.treeModel
  requirePaths[getVersionedModuleId('cdf/lib/backbone.treemodel')] = prefix + "/backboneTreemodel/backbone.treemodel";

  // mCustomScrollbar: jquery mousewheel plugin v3.1.12, MIT License
  requirePaths[getVersionedModuleId('cdf/lib/jquery.mCustomScrollbar')] = prefix + "/mCustomScrollbar/jquery.mCustomScrollbar.concat.min";
}
