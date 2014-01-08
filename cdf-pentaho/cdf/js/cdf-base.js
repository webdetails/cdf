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

  getCdfBase: function () { return Endpoints.getWebapp() + "/content/pentaho-cdf"; },

  getCdaBase: function () { return Endpoints.getWebapp() + "/content/cda"; },

  getStorage: function ( action ) { return Endpoints.getWebapp() + "/Storage";  },

  getComments: function ( action ) { return Endpoints.getCdfBase() + "/Comments"; },

  getSettings: function ( action ) { return Endpoints.getCdfBase() + "/Settings?method=" + action; }

};
