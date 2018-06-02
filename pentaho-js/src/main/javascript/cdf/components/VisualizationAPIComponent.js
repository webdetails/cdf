/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  'pentaho/data/Table',
  'pentaho/visual/base/View',
  'pentaho/shim/es6-promise'
], function (_, UnmanagedComponent, Table, BaseView, Promise) {

  "use strict";

  // ATTENTION: A part of this code is synchronized with:
  // cdf/pentaho-js/src/main/javascript/cdf-legacy/components/VisualizationAPIComponent.js

  return UnmanagedComponent.extend({

    /**
     * Gets the visualization view instance.
     *
     * @type {?pentaho.type.visual.base.View}
     * @readOnly
     */
    vizView: null,

    update: function() {
      this.beginQuery(this.queryDefinition, this.render);
    },

    /**
     * Called to _continue_ updating the component given the fetched data.
     *
     * This method ends the component execution when the update has finished.
     *
     * @param {object} dataSpec - The data specification.
     */
    render: function(dataSpec) {
      var promiseView = !this.vizView
          ? this.__createVizViewAsync(dataSpec)
          : this.__syncVizViewAsync(dataSpec);

      promiseView
          .then(function(vizView) {
            return vizView.update();
          })
          .then(_.bind(this.endExec, this), _.bind(this.failExec, this));
    },

    // region protected members
    /**
     * Called to complete the synchronization specification of the visualization view and model
     * from the component's state.
     *
     * When this method is called, the given specification has already been updated
     * according to the base class' rules. Override to perform additional updates.
     *
     * On the first component update, this method is called before `_onVizViewCreated` and
     * before the view and model haven been created.
     * This special situation can be tested by checking that `this.vizView` is `null`.
     *
     * The default implementation does nothing.
     *
     * @param {!pentaho.type.visual.base.spec.IView} vizViewSpec - The visualization view specification.
     *
     * @protected
     */
    _onVizViewSyncSpec: function(vizView) {
      // NOOP
    },

    /**
     * Called when the visualization view has been created, but the before its initial update.
     *
     * This method can be used to, for example, attach event listeners to the visualization view.
     *
     * The default implementation does nothing.
     *
     * @param {!pentaho.type.visual.base.View} vizView - The visualization view.
     *
     * @protected
     */
    _onVizViewCreated: function(vizView) {
      // NOOP
    },
    // endregion

    //region private members
    /**
     * Gets an updated view specification from several component properties.
     *
     * The `width` and `height` properties are read from the corresponding component properties.
     *
     * The `model.data` property is set from the given `dataSpec` argument, when specified and defined.
     *
     * Arbitrary visualization model properties are set from the contents of
     * the `vizOptions` component property and the current values of referenced dashboard parameters.
     *
     * Lastly, the `_onVizViewSyncSpec` method is called so that subclasses may further update the view and the model.
     *
     * @param {object} [dataSpec] - The data specification.
     *
     * @return {pentaho.visual.base.spec.IView} The visualization view specification.
     *
     * @private
     */
    __getVizViewSyncSpec: function(dataSpec) {

      // 1. Specially handled properties

      var viewSpec = {
        width: this.width,
        height: this.height,
        model: {}
      };

      var modelSpec = viewSpec.model;
      if(dataSpec !== undefined) {
        modelSpec.data = new Table(dataSpec);
      }

      // 2. Bound using `vizOptions`.
      _.each(this.vizOptions, function(v) {
        var propName = v[0];

        // Prevent binding these special properties using `vizOptions`.
        switch(propName) {
          case "data":
            return;
        }

        var paramName = v[1];
        var value = this.getParameterValue(paramName);

        modelSpec[propName] = value;
      }, this.dashboard);

      // 3. Protected method.
      this._onVizViewSyncSpec(viewSpec);

      return viewSpec;
    },

    /**
     * Creates a visualization view for a given a data specification.
     *
     * @param {object} dataSpec - The data specification.
     *
     * @return {Promise.<pentaho.type.visual.base.View>} A promise for the created visualization view.
     *
     * @private
     */
    __createVizViewAsync: function(dataSpec) {

      var viewSpec = this.__getVizViewSyncSpec(dataSpec);
      viewSpec.domContainer = this.placeholder()[0];

      // Disable, by default.
      if(viewSpec.isAutoUpdate == null) {
        viewSpec.isAutoUpdate = false;
      }

      viewSpec.model._ = this.vizId;

      var me = this;

      return BaseView.createAsync(viewSpec)
        .then(function(vizView) {

          me.vizView = vizView;

          me._onVizViewCreated(vizView);

          return vizView;
        });
    },

    /**
     * Synchronizes the current visualization view using several of the component properties.
     *
     * This method obtains the new view specification by calling `__getVizViewSyncSpec`
     * and then applies it, in a single transaction scope, to the current view and model objects.
     *
     * The view update operation is not performed.
     *
     * @param {!pentaho.type.visual.base.View} vizView - The visualization view.
     * @param {object} [dataSpec] - The data specification.
     *
     * @private
     */
    __syncVizView: function(dataSpec) {

      var vizView = this.vizView;

      // Disable while setting values, to not trigger an update.
      var isAutoUpdate = vizView.isAutoUpdate;
      if (isAutoUpdate) {
        vizView.isAutoUpdate = false;
      }

      var viewSpec = this.__getVizViewSyncSpec(dataSpec);

      // The transaction can throw, when proposed changes are canceled by an event handler.
      try {
        vizView.configure(viewSpec);
      } finally {
        // Restore auto update.
        if (isAutoUpdate) {
          vizView.isAutoUpdate = true;
        }
      }
    },

    /**
     * Synchronizes the given visualization view instance using several of the component properties,
     * asynchronously, and returns the visualization view.
     *
     * This method obtains the new view specification by calling `__getVizViewSyncSpec`
     * and then applies it, in a single transaction scope, to the current view and model objects.
     *
     * The view update operation is not performed.
     *
     * @param {object} dataSpec - The data specification.
     *
     * @return {Promise.<pentaho.type.visual.base.View>} A promise for the existing visualization view.
     *
     * @private
     */
    __syncVizViewAsync: function(dataSpec) {

      var me = this;

      return new Promise(function(resolve) {

        me.__syncVizView(dataSpec);

        resolve(me.vizView);
      });
    }
    // endregion
  });
});
