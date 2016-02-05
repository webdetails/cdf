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
  '../dashboard/Dashboard.ext',
  './BaseQuery',
  '../dashboard/Dashboard.query',
  'amd!../lib/underscore',
  '../dashboard/Utils',
  '../Logger',
  '../lib/jquery'
], function(DashboardExt, BaseQuery, Dashboard, _, Utils, Logger, $) {

  /**
   * @class cdf.queries.CpkQuery
   * @amd cdf/queries/CpkQuery
   * @classdesc Class that represents a CPK query.
   */
  var CpkEndpointsOpts = /** @lends cdf.queries.CpkQuery# */{
    name: "cpk",
    label: "CPK Query",
    defaults: {
      url: '',
      pluginId: '',
      endpoint: '',
      systemParams: {},
      ajaxOptions: {
        dataType: 'json',
        type: 'POST',
        async: true,
        xhrFields: {
          withCredentials: true
        }
      }
    },

    /**
     * Initializes a CPK query.
     *
     * @param {object} opts              An object containing query definitions.
     * @param {string} opts.pluginId     The plugin identifier.
     * @param {string} opts.endpoint     The target endpoint.
     * @param {string} opts.kettleOutput Output type.
     * @param {string} opts.stepName     The target step name.
     * @param {object} opts.systemParams System parameters.
     * @param {object} opts.ajaxOptions  {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options.
     */
    init: function(opts) {
      if(_.isString(opts.pluginId) && _.isString(opts.endpoint)) {
        this.setOption('pluginId', opts.pluginId);
        this.setOption('endpoint', opts.endpoint);
        this.setOption('url', DashboardExt.getPluginEndpoint(opts.pluginId, opts.endpoint));
      }
      this.setOption('kettleOutput', opts.kettleOutput);
      this.setOption('stepName', opts.stepName);
      this.setOption('systemParams', opts.systemParams || {} );
      this.setOption('ajaxOptions' , $.extend({}, this.getOption('ajaxOptions'), opts.ajaxOptions));
      var ajaxOptions = this.getOption('ajaxOptions');
      if(ajaxOptions.dataType == 'json') {
        ajaxOptions.mimeType = 'application/json; charset utf-8'; //solves "not well formed" error in Firefox 24
        this.setOption('ajaxOptions', ajaxOptions);
      }
    },

    /**
     * Builds the query definition object.
     *
     * @param {object} overrides Options that override the existing ones.
     * @return {*} Query definition object.
     *
     * @private
     */
    buildQueryDefinition: function(overrides) {
      var myself = this;
      overrides = (overrides instanceof Array) ? Utils.propertiesArrayToObject(overrides) : (overrides || {});

      var queryDefinition = {
        kettleOutput: this.getOption('kettleOutput'),
        stepName: this.getOption('stepName')
      };
      // We clone queryDefinition to remove undefined
      queryDefinition = $.extend(true, {}, queryDefinition, this.getOption('systemParams'));

      var cachedParams = this.getOption('params'),
          params = $.extend({}, cachedParams, overrides);

      _.each(params, function(value, name) {
        var paramValue, printValue;
        try {
          paramValue = myself.dashboard.getParameterValue(value);
        } catch(e) {
          if(!_.isObject(value) || _.isFunction(value)) {
            printValue = value;
          } else {
            printValue = JSON.stringify(value);
          }
          Logger.log("BuildQueryDefinition detected static parameter " + name + "=" + printValue + ". " +
            "The parameter will be used as value instead its value obtained from getParameterValue");
          paramValue = value;
        }
        if(paramValue === undefined) {
          paramValue = value;
        }
        if(_.isFunction(paramValue)) {
          paramValue = paramValue();
        } else if(_.isObject(paramValue)) {
          // kettle does not handle arrays natively,
          // nor does it interpret multiple parameters with the same name as elements of an array,
          // nor does CPK do any sort of array handling.
          // A stringify ensures the array is passed as a string, that can be parsed using kettle.
          paramValue = JSON.stringify(paramValue);
          // Another option would be to add further:
          // value = value.split('],').join(';').split('[').join('').split(']').join('');
          // which transforms [[0,1],[2,3]] into "0,1;2,3"
        }
        queryDefinition['param' + name] = paramValue;
      });

      return queryDefinition;
    },

    /**
     * Gets the success handler that executes the provided callback when the query executes successfully.
     *
     * @param {function} callback Callback to call after the query is successful.
     * @return {function} Success callback handler.
     */
    getSuccessHandler: function(callback) {
      // copy-pasted from BaseQuery + added errorCallback
      var myself = this;
      return function(json) {
        myself.setOption('lastResultSet', json);
        if(json && json.result == false) {
          // the ajax call might have been successful (no network errors),
          // but the endpoint might have failed, which is signalled by json.result
          var errorCallback = myself.getErrorHandler(myself.getOption('errorCallback'));
          errorCallback(clone);
        } else {
          var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
          myself.setOption('lastProcessedResultSet', clone);
          json = callback(clone);
          if(json !== undefined && json !== clone) {
            myself.setOption('lastProcessedResultSet', json);
          }
        }
      };
    }
  };

  // Registering a class will use that class directly when getting new queries.
  Dashboard.registerGlobalQuery("cpk", CpkEndpointsOpts);
});
