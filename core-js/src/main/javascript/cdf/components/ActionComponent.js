/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


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
