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

define([
  'amd!../lib/underscore',
  './UnmanagedComponent',
  'common-ui/vizapi/data/DataTable',
  'common-ui/vizapi/VizController',
  'common-ui/vizapi/vizTypeRegistry'
], function(_, UnmanagedComponent, DataTable, VizController, vizTypes) {

  var VisualizationAPIComponent = UnmanagedComponent.extend({

    update: function() {
      this.beginQuery(this.queryDefinition, this.render);
    },

    render: function(data) {
      var vizDiv     = this.placeholder()[0],
          vizType    = this.getVizType(),
          vizOptions = this.getVizOptions(),
          gDataTable = this.createGoogleDataTable(data),
          controller = new VizController(0);
      
      controller.setDomNode(vizDiv);
      controller.setDataTable(gDataTable);
      controller.setVisualization(vizType, vizOptions, _.bind(this.endExec, this));
    },
  	
    getVizOptions: function() {
      var options = {};
      
      _.each(this.vizOptions, function(option) {
        options[option[0]] = this.getParameterValue(option[1]);
      }, this.dashboard);
      
      return options;
    },

    getVizType: function() {
      return vizTypes.get(this.vizId);
    },

    createGoogleDataTable: function(jsonTable) {
      return new DataTable(jsonTable);
    }
  });

  return VisualizationAPIComponent;

});
