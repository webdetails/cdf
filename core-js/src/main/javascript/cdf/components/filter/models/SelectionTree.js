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
  'amd!../../../lib/underscore',
  '../../../lib/BaseSelectionTree'
], function( _, BaseSelectionTree ) {

  /**
   * @class cdf.components.filter.models.SelectionTree
   * @amd cdf/components/filter/models/SelectionTree
   * @extends cdf.lib.baseSelectionTree.BaseSelectionTree
   * @classdesc Represents the state of the filter as a tree structure.
   * @ignore
   */
  return BaseSelectionTree.extend(/** @lends cdf.components.filter.models.SelectionTree# */{

    /**
     * Default values for each node in the selection tree.
     *
     * @type     {object}
     * @property {string}  id                    The default id.
     * @property {string}  label                 The default label.
     * @property {boolean} isSelected            The default selection state.
     * @property {boolean} isVisible             The default visibility state.
     * @property {boolean} isCollapsed           The default collapsed state.
     * @property {number}  numberOfSelectedItems The default number of selected items.
     * @property {number}  numberOfItems         The default number of items.
     * @property {number}  page                  The default page.
     */
    defaults: {
      id: undefined,
      label: "",
      isSelected: false,
      isVisible: true,
      isCollapsed: true,
      numberOfSelectedItems: 0,
      numberOfItems: 0,
      page: 0
    },

    /**
     * Sets the isBusy parameter.
     *
     * @param {boolean} isBusy The new value to set.
     * @return {this}
     */
    setBusy: function(isBusy) {
      this.root().set('isBusy', isBusy);
      return this;
    },

    /**
     * Bets the isBusy parameter value.
     *
     * @return {boolean} The `isBusy` parameter value.
     */
    isBusy: function() {
      return this.root().get('isBusy');
    }
  }, {
    SelectionStates: BaseSelectionTree.SelectionStates
  });

});
