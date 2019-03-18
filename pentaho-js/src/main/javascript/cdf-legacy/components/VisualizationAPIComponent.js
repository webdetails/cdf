/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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

/* globals Promise */

var VisualizationAPIComponent = (function() {

  // ATTENTION: A part of this code is synchronized with:
  // cdf/pentaho-js/src/main/javascript/cdf/components/VisualizationAPIComponent.js

  var Table = null;
  var visualUtil = null;

  return UnmanagedComponent.extend({

    // Unit tests support.
    __reset: function () {
      Table = null;
      visualUtil = null;
    },

    update: function () {
      if(visualUtil === null)
        this.__requireFilesAndUpdate();
      else
        this.__updateCore();
    },

    __requireFilesAndUpdate: function () {
      // Not caring about preExec(), as it is already done by triggerQuery, below...
      var me = this;

      require([
        "pentaho/data/Table",
        "pentaho/visual/util",
        "pentaho/shim/es6-promise"
      ], function(_Table, _visualUtil) {

        Table = _Table;
        visualUtil = _visualUtil;

        me.__updateCore();
      });
    },

    __updateCore: function() {

      // Start fetching immediately, if possible.
      this.__checkVizType();

      this.triggerQuery(this.queryDefinition, _.bind(this.__render, this));
    },

    /**
     * Called to _continue_ updating the component given the fetched data.
     *
     * This method ends the component execution when the update has finished.
     *
     * @param {object} dataSpec - The data specification.
     * @private
     */
    __render: function(dataSpec) {

      // Make sure to reset the viz, if its type changed.
      this.__checkVizType();

      var promise = !this.viz
          ? this.__createVizAsync(dataSpec)
          : this.__syncVizAsync(dataSpec);

      var me = this;

      promise
          .then(_.bind(this.__updateViz, this))
          ["catch"](function(reason) {
            var domElem = me.placeholder()[0];
            Dashboards.error("Unable to update the visualization component: " + reason);
            Dashboards.errorNotification({msg: "Error processing component: render_" + me.name}, domElem);
          });
    },

    // region copy & paste code from CDF require component version

    /**
     * Gets or sets the type of visualization.
     *
     * @name vizId
     * @type {string}
     */

    /**
     * Gets the visualization.
     *
     * @type {?pentaho.visual.Model}
     * @readOnly
     */
    viz: null,

    /**
     * The visualization's view.
     *
     * @type {?pentaho.visual.IView}
     * @private
     */
    __vizView: null,

    /**
     * A promise for the visualization classes.
     *
     * @type {Promise.<({
     *     Model: Class.<pentaho.visual.Model>,
     *     View:  Class.<pentaho.visual.IView>,
     *     viewTypeId: string
     *  })>}
     * @private
     */
    __vizClassesPromise: null,

    /**
     * The visualization type identifier corresponding to `__vizClassesPromise`, `viz`, etc..
     *
     * @type {string}
     * @private
     */
    __vizClassesId: null,

    /**
     * The style classes applied to the visualization's HTML container.
     *
     * @type {?string}
     * @private
     */
    __vizStyleClass: null,

    // region protected members
    /**
     * Called to complete building of the visualization specification from the component's state.
     *
     * When this method is called, the given specification has already been updated
     * according to the base class' rules. Override to perform additional updates.
     *
     * On the first component update, this method is called before the visualization
     * has been created (and before `_onDidCreateViz`).
     * This special situation can be tested for by checking that `this.viz` is `null`.
     *
     * The default implementation does nothing.
     *
     * @param {pentaho.visual.spec.IModel} vizSpec - The visualization specification.
     *
     * @protected
     */
    _onGetVizSpec: function(vizSpec) {
      // NOOP
    },

    /**
     * Called when the visualization has been created, but before its initial update.
     *
     * This method can be used to, for example, attach event listeners to the visualization.
     *
     * The default implementation does nothing.
     *
     * @protected
     */
    _onDidCreateViz: function() {
      // NOOP
    },

    /**
     * Called before disposing of the visualization.
     *
     * This method can be used to, for example, detach event listeners from the visualization.
     *
     * The default implementation does nothing.
     *
     * @protected
     */
    _onWillDisposeViz: function() {
      // NOOP
    },
    // endregion

    //region private members
    /**
     * Updates the visualization.
     *
     * @return {Promise} A promise for the completion of the update operation.
     * @private
     */
    __updateViz: function() {
      return this.viz.update();
    },

    /**
     * Disposes of the visualization.
     *
     * @private
     */
    __disposeViz: function() {
      if(this.viz) {

        this._onWillDisposeViz();

        if(this.__vizView) {
          this.__vizView.dispose();
          this.__vizView = null;
        }

        this.viz = null;
      }
    },

    /**
     * Starts fetching the visualization classes, if the visualization id is defined.
     * Checks if the visualization id changed, in which case it disposes of the current visualization, if any.
     *
     * @private
     */
    __checkVizType: function() {
      this.__getVizClassesAsync()
        ["catch"](function() { /* Swallow for now. Will look at the error later. */ });
    },

    /**
     * Obtains a promise for the visualization's classes.
     *
     * @return {Promise.<({
     *     Model: Class.<pentaho.visual.Model>,
     *     View:  Class.<pentaho.visual.IView>,
     *     viewTypeId: string
     *  })>} A promise.
     * @private
     */
    __getVizClassesAsync: function() {
      var vizId = this.vizId;
      if(!vizId) {
        return Promise.reject(new Error("Visualization ID is not specified."));
      }

      var vizClassesId = this.__vizClassesId;
      if(!vizClassesId || vizClassesId !== vizId) {

        this.__disposeViz();

        this.__vizClassesId = vizId;
        this.__vizClassesPromise = visualUtil.getModelAndDefaultViewClassesAsync(vizId);
      }

      return this.__vizClassesPromise;
    },

    /**
     * Gets the current visualization specification according to the component's state.
     *
     * The `width` and `height` properties are read from the corresponding component properties.
     *
     * The `data` property is set from the given `dataSpec` argument, when specified and defined.
     *
     * Arbitrary visualization properties are set from the contents of
     * the `vizOptions` component property and the current values of referenced dashboard parameters.
     *
     * Lastly, the `_onGetVizSpec` method is called so that subclasses may further update the specification.
     *
     * @param {object} [dataSpec] - The data specification.
     * @return {pentaho.visual.spec.IModel} The visualization specification.
     * @private
     */
    __getVizSpec: function(dataSpec) {

      // 1. Specially handled properties

      var vizSpec = {
        width: this.width,
        height: this.height
      };

      if(dataSpec !== undefined) {
        vizSpec.data = new Table(dataSpec);
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

        vizSpec[propName] = value;
      }, this.dashboard);

      // 3. Protected method.
      this._onGetVizSpec(vizSpec);

      vizSpec.isAutoUpdate = false;

      return vizSpec;
    },

    /**
     * Creates a visualization of the current type and a given a data specification.
     *
     * @param {object} dataSpec - The data specification.
     * @return {Promise} A promise for the completion of the visualization creation.
     * @private
     */
    __createVizAsync: function(dataSpec) {
      return this.__getVizClassesAsync().then(_.bind(this.__onGotVizClasses, this, dataSpec));
    },

    /**
     * Called to continue creation of the visualization.
     *
     * @param {object} dataSpec - The data specification.
     * @param {({
     *     Model: Class.<pentaho.visual.Model>,
     *     View:  Class.<pentaho.visual.IView>,
     *     viewTypeId: string
     *  })} classes - The visualization classes.
     * @private
     */
    __onGotVizClasses: function(dataSpec, classes) {
      // J.I.C. Someone else got here first.
      this.__disposeViz();

      var vizSpec = this.__getVizSpec(dataSpec);

      var viz = new classes.Model(vizSpec);

      var domContainer = this.__setupDomContainer(classes.Model.type.id, classes.viewTypeId);

      this.__vizView = new classes.View({model: viz, domContainer: domContainer});

      this.viz = viz;

      this._onDidCreateViz();
    },

    /**
     * Sets up the HTML container for a visualization, given the model and view class identifiers.
     *
     * @param {string} vizTypeId - The visualization identifier.
     * @param {string} viewTypeId - The view identifier.
     * @return {HTMLElement} The HTML container.
     * @private
     */
    __setupDomContainer: function(vizTypeId, viewTypeId) {
      // Empty, in case viz type changed.
      var $domContainer = this.placeholder().empty();

      // Remove previous viz's CSS classes.
      if(this.__vizStyleClass != null) {
        $domContainer.removeClass(this.__vizStyleClass);
      }

      var styleClasses = this.__vizStyleClass = visualUtil.getCssClasses(vizTypeId, viewTypeId);

      $domContainer.addClass(styleClasses);

      return $domContainer[0];
    },

    /**
     * Synchronizes the current visualization from the component's state.
     *
     * This method obtains the new visualization specification by calling `__getVizSpec`
     * and then applies it to the current visualization.
     *
     * The visualization update operation is not performed.
     *
     * @param {object} [dataSpec] - The data specification.
     * @private
     */
    __syncViz: function(dataSpec) {

      var vizSpec = this.__getVizSpec(dataSpec);

      // The transaction throws if proposed changes are canceled by an event handler.
      this.viz.configure(vizSpec);
    },

    /**
     * Synchronizes the current visualization from the component's state, asynchronously.
     *
     * @param {object} dataSpec - The data specification.
     * @return {Promise} A promise for the completion of the operation.
     * @private
     *
     * @see #__syncViz
     */
    __syncVizAsync: function(dataSpec) {

      return new Promise(_.bind(function(resolve) {

        this.__syncViz(dataSpec);

        resolve();
      }, this));
    }
    // endregion

    // endregion
  });
}());
