/**
 * @module BaseFilter
 * @submodule SelectionStrategies
 */
define([
  'amd!cdf/lib/underscore',
  './AbstractSelect',
  '../models/SelectionTree'
], function (_, AbstractSelect, SelectionTree) {
  var SelectionStates = SelectionTree.SelectionStates;
  /**
   * Single Selection
   *  - only one item can be selected at any time
   * @class SingleSelect
   * @extends AbstractSelect
   * @constructor
   */
  var SingleSelect = AbstractSelect.extend({
    ID: 'BaseFilter.SelectionStrategies.SingleSelect',
    setSelection: function (newState, model) {
      if (model.children()) {
        return;
      }
      if (this.isLogicGlobal === true) {
        model.root().setSelection(SelectionStates.NONE);
      } else if (model.getSelection() !== SelectionStates.ALL) {
        if (model.parent()) {
          model.parent().setSelection(SelectionStates.NONE);
        }
      }
      model.setAndUpdateSelection(SelectionStates.ALL);
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
  return SingleSelect;
});
