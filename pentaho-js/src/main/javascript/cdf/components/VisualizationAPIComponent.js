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

define([
  'amd!../lib/underscore',
  './UnmanagedComponent',
  'pentaho/data/Table',
  '../PentahoTypeContext',
  'pentaho/visual/base/View',
  'pentaho/shim/es6-promise'
], function (_, UnmanagedComponent, Table, PentahoTypeContext, BaseView, Promise) {

  return UnmanagedComponent.extend({

    /**
     * Gets the visualization view instance.
     *
     * @type {pentaho.type.visual.base.View}
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
          : this.__syncVizModelAsync(dataSpec);

      promiseView
          .then(function(vizView) {
            return vizView.update();
          })
          .then(_.bind(this.endExec, this), _.bind(this.failExec, this));
    },

    // region protected members
    /**
     * Called to synchronize the visualization model from the component's state.
     *
     * When this method is called, the visualization model has already been updated
     * according to the base class' rules. Override to perform additional model updates.
     *
     * This method is called from within a model transaction,
     * so that any performed changes only trigger a single change action.
     *
     * On the first component update, this method is called before `_onVizViewCreated` and
     * right after the model has been created and initially populated.
     * This special situation can be tested by checking that `this.vizView` is `null`.
     *
     * The view update operation is performed later and should not be performed here.
     *
     * The default implementation does nothing.
     *
     * @param {!pentaho.type.visual.base.Model} vizModel - The visualization model.
     *
     * @protected
     */
    _onVizModelSync: function(vizModel) {
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
     * Synchronizes the given visualization model instance
     * using several of the component properties.
     *
     * The `width` and `height` properties are updated from the corresponding
     * component properties.
     *
     * The `data` property is updated from the given `dataSpec` argument, when specified and defined.
     *
     * Arbitrary visualization model properties are updated from the contents of
     * the `vizOptions` component property and the current values of referenced dashboard parameters.
     *
     * Lastly, the `_onVizModelSync` method is called so that subclasses may further update the model.
     *
     * All changes to the model are performed from within a single transaction.
     *
     * The view update operation is not performed.
     *
     * @param {!pentaho.type.visual.base.Model} vizModel - The visualization model.
     * @param {object} [dataSpec] - The data specification.
     *
     * @private
     */
    __syncVizModel: function(vizModel, dataSpec) {

      // Disable while setting values, to not trigger an update.
      var vizView = this.vizView;
      var isAutoUpdate = !!vizView && vizView.isAutoUpdate;
      if(isAutoUpdate) vizView.isAutoUpdate = false;

      // Use a transaction to ensure that only a single model change action occurs.
      // This is relevant mostly for event handlers, which will be given a single changeset
      // with all of the changes.

      // Transactions can throw, when proposed changes are canceled by an event handler.
      try {
        vizModel.type.context.enterChange().using(syncWithinTxn, this);
      } finally {
        // Restore auto update.
        if(isAutoUpdate) vizView.isAutoUpdate = true;
      }

      function syncWithinTxn(scope) {

        // 1. Specially handled Viz properties.
        vizModel.width = this.width;
        vizModel.height = this.height;
        if(dataSpec !== undefined) {
          vizModel.data = new Table(dataSpec);
        }

        // 2. Bound using `vizOptions`.
        _.each(this.vizOptions, function(v) {
          var propName = v[0];

          // Prevent binding these special properties using `vizOptions`.
          switch(propName) {
            case "width":
            case "height":
            case "data":
              return;
          }

          var paramName = v[1];
          var value = this.getParameterValue(paramName);

          vizModel.set(propName, value);
        }, this.dashboard);

        // 3. Protected method.
        this._onVizModelSync(vizModel);

        // Accept changes.
        scope.accept();
      }
    },

    /**
     * Creates a visualization view given a visualization model specification.
     *
     * @param {object} dataSpec - The data specification.
     *
     * @return {!Promise.<pentaho.type.visual.base.View>} A promise for the created visualization view.
     *
     * @private
     */
    __createVizViewAsync: function(dataSpec) {

      var me = this;

      return PentahoTypeContext.getInstance()
          .getAsync(this.vizId)
          .then(function(VizModel) {

            var vizModel = new VizModel();

            me.__syncVizModel(vizModel, dataSpec);

            // ---

            var domElem = me.placeholder()[0];

            return BaseView.createAsync(domElem, vizModel);
          })
          .then(function(vizView) {
            // Disable, by default.
            vizView.isAutoUpdate = false;

            me.vizView = vizView;

            me._onVizViewCreated(vizView);

            return vizView;
          });
    },

    /**
     * Synchronizes the visualization's model and, asynchronously, returns the visualization view.
     *
     * This is a helper method that essentially calls the `__syncVizModel` method and
     * returns a promise for the existing visualization view.
     * Also, any errors that are thrown result in a rejected promise.
     *
     * @param {object} dataSpec - The data specification.
     *
     * @return {!Promise.<pentaho.type.visual.base.View>} A promise for the existing visualization view.
     *
     * @private
     */
    __syncVizModelAsync: function(dataSpec) {

      var me = this;

      return new Promise(function(resolve) {

        me.__syncVizModel(me.vizView.model, dataSpec);

        resolve(me.vizView);
      });
    }
    // endregion
  });
});
