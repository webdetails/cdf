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

wd = wd || {};
wd.cdf = wd.cdf || {};

wd.cdf.helper = {

  getTimestamp: function() { return "ts=" + new Date().getTime(); }

};

wd.cdf.endpoints = {

  // Dashboards.Startup.js determines webAppPath
  getWebapp: function () { return webAppPath; },

  getXmla: function () { return wd.cdf.endpoints.getWebapp() + "/Xmla"; },

  getPluginBase: function( plugin ) { return wd.cdf.endpoints.getWebapp() + "/content/" + plugin; },

  getCdfBase: function () { return wd.cdf.endpoints.getPluginBase('pentaho-cdf'); },

  getCdaBase: function () { return wd.cdf.endpoints.getPluginBase('cda'); },

  getPluginEndpoint: function( plugin, endpoint ) { return wd.cdf.endpoints.getPluginBase(plugin) + "/" + endpoint; },

  getStorage: function ( action ) { return wd.cdf.endpoints.getCdfBase() + "/Storage";  },

  getSettings: function ( action, key ) {
    if ( key ){
      return wd.cdf.endpoints.getCdfBase() + "/Settings?method=" + action + "&key=" + key;
    }else{
      return wd.cdf.endpoints.getCdfBase() + "/Settings?method=" + action;
    }
  },

  getViewAction: function () { return wd.cdf.endpoints.getWebapp() + "/ViewAction"; },

  getJSONSolution: function () { return wd.cdf.endpoints.getCdfBase() + "/JSONSolution"; },

  getRenderHTML: function () { return wd.cdf.endpoints.getCdfBase() + "/RenderHtml"; },

  getExport: function () { return wd.cdf.endpoints.getCdfBase() + "/Export"; },

  getResource: function() { return wd.cdf.endpoints.getCdfBase() + "/GetCDFResource"; },

  getStaticResource: function( resource ) { return wd.cdf.endpoints.getCdfBase() + "/" + resource; },

  getCdfXaction: function( path, action, solution, params ) {
    if (params){
      // go through parametere array and update values
      var parameters = [];
      for(key in params){
        ( typeof params[key]=='function' ? parameters.push( key+"="+params[key]() ) : parameters.push( key+"="+params[key] ) );
      }
      return wd.cdf.endpoints.getViewAction() + "?solution=" + (solution || "system") + "&path=" + path + "&action=" + action + "&" + wd.cdf.helper.getTimestamp() + "&" + parameters.join('&');
    }else{
      return wd.cdf.endpoints.getViewAction() + "?solution=" + (solution || "system") + "&path=" + path + "&action=" + action + "&" + wd.cdf.helper.getTimestamp();
    }
  },

  getServiceAction: function( method, solution, path, action ) { 

    var arr = {};
    arr.wrapper = false;
    arr.solution = solution;
    arr.path = path;
    arr.action = action;
    arr.url = wd.cdf.endpoints.getWebapp() + "/" + method;

    return arr; 
  },  

  getComments: function ( action ) { return wd.cdf.endpoints.getCdfBase() + "/Comments"; },

  getPivot: function ( solution, path, action ) { return wd.cdf.endpoints.getWebapp() + "/Pivot?solution=" + (solution || "system") + "&path=" + path + "&action=" + action; },

  getReportViewer: function( parameters ){ return wd.cdf.endpoints.getPluginBase("reporting") + "/reportviewer/report.html" + ( (parameters) ? "?" + parameters : ""); },

  getOpenFlashChart: function(){ return wd.cdf.endpoints.getWebapp() + "/openflashchart"; },

  getAnalyzer: function() { wd.cdf.endpoints.getPluginBase("analyzer/"); },

  getCaptifyZoom: function(){ return wd.cdf.endpoints.getCdfBase() + "/js/captify/zoom.html"; },

  getDoQuery: function(){ return wd.cdf.endpoints.getCdaBase() + "/doQuery?"; },

  getUnwrapQuery: function( parameters ){ return wd.cdf.endpoints.getCdaBase() + "/unwrapQuery?" + $.param( parameters ); }

};
