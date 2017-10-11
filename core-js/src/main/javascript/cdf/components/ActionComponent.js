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
  '../dashboard/Utils'
], function(_, UnmanagedComponent, Utils) {

  /**
   * @class cdf.components.ActionComponent
   * @amd cdf/components/ActionComponent
   * @classdesc Action component class.
   * @extends cdf.components.UnmanagedComponent
   * @ignore
   */
  return UnmanagedComponent.extend(/** @lends cdf.components.ActionComponent# */{
    _docstring: function() {
      return "Abstract class for components calling a query/endpoint";
    },

    /**
     * Entry-point of the component, manages the actions. Follows a synchronous cycle by default.
     */
    update: function() {
      var render = _.bind(this.render, this);
      if(_.isUndefined(this.manageCallee) || this.manageCallee) {
        this.synchronous(render);
      } else {
        render();
      }
    },

    /**
     * Calls the endpoint, passing any parameters.
     * This method is typically bound to the _click_ event of the component.
     *
     * @return {*} The result of executing {@link cdf.dashboard.Dashboard#getQuery|getQuery}.
     */
    triggerAction: function() {
      var params = Utils.propertiesArrayToObject(this.actionParameters);
      var failureCallback =  (this.failureCallback) ?  this.failureCallback : function() {};
      var successCallback = this.successCallback ?  this.successCallback : function() {};
      var success = _.bind(function() {
        this.unblock();
        successCallback.apply(this, arguments);
      }, this);
      var failure = _.bind(function() {
        this.unblock();
        failureCallback.apply(this, arguments);
      }, this);
      this.block();
      return this.dashboard.getQuery(this.actionDefinition).fetchData(params, success, failure);
    },

    /**
     * Detects if the action definition contains a valid query type.
     *
     * @return {boolean} _true_ if the query type is valid, _false_ otherwise.
     */
    hasAction: function() {
      if(!this.actionDefinition) {
        return false;
      }
      if(this.dashboard.detectQueryType) {
        return !!this.dashboard.detectQueryType(this.actionDefinition);
      } else {
        return !!this.actionDefinition.queryType && this.dashboard.hasQuery(this.actionDefinition.queryType);
      }
    }
  });

});
