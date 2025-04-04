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
'use strict';

/**
 * @module TreeFilter
 * @submodule SelectionStrategies
 */
(function(SelectionStrategies, Logger, _) {
  'use strict';

  /**
   * Base class for handling the selection logic
   *  - what happens when I click on a particular item
   *  - what rules should be followed
   * @class AbstractSelect
   * @extends Base
   * @uses TreeFilter.Logger
   * @constructor
   */
  return SelectionStrategies.AbstractSelect = Base.extend(Logger).extend({
    ID: 'TreeFilter.SelectionStrategies.AbstractSelect',
    constructor: function(options) {
      return this.isLogicGlobal = true;
    },

    /**
     * Calculates the new state of an item, after the user clicked on it
     * @method getNewState
     * @public
     * @param {Enum} oldState
     * @return {Enum} Returns the next state
     */
    getNewState: function(oldState) {
      switch (oldState) {
        case TreeFilter.Enum.select.NONE:
          return TreeFilter.Enum.select.ALL;
        case TreeFilter.Enum.select.ALL:
          return TreeFilter.Enum.select.NONE;
        case TreeFilter.Enum.select.SOME:
          return TreeFilter.Enum.select.NONE;
      }
    },

    /**
     * Infers the state of a node, based on the current state of its children
     * @method inferSelectionFromChildren
     * @private
     * @param {Array of Enum} childrenStates
     * @return {Enum} Returns the inferred state
     */
    inferSelectionFromChildren: function(childrenStates) {
      var all, none;
      all = _.every(childrenStates, function(el) {
        return el === TreeFilter.Enum.select.ALL;
      });
      none = _.every(childrenStates, function(el) {
        return el === TreeFilter.Enum.select.NONE;
      });
      if (all) {
        return TreeFilter.Enum.select.ALL;
      } else if (none) {
        return TreeFilter.Enum.select.NONE;
      } else {
        return TreeFilter.Enum.select.SOME;
      }
    },

    /**
     * Sets a node in the selection tree to a particular state
     * @method setSelection
     * @protected
     * @param {Enum} newState
     * @param {Object} model
     * @chainable
     */
    setSelection: function(newState, model) {
      throw new Error("NotImplemented");
    },

    /**
     * Perform operations on the model, associated with the user clicking on an item
     * @method changeSelection
     * @public
     * @param {Object} model
     * @chainable
     */
    changeSelection: function(model) {
      var c, d, newState, that;
      d = $.now();
      c = TreeFilter.count;
      newState = this.getNewState(model.getSelection());
      newState = this.setSelection(newState, model);
      that = this;
      _.delay(function() {
        return that.debug("Switching " + (model.get('label')) + " to " + newState + " took " + ($.now() - d) + " ms and " + (TreeFilter.count - c) + " renders");
      }, 0);
      return this;
    },

    /**
     * Perform operations on the model, associated with commiting the current selection
     * @method applySelection
     * @public
     * @param {Object} model
     * @chainable
     */
    applySelection: function(model) {
      model.updateSelectedItems();
      model.root().set('isCollapsed', true);
      return this;
    },

    /**
     * Default getSelectedItems behaviour is do defer to the model's one
     * @method getSelectedItems
     * @public
     * @param {Object} model
     * @param {Object} field
     * @chainable
     */
    getSelectedItems: function(model,field) {
      return model.getSelectedItems(field);
    }
  });
})(TreeFilter.SelectionStrategies, TreeFilter.Logger, _);
