/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


define('cdf/dashboard/Dashboard.ext', [], function() {
  var DashboardExt = {
    pluginName: "pentaho-cdf",
    samplesBasePath: "/public/plugin-samples/",

    getPluginBase: function( plugin ) {
      return "";
    },

    getCdfBase: function () {
      return "";
    },

    getFilePathFromUrl: function() {
      return "";
    },

    getTimestamp: function() {
      return "ts=" + new Date().getTime();
    },

    getFullPath: function(path, action) {
      return "";
    },

    composePath: function(options) {
      return "";
    },

    getSettings: function(action, key) {
      return "";
    },

    getServiceAction: function(method, solution, path, action) { 
      return ""; 
    },

    getStaticResource: function(resource) {
      return "/base/src/test/javascript/cdf/dashboard/";
    },

    getCaptifyZoom: function() {
      return "";
    },

    getExport: function() {
      return "";
    },

    getPluginEndpoint: function(plugin, endpoint) {
      return "";
    },

    getJSONSolution: function() {
      return "";
    },

    getRenderHTML: function() {
      return "";
    }
  };

  return DashboardExt;
});
