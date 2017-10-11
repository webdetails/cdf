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
  '../models/SelectionTree',
  './MultiSelect'
], function (_, SelectionTree, MultiSelect) {

  return MultiSelect.extend(/** @lends cdf.components.filter.strategies.LimitedSelect# */{
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.SelectionStrategies.LimitedSelect',
    /**
     * @constructs
     * @amd cdf/components/filter/strategies/LimitedSelect
     * @extends cdf.components.filter.strategies.MultiSelect
     * @classdesc Limited (Multiple) Selection allows selecting a limited number of items.
     * @param {object} options Selection options.
     * @param {object} options.limit=Infinity The selection limit option.
     * @ignore
     */
    constructor: function (options) {
      return this.selectionLimit = options.limit || Infinity;
    },
    /**
     * Sets the new selection state to the provided model.
     *
     * @param {string} newState The new state to set.
     * @param {object} model The target model.
     * @return {string} The new selection state.
     */
    setSelection: function (newState, model) {
      var numberOfUnselectedItems, selectedItems;
      var allow = true;
      var oldState = model.getSelection();
      newState = this.getNewState(oldState);
      if (newState !== SelectionTree.SelectionStates.NONE) {
        selectedItems = model.root().get('numberOfSelectedItems');
        if (!_.isFinite(selectedItems)) {
          model.update();
          selectedItems = model.root().get('numberOfSelectedItems');
        }
        if (selectedItems >= this.selectionLimit) {
          this.warn("Cannot allow the selection of  \"" + (model.get('label')) + "\". Selection limit of " + this.selectionLimit + " has been reached.");
          allow = false;
        } else {
          if (model.children()) {
            if (newState === SelectionTree.SelectionStates.ALL) {
              numberOfUnselectedItems = model.flatten().filter(function (m) {
                return m.children() == null;
              }).filter(function (m) {
                return m.getSelection() === SelectionTree.SelectionStates.NONE;
              }).value().length;
              if (selectedItems + numberOfUnselectedItems >= this.selectionLimit) {
                this.warn("Cannot allow the selection of \"" + (model.get('label')) + "\". Selection limit of " + this.selectionLimit + " would be reached.");
                allow = false;
              }
            }
          }
        }
      }
      if (allow) {
        this.debug("setSelection");
        model.setAndUpdateSelection(newState);
        selectedItems = model.root().get('numberOfSelectedItems');
        model.root().set("reachedSelectionLimit", selectedItems >= this.selectionLimit);
      } else {
        newState = oldState;
      }
      return newState;
    }
  });

});
