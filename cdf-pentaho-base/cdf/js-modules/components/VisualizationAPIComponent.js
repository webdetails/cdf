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

define([
  'amd!../lib/underscore',
  './UnmanagedComponent',
  'pentaho/visual/Wrapper'
], function(_, UnmanagedComponent, VisualWrapper) {

  var VisualizationAPIComponent = UnmanagedComponent.extend({

    update: function() {
      this.beginQuery(this.queryDefinition, this.render);
    },

    render: function(data) {
      var domElem = this.placeholder()[0];
      var wrapper = new VisualWrapper(domElem);
      wrapper.data = data;
      wrapper.visualSpec = this.getVisualSpec();
      wrapper.update()
        .then(_.bind(this.endExec, this), _.bind(this.failExec, this));
    },
  	
    getVisualSpec: function() {
      var visualSpec = {};
      
      _.each(this.vizOptions, function(option) {
        visualSpec[option[0]] = this.getParameterValue(option[1]);
      }, this.dashboard);

      visualSpec.type = this.vizId;

      return visualSpec;
    }
  });

  return VisualizationAPIComponent;
});
