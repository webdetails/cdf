
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
    'amd!cdf/lib/underscore',
    'cdf/lib/BaseSelectionTree'],
    function( _, BaseSelectionTree ) {

  var SelectionTree = BaseSelectionTree.extend({

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

  return SelectionTree;
});
