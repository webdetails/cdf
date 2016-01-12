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
  './Dashboard',
  '../lib/base64',
  './Dashboard.views.ext',
  '../lib/jquery'
], function(Dashboard, Base64, DashboardViewsExt, $) {

  /**
   * @class cdf.dashboard.Dashboard.views
   * @amd cdf/dashboard/Dashboard.views
   * @classdesc A class representing an extension to the Dashboard class for views.
   *            Map containing the list of parameters of a dashboard,
   *            describing its state with viewFlags.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * Object used to store the available view flag values (read only).
     *
     * @type {Object}
     * @instance
     * @property {string} UNUSED=unused   Flag value for unused parameters.
     * @property {string} UNBOUND=unbound Flag value for unbound parameters.
     * @property {string} VIEW=view       Flag value for view parameters.
     */
    viewFlags: {
      UNUSED: "unused",
      UNBOUND: "unbound",
      VIEW: "view"
    },

    /**
     * Method used by the Dashboard constructor for view initialization.
     *
     * @private
     */
    _initViews: function() {
      this.viewParameters = {};
      if(!this.view && this.viewObj) {
        this.view = {};
        $.extend(this.view, this.viewObj);
      }
    },

    /**
     * Restores the view stored in the object view, changing the parameters values to the values stored in the view.
     * Because we're storing the parameters in OrientDB, and as OrientDB has some serious issues when storing nested
     * objects, we need to marshall the parameters into a JSON object and converting that JSON into a Base64 blob
     * before the storage operation.
     */
    restoreView: function() {
      var p, params;
      if(!this.view || !this.view.params) { return; }
      /*
       * So now we have to decode that mess.
       */
      params = JSON.parse(Base64.decode(this.view.params));
      if(!params) { return; }
      if($.isEmptyObject(params)) {
        this.view.params = params;
      } else {
        for(p in params) {
          if(params.hasOwnProperty(p)) {
            this.setParameter(p, params[p]);
          }
        }
      }
    },

    /**
     * Defines the view flag of a given parameter.
     *
     * @param {string} parameter  The name of the parameter
     * @param {string} value=view The value of the view flag for the parameter.
     */
    setParameterViewMode: function(parameter, value) {
      if(arguments.length === 1) {
        value = this.viewFlags.VIEW;
      }
      this.viewParameters[parameter] = value;
    },

    /**
     * Returns the view flag for a given parameter.
     *
     * @param {string} parameter The name of the parameter.
     * @return {string} The parameter view flag value.
     */
    isViewParameter: function(parameter) {
      return this.viewParameters[parameter];
    },

    /**
     * Obtains a list with the values for all dashboard parameters
     * flagged as being {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.VIEW}
     * or {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.UNBOUND} parameters.
     *
     * @return {Object[]} List of parameter values.
     */
    getViewParameters: function() {
      var params = this.viewParameters,
          ret = {};
      for(var p in params) {
        if(params.hasOwnProperty(p)) {
          if(params[p] == this.viewFlags.VIEW || params[p] == this.viewFlags.UNBOUND) {
            ret[p] = this.getParameterValue(p);
          }
        }
      }
      return ret;
    },

    /**
     * Obtains a list of parameters with the view flag set to
     * {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.UNBOUND}.
     *
     * @return {string[]} List of the unbound parameters' names.
     */
    getUnboundParameters: function() {
      var params = this.viewParameters,
          ret = [];
      for(var p in params) if(params.hasOwnProperty(p)) {
        if(params[p] == this.viewFlags.UNBOUND) {
          ret.push(p);
        }
        return ret;
      }
    }
  });
});
