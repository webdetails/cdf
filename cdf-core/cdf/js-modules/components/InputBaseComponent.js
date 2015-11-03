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
  './UnmanagedComponent',
  'amd!../lib/underscore',
  '../dashboard/Utils'
], function(UnmanagedComponent, _, Utils) {

  var InputBaseComponent = UnmanagedComponent.extend({
    update: function() {
      var qd = this.queryDefinition;
      if(this.valuesArray && this.valuesArray.length > 0) {
        var handler = _.bind(function() {
          this.draw(this.valuesArray);
        }, this);
        this.synchronous(handler);
      } else if(qd) {
        var handler = _.bind(function(data) {
          var filtered;
          if(this.valueAsId) {
            filtered = data.resultset.map(function(e) {
              return [e[0], e[0]];
            });
          } else {
            filtered = data.resultset;
          }
          this.draw(filtered);
        }, this);
        this.triggerQuery(qd, handler);
      } else {
        /* Legacy XAction-based components are a wasps' nest, so
         * we'll steer clear from updating those for the time being
         */
        var handler = _.bind(function() {
          var data = this.getValuesArray();
          this.draw(data);
        }, this);
        this.synchronous(handler);
      }
    },

    // TODO: is the result of this.dashboard.getParameterValue subject or not to HTML encoding?
    // Some controls in this file do html encode the result while others don't.
  
    /**
     * Obtains the value of this component's parameter.
     * <p>
     * If the parameter value is a function, the result of evaluating it is returned instead.
     * </p>
     * <p>
     * Normalizes return values by using {@link Utils.normalizeValue}.
     * </p>
     *
     * @method _getParameterValue
     * @return {*} the parameter value.
     */
    _getParameterValue: function() {
      return Utils.normalizeValue(
        Utils.ev(this.dashboard.getParameterValue(this.parameter)));
    }
  });

  return InputBaseComponent;
});
