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
   * A module representing an extension to the Dashboard module for views.
   * Map containing the list of parameters of a dashboard,
   * describing its state with viewFlags.
   *
   * @module Dashboard.views
   */
  Dashboard.implement({

    /**
     * Property used to define if a parameter is defined by a view.
     *
     * @property viewFlags
     * @for Dashboard
     */
    viewFlags: {
      UNUSED: "unused",
      UNBOUND: "unbound",
      VIEW: "view"
    },

    /**
     * Method used by the Dashboard constructor for view initialization.
     *
     * @method _initViews
     * @for Dashboard
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
     *
     * @method restoreView
     * @for Dashboard
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
     * @method setParameterViewMode
     * @for Dashboard
     * @param parameter defines the name of the parameter
     * @param value defines the value of the parameter. Its default value is viewFlags.VIEW
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
     * @method isViewParameter
     * @for Dashboard
     * @param parameter defines the name of the parameter
     * @return the parameter viewFlags
     */
    isViewParameter: function(parameter) {
      return this.viewParameters[parameter];
    },

    /**
     * Obtains an object with the values for all dashboard parameters flagged as being View parameters.
     *
     * @method getViewParameters
     * @for Dashboard
     * @return object with parameter values
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
     * Obtains a list of viewFlags.UNBOUND parameters.
     *
     * @method getUnboundParameters
     * @for Dashboard
     * @return {Array} of parameters
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
