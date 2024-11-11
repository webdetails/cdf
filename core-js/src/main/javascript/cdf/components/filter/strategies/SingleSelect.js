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
  'amd!../../../lib/underscore',
  './AbstractSelect',
  '../models/SelectionTree'
], function (_, AbstractSelect, SelectionTree) {

  /**
   * @class cdf.components.filter.strategies.SingleSelect
   * @amd cdf/components/filter/strategies/SingleSelect
   * @extends cdf.components.filter.strategies.AbstractSelect
   * @classdesc Single Selection. Only one item can be selected at any time.
   * @ignore
   */
  return AbstractSelect.extend(/** @lends cdf.components.filter.strategies.SingleSelect# */{
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.SelectionStrategies.SingleSelect',
    /**
     * Sets a new selection state.
     *
     * @param {string} newState The new selection state.
     * @param {object} model    The target model.
     * @return {string} The new selection state.
     */
    setSelection: function (newState, model) {
      if (model.children()) {
        return;
      }
      if (this.isLogicGlobal === true) {
        model.root().setSelection(SelectionTree.SelectionStates.NONE);
      } else if (model.getSelection() !== SelectionTree.SelectionStates.ALL) {
        if (model.parent()) {
          model.parent().setSelection(SelectionTree.SelectionStates.NONE);
        }
      }
      model.setAndUpdateSelection(SelectionTree.SelectionStates.ALL);
      return newState;
    },
    /**
     * Changes the selection state.
     *
     * @param {object} model The target model.
     * @return {*} The value returned by {@link cdf.components.filter.strategies.AbstractSelect#applySelection|applySelection}.
     */
    changeSelection: function (model) {
      this.base(model);
      return this.applySelection(model);
    },
    /**
     * Gets the selected models.
     *
     * @param {object} model The target model.
     * @param {string} field The selection state field.
     * @return {object[]} The list of selected items.
     */
    getSelectedItems: function (model, field) {

      /* a single select item with 1 item: when this one becomes selected, then the selection
       * strategy is ALL for both the child and the parent ( a.k.a root node); but in this case, we should
       * present the child as the selected one, and not the root node
       */
      if (model && model.isRoot() && model.children() && model.countSelectedItems() == 1 && model.children().length == 1) {

        return _.flatten(model.children().map(function (child) {
          return child.getSelectedItems(field) || [];
        }));

      } else {

        // default behaviour
        return model.getSelectedItems(field);
      }

    }
  });

});
