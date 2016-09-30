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
  var Context;
  var GlobalContextVars;
  var BaseView;

  return UnmanagedComponent.extend({

    // Unit tests support.
    __require: (typeof require !== "undefined" ? require : null),
    __reset: function() {
      Context = null;
      GlobalContextVars = null;
      BaseView = null;
    },

    update: function() {
      if(!Context)
        this._requireFilesAndUpdate();
      else
        this._updateCore();
    },

    _requireFilesAndUpdate: function() {
      // Not caring about preExec()...
      var me = this;
      me.__require(["pentaho/type/Context", "pentaho/GlobalContextVars", "pentaho/visual/base/View"], function(_Context_, _GlobalContextVars_, _BaseView_) {
        Context = _Context_;
        GlobalContextVars = _GlobalContextVars_;
        BaseView = _BaseView_;
        me._updateCore();
      });
    },

    _updateCore: function() {
      var render = _.bind(this.render, this);
      this.triggerQuery(this.queryDefinition, render);
    },
  
    render: function(data) {
      var domElem = this.placeholder()[0];
      
      var contextVars = new GlobalContextVars({application: "pentaho-cdf"});

      var _context = new Context(contextVars);      
      var Model = _context.get(Dashboards.getParameterValue('vizTypeId'));
      
      var createdModel = new Model(this.getVisualSpec());
      
      BaseView.createAsync(domElem, createModel).then(function (view) {
        view.update().then(function () {
            //Nothing happens...
        });
      
      
      });
    },

    getVisualSpec: function() {
      var visualSpec = {};
      $.each(this.vizOptions, function(i, v) {
        var key = v[0], value = Dashboards.getParameterValue(v[1]);
        visualSpec[key] = value;
      });


      return visualSpec;
    }
  });
}());
