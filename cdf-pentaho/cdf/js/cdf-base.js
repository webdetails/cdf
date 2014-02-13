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

var Endpoints = {

  // Dashboards.Startup.js determines webAppPath
  getWebapp: function () { return webAppPath; },

  getXmla: function () { return Endpoints.getWebapp() + "/Xmla"; },

  getPluginBase: function( plugin ) { return Endpoints.getWebapp() + "/content/" + plugin; },

  getCdfBase: function () { return Endpoints.getPluginBase('pentaho-cdf'); },

  getCdaBase: function () { return Endpoints.getPluginBase('cda'); },

  getPluginEndpoint: function( plugin, endpoint ) { return Endpoints.getPluginBase(plugin) + "/" + endpoint; },

  getStorage: function ( action ) { return Endpoints.getCdfBase() + "/Storage";  },

  getSettings: function ( action ) { return Endpoints.getCdfBase() + "/Settings?method=" + action; },

  getViewAction: function () { return Endpoints.getWebapp() + "/ViewAction"; },

  getJSONSolution: function () { return Endpoints.getCdfBase() + "/JSONSolution"; },

  getRenderHTML: function () { return Endpoints.getCdfBase() + "/RenderHtml"; },

  getExport: function () { return Endpoints.getCdfBase() + "/Export"; },

  getResource: function() { return Endpoints.getCdfBase() + "/GetCDFResource" },

  getCdfXaction: function( path, action ) { return Endpoints.getViewAction() +  "?solution=system&path=" + path + "&action=" + action; },

  getComments: function ( action ) { return Endpoints.getCdfBase() + "/Comments"; }
};
