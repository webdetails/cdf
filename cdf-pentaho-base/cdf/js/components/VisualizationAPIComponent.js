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

var VisualizationAPIComponent = (function() {
  var DataTable, VizController, vizTypeRegistry;

  return UnmanagedComponent.extend({

    // Unit tests support.
    __require: require,
    __reset: function() {
      DataTable = VizController = vizTypeRegistry = null;
    },

    update: function() {
      if(!vizTypeRegistry) {
        this._requireFilesAndUpdate();    
      } else {
        this._updateCore();
      }
    },

    _requireFilesAndUpdate: function() {
      // Not caring about preExec()...
      var me = this;
      me.__require([
        "common-ui/vizapi/data/DataTable",
        "common-ui/vizapi/VizController",
        "common-ui/vizapi/vizTypeRegistry",
      ], function(_DataTable_, _VizController_, _vizTypeRegistry_) {
        DataTable = _DataTable_;
        VizController = _VizController_;
        vizTypeRegistry = _vizTypeRegistry_;
        
        me._updateCore();
      });
    },

    _updateCore: function() {
      var render = _.bind(this.render, this);
      this.triggerQuery(this.queryDefinition, render);
    },

    render: function(data) {
      var vizDiv = this.placeholder()[0];
      var visualization = this.getVizType();
      var vizOptions = this.getVizOptions();
      var gDataTable = this.createGoogleDataTable(data);

      var controller = new VizController(0);
      controller.setDomNode(vizDiv);
      controller.setDataTable(gDataTable);
      controller.setVisualization(visualization, vizOptions);
      // execution is ended immediately afterwards, although in practice,
      // the VizAPI will not render synchronously. 
    },

    getVizOptions: function() {
      var options = {};
      $.each(this.vizOptions, function(i, v) {
        var key = v[0], value = Dashboards.getParameterValue(v[1]);
        options[key] = value;
      });
      return options;
    },

    getVizType: function() {
      return vizTypeRegistry.get(this.vizId);
    },

    createGoogleDataTable: function(resultJson) {
      return new DataTable(resultJson);
    }
  });
}());
