/**
 * @module BaseFilter
 * @submodule SelectionStrategies
 */
define([
  'cdf/lib/jquery',
  'amd!cdf/lib/underscore',
  'cdf/lib/Base',
  '../base/Logger',
  '../models/SelectionTree'
], function ($, _, Base, Logger, SelectionTree) {

  /**
   * Base class for handling the selection logic
   *  - what happens when I click on a particular item
   *  - what rules should be followed
   * @class AbstractSelect
   * @extends Base
   * @uses BaseFilter.Logger
   * @constructor
   */

  var SelectionStates = SelectionTree.SelectionStates;

  var AbstractSelect = Base.extend(Logger).extend({
    ID: 'BaseFilter.SelectionStrategies.AbstractSelect',
    constructor: function (options) {
      return this.isLogicGlobal = true;
    },

    /**
     * Calculates the new state of an item, after the user clicked on it
     * @method getNewState
     * @public
     * @param {Enum} oldState
     * @return {Enum} Returns the next state
     */
    getNewState: function (oldState) {
      switch (oldState) {
        case SelectionStates.NONE:
          return SelectionStates.ALL;
        case SelectionStates.ALL:
          return SelectionStates.NONE;
        case SelectionStates.SOME:
          return SelectionStates.NONE;
      }
    },

    /**
     * Infers the state of a node, based on the current state of its children
     * @method inferSelectionFromChildren
     * @private
     * @param {Array of Enum} childrenStates
     * @return {Enum} Returns the inferred state
     */
    inferSelectionFromChildren: function (childrenStates) {
      var all = _.every(childrenStates, function (el) {
        return el === SelectionStates.ALL;
      });
      var none = _.every(childrenStates, function (el) {
        return el === SelectionStates.NONE;
      });
      if (all) {
        return SelectionStates.ALL;
      } else if (none) {
        return SelectionStates.NONE;
      } else {
        return SelectionStates.SOME;
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
    setSelection: function (newState, model) {
      throw new Error("NotImplemented");
    },

    /**
     * Perform operations on the model, associated with the user clicking on an item
     * @method changeSelection
     * @public
     * @param {Object} model
     * @chainable
     */
    changeSelection: function (model) {
      var d = $.now();
      var newState = this.getNewState(model.getSelection());
      newState = this.setSelection(newState, model);
      var that = this;
      _.delay(function () {
        return that.debug("Switching " + (model.get('label')) + " to " + newState + " took " + ($.now() - d) + " ms ");
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
    applySelection: function (model) {
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
    getSelectedItems: function (model, field) {
      return model.getSelectedItems(field);
    }
  });

  return AbstractSelect;
});
