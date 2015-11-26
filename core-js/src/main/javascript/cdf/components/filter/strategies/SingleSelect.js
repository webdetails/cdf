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

/**
 * @module BaseFilter
 * @submodule SelectionStrategies
 */
define([
  'amd!../../../lib/underscore',
  './AbstractSelect',
  '../models/SelectionTree'
], function (_, AbstractSelect, SelectionTree) {

  /**
   * Single Selection
   *  - only one item can be selected at any time
   * @class SingleSelect
   * @extends AbstractSelect
   * @constructor
   */
  return AbstractSelect.extend({
    ID: 'BaseFilter.SelectionStrategies.SingleSelect',
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
    changeSelection: function (model) {
      this.base(model);
      return this.applySelection(model);
    },
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
