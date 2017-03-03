/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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

/*global Promise:false */

var VisualizationAPIComponent = (function() {

  var BaseView;
  var Table;

  return UnmanagedComponent.extend({

    // Unit tests support.
    __reset: function () {
      BaseView = null;
      Table = null;
    },

    update: function () {
      if (!BaseView)
        this.__requireFilesAndUpdate();
      else
        this._updateCore();
    },

    __requireFilesAndUpdate: function () {
      // Not caring about preExec(), as it is already done by triggerQuery, below...
      var me = this;

      require([
        "pentaho/data/Table",
        "cdf/PentahoTypeContext",
        "pentaho/visual/base/view",
        "pentaho/shim/es6-promise"
      ], function(_Table_, PentahoTypeContext, baseViewFactory) {

        Table = _Table_;
        BaseView = PentahoTypeContext.getInstance().get(baseViewFactory);

        me._updateCore();
      });
    },

    _updateCore: function() {
      this.triggerQuery(this.queryDefinition, _.bind(this.render, this));
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

      var me = this;

      promiseView
          .then(function(vizView) {
            return vizView.update();
          })
          ["catch"](function(reason) {
            var domElem = me.placeholder()[0];
            Dashboards.error("Unable to update view for visualization component: " + reason);
            Dashboards.errorNotification({msg: "Error processing component: render_" + me.name}, domElem);
          });
    },

    // region copy & paste code from CDF require component version
    /**
     * Gets the visualization view instance.
     *
     * @type {pentaho.type.visual.base.View}
     * @readOnly
     */
    vizView: null,

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
     * Synchronizes the given visualization view instance using several of the component properties.
     *
     * The `width` and `height` properties are updated from the corresponding
     * component properties.
     *
     * The `model.data` property is updated from the given `dataSpec` argument, when specified and defined.
     *
     * Arbitrary visualization model properties are updated from the contents of
     * the `vizOptions` component property and the current values of referenced dashboard parameters.
     *
     * Lastly, the `_onVizViewSync` method is called so that subclasses may further update the view and the model.
     *
     * All changes to the view and the model are performed from within a single transaction.
     *
     * The view update operation is not performed.
     *
     * @param {!pentaho.type.visual.base.View} vizView - The visualization view.
     * @param {object} [dataSpec] - The data specification.
     *
     * @private
     */
    __syncVizView: function(vizView, dataSpec) {
    },

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
     * @return {!pentaho.visual.base.spec.IView} The visualization view specification.
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
     * @return {!Promise.<pentaho.type.visual.base.View>} A promise for the created visualization view.
     *
     * @private
     */
    __createVizViewAsync: function(dataSpec) {

      var viewSpec = this.__getVizViewSyncSpec(dataSpec);
      viewSpec.domContainer = this.placeholder()[0];

      if(viewSpec.isAutoUpdate == null) viewSpec.isAutoUpdate = false; // Disable, by default.

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
     * @return {!Promise.<pentaho.type.visual.base.View>} A promise for the existing visualization view.
     *
     * @private
     */
    __syncVizViewAsync: function(dataSpec) {

      var vizView = this.vizView;

      var me = this;

      return new Promise(function(resolve) {

        // Disable while setting values, to not trigger an update.
        var isAutoUpdate = vizView.isAutoUpdate;
        if(isAutoUpdate) vizView.isAutoUpdate = false;

        var viewSpec = me.__getVizViewSyncSpec(dataSpec);

        // Use a transaction to ensure that only a single model change action occurs.
        // This is relevant mostly for event handlers, which will be given a single changeset
        // with all of the changes.

        // Transactions can throw, when proposed changes are canceled by an event handler.
        try {
          vizView.type.context.enterChange().using(syncWithinTxn, me);
        } finally {
          // Restore auto update.
          if(isAutoUpdate) vizView.isAutoUpdate = true;
        }

        function syncWithinTxn(scope) {

          // TODO: Because #configure currently doesn't correctly handled nested specs properly
          // we have to do it by hand here.

          Object.keys(viewSpec).forEach(function(p) {
            if(p !== "model") {
              vizView.set(p, viewSpec[p]);
            }
          });

          var vizModel = vizView.model;
          var modelSpec = viewSpec.model;
          if(vizModel && modelSpec) {
            Object.keys(modelSpec).forEach(function(p) {
              vizModel.set(p, modelSpec[p]);
            });
          }

          // Accept changes.
          scope.accept();
        }

        resolve(vizView);
      });
    }
    // endregion

    // endregion
  });
}());
