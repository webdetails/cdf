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
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../../../lib/Base',
  '../../../Logger',
  '../models/SelectionTree'
], function ($, _, Base, Logger, SelectionTree) {

  return  Base.extend(Logger).extend(/** @lends cdf.components.filter.strategies.AbstractSelect# */{
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.SelectionStrategies.AbstractSelect',

    /**
     * @constructs
     * @extends {@link http://dean.edwards.name/weblog/2006/03/base/|Base}
     * @extends cdf.Logger
     * @amd cdf/components/filter/strategies/AbstractSelect
     * @classdesc Base class for handling the selection logic, for instance:
     *   <ul>
     *     <li> what happens when I click on a particular item </li>
     *     <li> what rules should be followed </li>
     *   </ul>
     * @ignore
     */
    constructor: function (options) {
      return this.isLogicGlobal = true;
    },

    /**
     * Calculates the new state of an item, after the user clicked on it.
     *
     * @param  {SelectionStates} oldState The previouse selection state.
     * @return {SelectionStates} Returns the next selection state.
     */
    getNewState: function (oldState) {
      switch (oldState) {
        case SelectionTree.SelectionStates.NONE:
          return SelectionTree.SelectionStates.ALL;
        case SelectionTree.SelectionStates.ALL:
          return SelectionTree.SelectionStates.NONE;
        case SelectionTree.SelectionStates.SOME:
          return SelectionTree.SelectionStates.NONE;
      }
    },

    /**
     * Infers the state of a node, based on the current state of its children.
     *
     * @param {SelectionStates[]} childrenStates an array containing the state of each child
     * @return {SelectionStates} Returns the inferred state
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
     * Sets a node in the selection tree to a particular state.
     *
     * @param {SelectionStates} newState
     * @param {object} model
     */
    setSelection: function (newState, model) {
      throw new Error("NotImplemented");
    },

    /**
     * Perform operations on the model, associated with the user clicking on an item.
     *
     * @param {object} model
     * @return {this}
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
     * Perform operations on the model, associated with commiting the current selection.
     *
     * @param {object} model
     * @return {this}
     */
    applySelection: function (model) {
      model.updateSelectedItems();
      model.root().set('isCollapsed', true);
      return this;
    },

    /**
     * Gets the selected items. Default behaviour is do defer to the model's one.
     *
     * @param {object} model The target model.
     * @param {object} field
     * @return {*} The return value of executing the model object _getSelectedItems_ function.
     */
    getSelectedItems: function (model, field) {
      return model.getSelectedItems(field);
    }
  });

});
