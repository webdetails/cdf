'use strict';
(function(SelectionStrategies) {
  'use strict';

  /**
   * @module TreeFilter
   * @submodule SelectionStrategies
   */

  /**
   * Single Selection
   *  - only one item can be selected at any time
   * @class SingleSelect
   * @extends AbstractSelect
   * @constructor
   */
  return SelectionStrategies.SingleSelect = SelectionStrategies.AbstractSelect.extend({
    ID: 'TreeFilter.SelectionStrategies.SingleSelect',
    setSelection: function(newState, model) {
      if (model.children()) {
        return;
      }
      if (this.isLogicGlobal === true) {
        model.root().setSelection(TreeFilter.Enum.select.NONE);
      } else if (model.getSelection() !== TreeFilter.Enum.select.ALL) {
        if (model.parent()) {
          model.parent().setSelection(TreeFilter.Enum.select.NONE);
        }
      }
      model.setAndUpdateSelection(TreeFilter.Enum.select.ALL);
      return newState;
    },
    changeSelection: function(model) {
      this.base(model);
      return this.applySelection(model);
    },
    getSelectedItems: function(model,field) {
      
      /* a single select item with 1 item: when this one becomes selected, then the selection 
       * strategy is ALL for both the child and the parent ( a.k.a root node); but in this case, we should 
       * present the child as the selected one, and not the root node
       */
       if( model && model.isRoot() && model.children() && model.countSelectedItems() == 1 && model.children().length == 1 ){

        return _.flatten(model.children().map(function(child) {
            return child.getSelectedItems(field) || [];
        }));

       } else {
        
          // default behaviour
          return model.getSelectedItems(field);
      }
    }
  });
})(TreeFilter.SelectionStrategies);
