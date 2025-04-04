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
  '../baseevents/baseeventsModel',
  '../../../Logger'
], function(_, BaseModel, Logger) {

  /**
   * @class cdf.components.filter.data-handlers.OutputDataHandler
   * @amd cdf/components/filter/data-handlers/OutputDataHandler
   * @extends cdf.components.filter.baseevents.baseeventsModel
   * @classdesc The Output DataHandler:
   *   <ul><li>watches the model for specific changes</li>
   *       <li>synchronizes CDF with the model</li></ul>
   *   If you squint, you can see that it behaves like a View,
   *   except that it writes to a CDF parameter.
   * @ignore
   */
  return BaseModel.extend(Logger).extend(/** @lends cdf.components.filter.data-handlers.OutputDataHandler# */{
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.DataHandlers.Output',
    initialize: function() {
      if (true || this.attributes.options.trigger === 'apply') {
        this.listenTo(this.get('model'), 'change:selectedItems', this.onApply);
      } else {
        this.listenTo(this.get('model'), 'change:isSelected', this.onSelection);
      }
      return this;
    },
    _processOutput: function(model, selection) {
      var modifiedSelection, result;
      result = void 0;
      if (_.isFunction(this.attributes.options.outputFormat)) {
        modifiedSelection = this.attributes.options.outputFormat.call(this, model, selection);
        result = !_.isUndefined(modifiedSelection) ? modifiedSelection : void 0;
      } else {
        if (_.isString(this.attributes.options.outputFormat)) {
          switch (this.attributes.options.outputFormat.toLowerCase()) {
            case 'lowestid':
              result = this.getLowestId(selection);
              break;
            case 'highestid':
              result = this.getHighestId(selection);
              break;
            case 'selected':
              result = selection;
          }
        }
      }
      if (_.isUndefined(result)) {
        result = this.getLowestId(selection);
      }
      return result;
    },

    /**
     * Process the list of selected items and attempt to produce a compact array,
     * in which a single id is user to represent all the members of a fully
     * selected group.
     *
     * @param {string} selectionState The selection state.
     * @return {object[]} Returns a list of model identifiers.
     */
    getHighestId: function(selectionState) {

      /*
       * If a node with children is set to "all", return self and omit the children
       */
      var list;
      list = _.chain(selectionState.all).filter(function(m) {
        return !_.isUndefined(m.get('id'));
      }).filter(function(m, idx, models) {
        var isParent;
        isParent = !_.contains(models, m.parent());
        return isParent;
      }).map(function(m) {
        return m.get('id');
      }).value();
      return list;
    },

    /**
     * Process the list of selected items and produce a list of the ids of
     * the selected items (leafs only).
     *
     * @param {string} selectionState The selection state.
     * @return {object[]} Returns a list of model identifiers.
     */
    getLowestId: function(selectionState) {

      /*
       * Return the id of selected children. Group ids are ignored
       */
      var list;
      list = _.chain(selectionState.all).filter(function(m, idx, models) {
        return !m.children();
      }).map(function(m) {
        return m.get('id');
      }).value();
      return list;
    },
    onApply: function(model, selectionState) {
      var treatedSelection;
      if (selectionState == null) {
        return this;
      }
      treatedSelection = this._processOutput(model, selectionState);
      this.debug("confirmed selection:" + treatedSelection);
      this.trigger('changed', treatedSelection);
      return this;
    },
    onSelection: function(model) {
      this.debug("onSelection: " + model.get('label'));
      return this;
    },

    /**
     * Reads the selection state from the model and transforms this information
     * into the format the CDF filter is expecting to consume.
     *
     * @return {object[]} Returns the currently committed selection state.
     */
    getValue: function() {
      var model, selection, treatedSelection;
      model = this.get('model');
      selection = model.root().get('selectedItems');
      treatedSelection = this._processOutput(selection, model);
      return treatedSelection;
    }
  });

});
