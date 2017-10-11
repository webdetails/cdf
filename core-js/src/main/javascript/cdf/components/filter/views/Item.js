/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

define([
  './Abstract',
  '../base/templates'
], function (AbstractView, templates) {

  /**
   * @class cdf.components.filter.views.Item
   * @amd cdf/components/filter/views/Item
   * @extends cdf.components.filter.views.Abstract
   * @classdesc View for items.
   * @ignore
   */
  return AbstractView.extend(/** @lends cdf.components.filter.views.Item# */{
    /**
     * View type.
     *
     * @const
     * @type {string}
     */
    type: 'Item',
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.Views.Root',
    /**
     * Default templates.
     *
     * @type {object}
     */
    template: {
      selection: templates['Item-template'],
      skeleton: templates['Item-template']
    },
    /**
     * Default event mappings.
     *
     * @type {object}
     */
    events: {
      'mouseover .filter-item-body': 'onMouseOver',
      'mouseout  .filter-item-body': 'onMouseOut',
      'click     .filter-item-body': 'onSelection',
      'click     .filter-item-only-this': 'onClickOnlyThis'
    },
    /**
     * @param {object} model
     * @return {*}
     */
    bindToModel: function (model) {
      this.base(model);
      this.onChange(model, 'isSelected', this.updateSelection);
      return this.onChange(model, 'isVisible', this.updateVisibility);
    },
    /**
     * Callback for click events on the _only-this_ button.
     *
     * @param {Event} event
     * @return {*}
     */
    onClickOnlyThis: function (event) {
      event.stopPropagation();
      return this.trigger('control:only-this', this.model);
    }
  });

});
