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
  '../../lib/jquery',
  'amd!../../lib/underscore',
  'amd!../../lib/backbone',
  '../UnmanagedComponent',
  '../../Logger',
  './BaseFilter',
  './IFilter',
  './IConfiguration',
  './addIns',
  'css!./styles/filter'
], function($, _, Backbone, UnmanagedComponent, Logger, BaseFilter, IFilter, IConfiguration) {

  /*
   * Über-filter: one filter to rule them all
   */

  /**
   * @class cdf.components.filter.FilterComponent
   * @extends cdf.components.UnmanagedComponent
   * @amd cdf/components/FilterComponent
   * @classdesc An intuitive Filter Component with many out-of-the-box features:
   *   <ul>
   *     <li>pluggable selection logic: single-, multi-, and limited-select</li>
   *     <li>automatic handling of groups of options</li>
   *     <li>searchable</li>
   *     <li>extensible via addIns</li>
   *   </ul>
   * @ignore
   */


  return UnmanagedComponent.extend(IFilter).extend(IConfiguration).extend(/** @lends cdf.components.filter.FilterComponent# */{
    /**
     * Object responsible for storing the MVC model, which contains both the data and the state of the component.
     *
     * @type {SelectionTree}
     */
    model: void 0,

    /**
     * Object responsible for managing the MVC hierarchy of views and controllers associated with the model.
     *
     * @type {Manager}
     */
    manager: void 0,

    /**
     * Object that handles writing to the MVC model.
     *
     * @type {Input}
     */
    inputDataHandler: void 0,

    /**
     * Object that handles reading from the MVC model.
     *
     * @type {Output}
     */
    outputDataHandler: void 0,

    update: function() {
      this.getData().then(
        _.bind(function(data) {
          this.initialize();
          return this.onDataReady(data);
        }, this),
        _.bind(this.onDataFail, this)
      );
    },


    /**
     * Initialize the component by creating new instances of the main objects:
     * <ul>
     *   <li>model</li>
     *   <li>MVC manager</li>
     *   <li>input data handler</li>
     *   <li>output data handler</li>
     * </ul>
     *
     * @return {Promise} Returns a $.Deferred().promise() object.
     */
    initialize: function() {
      this.close();

      /*
       * Transform user-defined CDF settings to our own configuration object
       */
      var configuration = this.getConfiguration();

      /*
       * Initialize our little MVC world
       */
      this.model = new BaseFilter.Models.SelectionTree(configuration.input.defaultModel);
      this.model.set('matcher', configuration.component.search.matcher);

      this.manager = new BaseFilter.Controllers.Manager({
        model: this.model,
        configuration: configuration.component
      });

      /*
       * Initialize the CDF interface
       */
      this.inputDataHandler = new BaseFilter.DataHandlers.Input({
        model: this.model,
        options: configuration.input
      });
      this.outputDataHandler = new BaseFilter.DataHandlers.Output({
        model: this.model,
        options: configuration.output
      });
      this.listenTo(this.outputDataHandler, 'changed', this.processChange);

      return configuration;
    },

    close: function() {
      if (this.manager != null) {
        this.manager.empty();
      }
      if (this.model != null) {
        this.model.stopListening().off();
      }
      return this.stopListening();
    },

    /**
     * Abstract the origin of the data used to populate the component.
     * Precedence order for importing data: query -> parameter -> valuesArray
     *
     * @return {Promise} Returns promise that is fulfilled when the data is available.
     */
    getData: function() {
      var deferred = new $.Deferred();
      if (!_.isEmpty(this.dashboard.detectQueryType(this.queryDefinition))) {

        var queryOptions = {
          ajax: {
            error: function() {
              deferred.reject({});
              return Logger.log("Query failed", 'debug');
            }
          }
        };
        var onQueryData = _.bind(function(data) {
          deferred.resolve(data);
        }, this);
        this.triggerQuery(this.queryDefinition, _.bind(onQueryData, this), queryOptions);

      } else {

        if (!_.isEmpty(this.componentInput.inputParameter)) {

          var onParamData = function() {
            var data = this.dashboard.getParameterValue(this.componentInput.inputParameter);
            deferred.resolve(data);
          };
          this.synchronous(_.bind(onParamData, this), null);

        } else {

          var onStaticData = function() {
            var data = this.componentInput.valuesArray;
            deferred.resolve(data);
          };
          this.synchronous(_.bind(onStaticData, this), null);
        }
      }
      return deferred.promise();
    },

    /*
     * Launch an event equivalent to postExecution
     */

    onDataReady: function(data) {
      this.inputDataHandler.updateModel(data);
      if (this.parameter) {
        var currentSelection = this.dashboard.getParameterValue(this.parameter);
        this.setValue(currentSelection);
      }

      this.trigger('getData:success');
      return this;
    },

    onDataFail: function(reason) {
      Logger.log('Component failed to retrieve data: ' + reason, 'debug');
      this.trigger('getData:failed');
      return this;
    }
  }, {
    help: function() {
      return "Filter component";
    }
  });

});
