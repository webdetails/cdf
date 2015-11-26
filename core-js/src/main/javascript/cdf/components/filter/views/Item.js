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
  return AbstractView.extend({
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

});
