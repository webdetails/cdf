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
  'amd!../../lib/underscore'
], function (_) {

  /*
   * Interface Mixin for a filter
   */
  return /** @lends cdf.components.filter.FilterComponent# */ {

    /**
     * Gets the current selection state.
     *
     * @return {Array.<any>} List of identifiers of the selected items,
     *                 in the same format as they would be written to the parameter.
     */
    getValue: function () {
      return this._value;
    },

    /**
     * Updates the selection state of the filter.
     *
     * @param {Array.<any>} value List of strings containing the IDs of the selected items,
     *                      which will be written to the parameter.
     */
    setValue: function (value) {
      this._value = value;
      this.inputDataHandler.setValue(value);
    },

    /**
     * Implement's CDF logic for updating the state of the parameter, by
     * invoking the dashboard's {@link cdf.dashboard.Dashboard#processChange|processChange} function.
     *
     * @param {Array.<any>} value - List of strings containing the identifiers of the selected items,
     *                      in the same format as they would be written to the parameter.
     */
    processChange: function (value) {
      var paramValue = this.dashboard.getParameterValue(this.parameter);
      if(_.isEqual(paramValue, value)){
        return this;
      }
      this._value = value;
      this.dashboard.processChange(this.name);
    }
  };

});
