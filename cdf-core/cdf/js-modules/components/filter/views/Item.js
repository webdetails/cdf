/**
 * @module BaseFilter
 * @submodule Views
 */

define([
  './Abstract',
  '../base/templates'
], function (AbstractView, templates) {

  /**
   * View for items
   * @class Item
   * @constructor
   * @extends AbstractView
   */
  var Item = AbstractView.extend({
    type: 'Item',
    ID: 'BaseFilter.Views.Root',
    template: {
      selection: templates['Item-template'],
      skeleton: templates['Item-template']
    },
    events: {
      'mouseover .filter-item-body': 'onMouseOver',
      'mouseout  .filter-item-body': 'onMouseOut',
      'click     .filter-item-body': 'onSelection',
      'click     .filter-item-only-this': 'onClickOnlyThis'
    },
    bindToModel: function (model) {
      this.base(model);
      this.onChange(model, 'isSelected', this.updateSelection);
      return this.onChange(model, 'isVisible', this.updateVisibility);
    },
    onClickOnlyThis: function (event) {
      event.stopPropagation();
      return this.trigger('control:only-this', this.model);
    }
  });

  return Item;
});
