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
