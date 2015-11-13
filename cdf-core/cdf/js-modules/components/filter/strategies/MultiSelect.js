/**
 * @module BaseFilter
 * @submodule SelectionStrategies
 */
define([
  'amd!cdf/lib/underscore',
  './AbstractSelect'
], function (_, AbstractSelect) {

  /**
   * Multiple Selection
   *  - any number of items can be selected
   #
   * @class MultiSelect
   * @extends AbstractSelect
   * @constructor
   */
  var MultiSelect = AbstractSelect.extend({
    ID: 'BaseFilter.SelectionStrategies.MultiSelect',
    setSelection: function (newState, model) {
      model.setAndUpdateSelection(newState);
      return newState;
    }
  });

  return MultiSelect;
});
