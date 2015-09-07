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
  'amd!../lib/underscore',
  './UnmanagedComponent',
  '../dashboard/Utils'
], function(_, UnmanagedComponent, Utils) {

  var ActionComponent = UnmanagedComponent.extend({
    _docstring: function() {
      return "Abstract class for components calling a query/endpoint";
    },

    /**
     * Entry-point of the component, manages the actions. Follows a synchronous cycle by default.
     *
     * @method update
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
     * This method is typically bound to the "click" event of the component.
     *
     * @method triggerAction
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
     * Detect if the endpoint associated with the Action is defined.
     *
     * @method hasAction
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

  return ActionComponent;

});
