/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
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

requireCfg = {
  paths: {},
  shim: {}
};

var KARMA_RUN = true;

var SESSION_NAME = "dummy";
var CONTEXT_PATH = "/pentaho/";
var SESSION_LOCALE = "en-US";

// Mock BA server 'pentaho' object
var pentaho = {
  visualizations: [{id: "sampleViz"}],
  VizController: function(id) {
    this.id = id;
  },
  DataTable: function(data) {
    this.data = data;
  }
};
pentaho.VizController.prototype.setDomNode = function(p1) {};
pentaho.VizController.prototype.setDataTable = function(p1) {};
pentaho.VizController.prototype.setVisualization = function(p1, p2) {};
pentaho.visualizations.getById = function(p1) {};

requireCfg.paths['common-ui'] = 'js-lib/expanded/common-ui';
