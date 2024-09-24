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

define([
  'common-ui/util/URLEncoder',
  'pentaho/environment'
], function(Encoder, environment) {
  return {
    pluginName: "pentaho-cdf",
    samplesBasePath: "/public/plugin-samples/",

    /**
     * Gets the base path of the provided plugin.
     *
     * @param {string} plugin the plugin
     * @return {string} the base path of the plugin
     */
    getPluginBase: function(plugin) {
      return environment.server.root + "plugin/" + plugin + "/api";
    },

    /**
     * Gets the base websocket path of the provided plugin.
     *
     * @param {string} plugin the plugin
     * @return {string} the base websocket path of the plugin
     */
    getPluginWebsocketBase: function(plugin) {
      return this.httpUrlToWebSocketUrl(""+environment.server.root) + plugin + "/websocket";
    },

    /**
     * Gets the base path of the CDF plugin.
     *
     * @return {string} the base path of CDF
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
     * @param {string} path the path
     * @param {string} action the action
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

    /**
     * Gets a string containing the path that allows to execute a settings action given
     * the action to execute (e.g. get or set) and an optional key.
     *
     * @param {string} action the action to execute
     * @param {string} key the key parameter
     * @return {string} the path that allows to execute an action given an optional key
     */
    getSettings: function(action, key) {
      if(key) {
        return this.getCdfBase() + "/settings/" + action + "?" + $.param({key: key});
      } else {
        return this.getCdfBase() + "/settings/" + action;
      }
    },

    /**
     * Gets a string containing the path that allows to execute a xaction.
     *
     * @param {string} method service method to execute (deprecated)
     * @param {string} solution the solution folder (deprecated)
     * @param {string} path the path to the xaction
     * @param {string} action the xaction name
     * @return {string} the path that allows to execute a xaction
     */
    getServiceAction: function(method, solution, path, action) { 

      var arr = {};
      arr.wrapper = false;
      arr.action = action;
      arr.url = Encoder.encode(
        environment.server.root + "api/repos/{0}/generatedContent",
        Encoder.encodeRepositoryPath(this.getFullPath(path, action))
      );

      return arr; 
    },

    /**
     * Gets a string containing the path for a given resource.
     *
     * @param {string} resource the resource to which the path should point
     * @return {string} the path to the provided resource
     */
    getStaticResource: function(resource) {
      return this.getCdfBase() + "/resources/" + resource;
    },

    /**
     * Gets a string containing the path for the zoom HTML file.
     *
     * @return {string} the zoom HTML file path
     */
    getCaptifyZoom: function() {
      return this.getStaticResource("js/lib/captify/zoom.html");
    },

    /**
     * Gets a string containing the export endpoint path.
     *
     * @return {string} the export endpoint path
     */
    getExport: function() {
      return this.getCdfBase() + "/export";
    },

    getPluginEndpoint: function(plugin, endpoint) {
      return this.getPluginBase(plugin) + "/" + endpoint;
    },

    /**
     * Gets a string containing the getJSONSolution endpoint path.
     *
     * @return {string} the getJSONSolution endpoint path
     */
    getJSONSolution: function() {
      return this.getCdfBase() + "/getJSONSolution";
    },

    /**
     * Gets a string containing the RenderHtml endpoint path.
     *
     * @return {string} the RenderHtml endpoint path
     */
    getRenderHTML: function() {
      return this.getCdfBase() + "/RenderHtml";
    },

    /**
     * Converts a http:// or https:// url into a ws:// or wss:// url.
     * @param (string) the URL to convert
     * @returns {string} the converted URL
     */
    httpUrlToWebSocketUrl: function( url ) {
      return url.replace(/(http)(s)?\:\/\//i, "ws$2://");
    }
  };

});
