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
  var VisualWrapper;

  return UnmanagedComponent.extend({

    // Unit tests support.
    __require: (typeof require !== "undefined" ? require : null),
    __reset: function() {
      VisualWrapper = null;
    },

    update: function() {
      if(!VisualWrapper)
        this._requireFilesAndUpdate();
      else
        this._updateCore();
    },

    _requireFilesAndUpdate: function() {
      // Not caring about preExec()...
      var me = this;
      me.__require(["pentaho/visual/Wrapper"], function(_VisualWrapper_) {
        VisualWrapper = _VisualWrapper_;
        
        me._updateCore();
      });
    },

    _updateCore: function() {
      var render = _.bind(this.render, this);
      this.triggerQuery(this.queryDefinition, render);
    },
  
    render: function(data) {
      var domElem = this.placeholder()[0];
      var wrapper = new VisualWrapper(domElem, /*containerTypeId:*/"cdf");
      wrapper.data = data;
      wrapper.visualSpec = this.getVisualSpec();
      wrapper.update();
      // execution is ended immediately afterwards, although in practice,
      // the VisualizationAPI will not render synchronously.
    },

    getVisualSpec: function() {
      var visualSpec = {};
      $.each(this.vizOptions, function(i, v) {
        var key = v[0], value = Dashboards.getParameterValue(v[1]);
        visualSpec[key] = value;
      });

      visualSpec.type = this.vizId;

      return visualSpec;
    }
  });
}());
