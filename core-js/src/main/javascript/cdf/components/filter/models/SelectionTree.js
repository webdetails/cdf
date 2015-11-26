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
 * Represents the state of the filter as tree structure.
 #
 * @module BaseFilter
 * @submodule Models
 * @class SelectionTree
 * @constructor
 * @extends Tree
 */

define([
  'amd!../../../lib/underscore',
  '../../../lib/BaseSelectionTree'
], function( _, BaseSelectionTree ) {

  return BaseSelectionTree.extend({

    /**
     * @property {Object} [defaults]
     * @private
     * Default values for each node in the selection tree
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
    setBusy: function(isBusy) {
      this.root().set('isBusy', isBusy);
      return this;
    },
    isBusy: function() {
      return this.root().get('isBusy');
    }
  }, {
    SelectionStates: BaseSelectionTree.SelectionStates
  });

});
