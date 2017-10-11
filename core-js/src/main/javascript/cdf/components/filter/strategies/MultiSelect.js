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
  'amd!../../../lib/underscore',
  './AbstractSelect'
], function (_, AbstractSelect) {

  /**
   * @class cdf.components.filter.strategies.MultiSelect
   * @amd cdf/components/filter/strategies/MultiSelect
   * @extends cdf.components.filter.strategies.AbstractSelect
   * @classdesc Multiple selection. Any number of items can be selected.
   * @ignore
   */
  return AbstractSelect.extend(/** @lends cdf.components.filter.strategies.MultiSelect# */{
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.SelectionStrategies.MultiSelect',

    /**
     * Sets a new selection state.
     *
     * @param {string} newState The new selection state.
     * @param {object} model    The target model.
     * @return {string} The new selection state.
     */
    setSelection: function (newState, model) {
      model.setAndUpdateSelection(newState);
      return newState;
    }
  });

});
