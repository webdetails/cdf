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
  './Dashboard',
  '../lib/base64',
  './Dashboard.views.ext',
  '../lib/jquery'
], function(Dashboard, Base64, DashboardViewsExt, $) {

  /**
   * @class cdf.dashboard."Dashboard.views"
   * @amd cdf/dashboard/Dashboard.views
   * @summary A class representing an extension to the
   *            {@link cdf.dashboard.Dashboard|Dashboard} class for managing views.
   * @classdesc A class representing an extension to the
   *            {@link cdf.dashboard.Dashboard|Dashboard} class for managing views.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @summary Map containing the list of parameters of a dashboard and their
     *          {@link cdf.dashboard.Dashboard#viewFlags|view flag}.
     * @description Map containing the list of parameters of a dashboard.
     *              The keys are the parameter names and the values are the
     *              {@link cdf.dashboard.Dashboard#viewFlags|view flag} value.
     *
     * @protected 
     * @type {Object}
     */
    viewParameters: undefined,

    /**
     * @summary A view is a snapshot of the dashboard parameter's state, useful
     *          to restore a dashboard to a previous state.
     * @description <p>Holds a snapshot of the dashboard parameter's state,
     *              which is useful to restore a dashboard to a previous state.</p>
     *              <p>It can be initialized in two different ways. The main way is via
     *              the dashboard constructor. If not, it will be initialized via the
     *              {@link cdf.dashboard.Dashboard|Dashboard} AMD module configuration.</p>
     * 
     * @type {Object}
     * @protected
     */
    view: undefined,

    /**
     * @description Object used to store the available view flag values (read only).
     * @summary Object used to store the available view flag values (read only).
     *
     * @type {Object}
     * @const
     * @property {string} UNUSED="unused"   Flag value for unused parameters.
     * @property {string} UNBOUND="unbound" Flag value for unbound parameters.
     * @property {string} VIEW="view"       Flag value for view parameters.
     */
    viewFlags: {
      UNUSED: "unused",
      UNBOUND: "unbound",
      VIEW: "view"
    },

    /**
     * @description <p>Method used by the {@link cdf.dashboard.Dashboard|Dashboard} constructor
     *              for initializing the {@link cdf.dashboard.Dashboard#view|view}.</p>
     *              <p>If the view hasn't been initialized, its value will be read from
     *              {@link cdf.dashboard.Dashboard#viewObj|viewObj}.</p>
     * @summary Method used by the {@link cdf.dashboard.Dashboard|Dashboard} constructor
     *          to initialize the {@link cdf.dashboard.Dashboard#view|view}.
     *
     * @private
     * @see {@link cdf.dashboard.Dashboard#viewObj|viewObj}
     */
    _initViews: function() {
      this.viewParameters = {};
      if(!this.view && this.viewObj) {
        this.view = {};
        $.extend(this.view, this.viewObj);
      }
    },

    /**
     * @summary Restores the dashboard parameters stored in a {@link cdf.dashboard.Dashboard#view|view}.
     * @description Restores the dashboard parameters stored in a {@link cdf.dashboard.Dashboard#view|view}.
     *              Because we are storing the parameters in {@link http://orientdb.com/|OrientDB}, and
     *              it has some serious issues when storing nested objects, we need to marshal the
     *              parameters into a JSON object and convert that JSON into a
     *              {@link http://www.webtoolkit.info/javascript_base64.html|Base64} blob before the
     *              storage operation. So, to restore the view parameters we need to revert this process.
     * @see {@link http://orientdb.com/|OrientDB}
     * @see {@link http://www.webtoolkit.info/javascript_base64.html|Base64}
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
     * @summary Sets the view flag for a given parameter.
     * @description Sets the view flag for a given parameter. If none is provided
     *              it defaults to {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.VIEW}.
     *
     * @param {string} parameter    The name of the parameter.
     * @param {string} value="view" The value of the view flag for the parameter. If none is provided, 
     *                              it defaults to {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.VIEW}.
     */
    setParameterViewMode: function(parameter, value) {
      if(arguments.length === 1) {
        this.viewParameters[parameter] = this.viewFlags.VIEW;
      } else {
        this.viewParameters[parameter] = value;
      }
    },

    /**
     * @summary Returns the view flag value of a given parameter.
     * @description Returns the view flag value of a given parameter.
     *
     * @param {string} parameter The name of the parameter.
     * @return {string} The parameter view flag value.
     */
    isViewParameter: function(parameter) {
      return this.viewParameters[parameter];
    },

    /**
     * @summary Gets a map with the dashboard parameters with the view flag set to
     *          {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.VIEW}
     *          or {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.UNBOUND}.
     * @description Gets a map with the pairs parameter name - parameter value,
     *              with all dashboard parameters with the view flag set to
     *              {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.VIEW}
     *              or {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.UNBOUND}.
     *
     * @return {Object} Map containing the viewable and unbound parameters.
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
     * @summary Gets a list of the names of the dashboard parameters with the view flag set to
     *          {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.UNBOUND}.
     * @description Gets a list of the names of the dashboard parameters with the view flag set to
     *              {@link cdf.dashboard.Dashboard#viewFlags|viewFlags.UNBOUND}.
     *
     * @return {string[]} List containing the names of the unbound parameters.
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
