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

define(['common-ui/util/URLEncoder'], function(Encoder) {
  var DashboardExt = {
    pluginName: "pentaho-cdf",
    samplesBasePath: "/public/plugin-samples/",

    /**
     *
     * @param plugin
     * @return {string}
     */
    getPluginBase: function(plugin) {
      return CONTEXT_PATH + "plugin/" + plugin + "/api";
    },

    /**
     *
     * @return {string}
     */
    getCdfBase: function() {
      return this.getPluginBase( this.pluginName );
    },

    /**
     * Returns the file path translated from the url.
     * The url can (or not) be encoded, so paths like /pentaho/api/repos/:path1:path2:path3:path4/myOperation
     * or /pentaho/api/repos/%3path1%3path2%3path3%3path4/myOperation will be correctly translated
     *
     * @return {string} the file path
     */
    getFilePathFromUrl: function() {
      var filePath = window.location.pathname;
      if(filePath.indexOf("/:") == -1) {
        filePath = decodeURIComponent(window.location.pathname);
      }
      if(filePath.indexOf("/:") > 0) {
        var regExp = filePath.match("(/:)(.*)(/)");
        if(regExp[2]) {
          return "/"+regExp[2].replace(new RegExp(":", "g"), "/");
        }
      }
    },

    /**
     * Returns a URL parameter for cache-busting purposes.
     *
     * @return {string} the timestamp parameter of an URL
     */
    getTimestamp: function() {
      return "ts=" + new Date().getTime();
    },

    /**
     * Returns the full path to an explicit action.
     *
     * @return {string} the full path
     */
    getFullPath: function(path, action) {

      path = path || "";
      action = action || "";

      var fullPath = path.indexOf(this.pluginName) == 0 ? (this.samplesBasePath + path) : path;
      fullPath = fullPath + (action ? "/" + action : "").replace(/\/\//g, '/');

      return fullPath;
    },

    /**
     * Builds a full path based on the properties of the options parameter provided.
     *
     * @param {object} options An object with solution, path or action properties for path building.
     * @return {string} the full path
     */
    composePath: function(options) {
      var clean = function(segment) {
        if(segment.charAt(0) == "/") {
          segment = segment.substring(1, segment.length);
        }
        if(segment.charAt(segment.length - 1) == "/") {
          segment = segment.substring(0, segment.length - 1);
        }
        return segment
      };
      var fullPath = "/";
      if(options.solution) {
        fullPath += clean(options.solution) + "/";
      }
      if(options.path) {
        fullPath += clean(options.path);
      }
      if(options.action) {
        fullPath += "/" + clean(options.action);
      }
      return fullPath;
    },




    /* ToDo: Documentation */

    getSettings: function(action, key) {
      if(key) {
        return this.getCdfBase() + "/settings/" + action + "?" + $.param({key: key});
      } else {
        return this.getCdfBase() + "/settings/" + action;
      }
    },

    getServiceAction: function(method, solution, path, action) { 

      var arr = {};
      arr.wrapper = false;
      arr.action = action;
      arr.url = Encoder.encode(
        CONTEXT_PATH + "api/repos/{0}/generatedContent",
        Encoder.encodeRepositoryPath(this.getFullPath(path, action))
      );

      return arr; 
    },

    getStaticResource: function(resource) {
      return this.getCdfBase() + "/resources/" + resource;
    },

    getCaptifyZoom: function() {
      return this.getStaticResource("js/lib/captify/zoom.html");
    },

    getExport: function() {
      return this.getCdfBase() + "/Export";
    },

    getPluginEndpoint: function(plugin, endpoint) {
      return this.getPluginBase(plugin) + "/" + endpoint;
    },

    getJSONSolution: function() {
      return this.getCdfBase() + "/getJSONSolution";
    },

    getRenderHTML: function() {
      return this.getCdfBase() + "/RenderHtml";
    }
  };

  return DashboardExt;
});
