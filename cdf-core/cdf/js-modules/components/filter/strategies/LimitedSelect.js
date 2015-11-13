/**
 * @module BaseFilter
 * @submodule SelectionStrategies
 */
define([
  'amd!cdf/lib/underscore',
  '../models/SelectionTree',
  './MultiSelect'
], function (_, SelectionTree, MultiSelect) {


  var SelectionStates = SelectionTree.SelectionStates;
  /**
   * Limited (Multiple) Selection
   *  - any number of items can be selected, up to a limit
   #
   * @class LimitedSelect
   * @extends AbstractSelect
   * @constructor
   * @param {Object} options
   */
  var LimitedSelect = MultiSelect.extend({
    ID: 'BaseFilter.SelectionStrategies.LimitedSelect',
    constructor: function (options) {
      return this.selectionLimit = options.limit || Infinity;
    },
    setSelection: function (newState, model) {
      var numberOfUnselectedItems, selectedItems;
      var allow = true;
      var oldState = model.getSelection();
      newState = this.getNewState(oldState);
      if (newState !== SelectionStates.NONE) {
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
            if (newState === SelectionStates.ALL) {
              numberOfUnselectedItems = model.flatten().filter(function (m) {
                return m.children() == null;
              }).filter(function (m) {
                return m.getSelection() === SelectionStates.NONE;
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

  return LimitedSelect;
});
