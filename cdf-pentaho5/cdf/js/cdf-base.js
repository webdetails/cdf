/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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
  }   
};

wd.cdf.endpoints = {

  // Dashboards.Startup.js determines webAppPath
  getWebapp: function () { return webAppPath; },

  getXmla: function () { return wd.cdf.endpoints.getWebapp() + "/Xmla"; },

  getPluginBase: function( plugin ) { return wd.cdf.endpoints.getWebapp() + "/plugin/" + plugin + "/api"; },

  getCdfBase: function () { return wd.cdf.endpoints.getPluginBase( CDF_PLUGIN_NAME ); },

  getCdaBase: function () { return wd.cdf.endpoints.getPluginBase('cda'); },

  getPluginEndpoint: function( plugin, endpoint ) { return wd.cdf.endpoints.getPluginBase(plugin) + "/" + endpoint; },

  getStorage: function ( action ) { return wd.cdf.endpoints.getCdfBase() + "/storage/"  + action; },

  getSettings: function ( action ) { return wd.cdf.endpoints.getCdfBase() + "/settings/" + action; },

  getViewAction: function () { return wd.cdf.endpoints.getCdfBase() + "/viewAction"; },

  getJSONSolution: function () { return wd.cdf.endpoints.getCdfBase() + "/getJSONSolution"; },

  getRenderHTML: function () { return wd.cdf.endpoints.getCdfBase() + "/RenderHtml"; },

  getExport: function () { return wd.cdf.endpoints.getCdfBase() + "/Export"; },

  getResource: function() { return wd.cdf.endpoints.getCdfBase() + "/getResource"; },

  getCdfXaction: function( path, action, solution ) { 
    return wd.cdf.endpoints.getViewAction() + "?path=" + wd.cdf.helper.getFullPath( path, action ) + "&" + wd.cdf.helper.getTimestamp(); 
  },

  getServiceAction: function( method, solution, path, action ) { 

    var arr = {};
    arr.wrapper = false;
    arr.action = action;
    arr.url = wd.cdf.endpoints.getWebapp() + "/api/repos/" + wd.cdf.helper.getFullPath( path, action ).replace(/\//g, ":") + "/generatedContent";

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

  	return wd.cdf.endpoints.getCdfBase() + "/comments/" + endpoint;
  },

  getScheduledJob: function() { return wd.cdf.endpoints.getWebapp() + "/api/scheduler/job"; },

  getEmailConfig: function() { return wd.cdf.endpoints.getWebapp() + "/api/emailconfig"; },

  getPivot: function ( solution, path, action ) { return wd.cdf.endpoints.getWebapp() + "/Pivot?solution=" + (solution || "system") + "&path=" + path + "&action=" + action; },

  getAnalyzer: function() { return wd.cdf.endpoints.getWebapp() + "/content/analyzer/"; },

  getReportViewer: function( path, ts ) { return wd.cdf.endpoints.getWebapp() + '/api/repos/' + path + '/viewer?' + ts; },
  
  getCaptifyZoom: function(){ return wd.cdf.endpoints.getResource() + "/js/captify/zoom.html"; }
  
};
