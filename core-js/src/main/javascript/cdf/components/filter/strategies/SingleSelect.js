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
