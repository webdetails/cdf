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

var CDF_PLUGIN_NAME = "pentaho-cdf";
var SAMPLES_BASE_PATH = "/public/plugin-samples/";

wd = wd || {};
wd.cdf = wd.cdf || {};

wd.cdf.helper = {

  getTimestamp: function() { return "ts=" + new Date().getTime(); },

  getFullPath: function( path, action ) {

    path = path || "";
    action = action || "";

    var fullPath = path.indexOf( CDF_PLUGIN_NAME ) == 0 ? ( SAMPLES_BASE_PATH + path ) : path;
    fullPath = fullPath + ( action ? "/" + action : "" ).replace(/\/\//g, '/');

    return fullPath;
  },
  composePath: function(options) {
    var clean = function(segment) {
      if (segment.charAt(0) == "/") {
        segment = segment.substring(1, segment.length);
      }
      if (segment.charAt(segment.length - 1) == "/") {
        segment = segment.substring(0, segment.length - 1);
      }
      return segment
    };
    var fullPath = "/";
    if (options.solution) {
        fullPath += clean(options.solution) + "/";
    }
    if (options.path) {
        fullPath += clean(options.path);
    }
    if (options.action) {
        fullPath += "/" + clean(options.action);
    }
    return fullPath;
  }
};

wd.cdf.endpoints = {

  // Dashboards.Startup.js determines webAppPath
  getWebapp: function () { return webAppPath; },

  getPing: function () { return wd.cdf.endpoints.getCdfBase() + "/ping"; },

  getXmla: function () { return wd.cdf.endpoints.getWebapp() + "/Xmla"; },

  getPluginBase: function( plugin ) { return wd.cdf.endpoints.getWebapp() + "/plugin/" + plugin + "/api"; },

  getCdfBase: function () { return wd.cdf.endpoints.getPluginBase( CDF_PLUGIN_NAME ); },

  getCdaBase: function () { return wd.cdf.endpoints.getPluginBase('cda'); },

  getPluginEndpoint: function( plugin, endpoint ) { return wd.cdf.endpoints.getPluginBase(plugin) + "/" + endpoint; },

  getStorage: function ( action ) { return wd.cdf.endpoints.getCdfBase() + "/storage/"  + action; },

  getSettings: function ( action, key ) {
    if ( key ){
      return wd.cdf.endpoints.getCdfBase() + "/settings/" + action + "?" + $.param( {key: key} );
    }else{
      return wd.cdf.endpoints.getCdfBase() + "/settings/" + action;
    }
  },

  getViewAction: function () { return wd.cdf.endpoints.getCdfBase() + "/viewAction"; },

  getJSONSolution: function () { return wd.cdf.endpoints.getCdfBase() + "/getJSONSolution"; },

  getRenderHTML: function () { return wd.cdf.endpoints.getCdfBase() + "/RenderHtml"; },

  getExport: function () { return wd.cdf.endpoints.getCdfBase() + "/export"; },

  getResource: function() { return wd.cdf.endpoints.getCdfBase() + "/getResource"; },

  getStaticResource: function( resource ) { return wd.cdf.endpoints.getCdfBase() + "/resources/" + resource; },

  getSimileStaticResource: function( resource ) { return wd.cdf.endpoints.getWebapp() + "/api/repos/pentaho-cdf/js-legacy/lib/" + resource; },

  getXmlaStaticResource: function() { return wd.cdf.endpoints.getResource() + "?path=js/lib/xmla/Xmla.js"; },

  getCdfXaction: function( path, action, solution, params ) {
    if (params){
      var parameters = {};
      for(var key in params){
        parameters[key] = ( typeof params[key]=='function' ? params[key]() : params[key] );
      }
      return this.getEncoder().encode( wd.cdf.endpoints.getViewAction(), null, $.extend( { path: wd.cdf.helper.getFullPath( path, action ), ts: new Date().getTime() }, parameters ) );
    }else{
      return this.getEncoder().encode( wd.cdf.endpoints.getViewAction(), null, { path: wd.cdf.helper.getFullPath( path, action ), ts: new Date().getTime() } );
    }
  },

  getServiceAction: function( method, solution, path, action ) { 

    var arr = {};
    arr.wrapper = false;
    arr.action = action;
    arr.url = this.getEncoder().encode( wd.cdf.endpoints.getWebapp()+"/api/repos/{0}/generatedContent", this.getEncoder().encodeRepositoryPath( wd.cdf.helper.getFullPath( path, action ) ) );

    return arr; 
  }, 

  getComments: function ( action ) { 

  	var endpoint = "";

  	if( action == "LIST_ALL" || action == "LIST_ACTIVE" || action == "GET_LAST" ) {
      endpoint = "list";
    
    } else if( action == "DELETE_COMMENT" ) {
      endpoint = "delete";
    
    } else if( action == "ARCHIVE_COMMENT" ) {
      endpoint = "archive";
      
    } else if( action == "ADD_COMMENT" ) {
      endpoint = "add";
    }

  	return wd.cdf.endpoints.getCdfBase() + "/comments/" + endpoint + "?" + wd.cdf.helper.getTimestamp();
  },

  getScheduledJob: function() { return wd.cdf.endpoints.getWebapp() + "/api/scheduler/job"; },

  getEmailConfig: function() { return wd.cdf.endpoints.getWebapp() + "/api/emailconfig"; },

  getPivot: function ( solution, path, action ) { 
    var fullPath = path.indexOf( CDF_PLUGIN_NAME ) == 0 ? ( SAMPLES_BASE_PATH + path ) : path;
    return this.getEncoder().encode( wd.cdf.endpoints.getWebapp() + "/plugin/jpivot/Pivot", null, { solution: (solution || "system"), path: fullPath, action: action } );
  },

  getAnalyzer: function( path, callvar, parameters ) {
    return this.getEncoder().encode( wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/" + callvar, this.getEncoder().encodeRepositoryPath( wd.cdf.helper.composePath( path ) ), parameters );
  },

  getReport: function( path, callvar, parameters ) {
    /* callvar = report || viewer */
    if (typeof path === "string" || path instanceof String){
      return this.getEncoder().encode( wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/" + callvar, this.getEncoder().encodeRepositoryPath( path ), parameters );
    }else{
      return this.getEncoder().encode( wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/" + callvar, this.getEncoder().encodeRepositoryPath( wd.cdf.helper.composePath( path ) ), parameters );
    }
  },
  
  getCaptifyZoom: function(){ return wd.cdf.endpoints.getStaticResource("js-legacy/lib/captify/zoom.html"); },

  getDoQuery: function(){ return wd.cdf.endpoints.getCdaBase() + "/doQuery?"; },

  getUnwrapQuery: function( parameters ){ return wd.cdf.endpoints.getCdaBase() + "/unwrapQuery?" + $.param( parameters ); },

  getEncoder: function() {
    var enc;
    try {
      enc = Encoder;
    } catch(err) {}
    if (enc === undefined) {
      try {
        enc = pho.Encoder;
      } catch(err) {}
    }
    return enc;
  }
};
