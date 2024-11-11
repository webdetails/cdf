/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  './UnmanagedComponent',
  'amd!../lib/underscore',
  '../dashboard/Utils'
], function(UnmanagedComponent, _, Utils) {

  /**
   * @class cdf.components.InputBaseComponent
   * @amd cdf/components/filter/views/Group
   * @classdesc Base class for input components.
   * @extends cdf.components.UnmanagedComponent
   * @ignore
   */
  return UnmanagedComponent.extend(/** @lends cdf.components.InputBaseComponent# */{
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
     * If the parameter value is a function, the result of evaluating it is returned instead.
     * Normalizes return values by using {@link Utils.normalizeValue}.
     *
     * @return {*} The parameter value.
     */
    _getParameterValue: function() {
      return Utils.normalizeValue(
        Utils.ev(this.dashboard.getParameterValue(this.parameter)));
    }
  });

});
