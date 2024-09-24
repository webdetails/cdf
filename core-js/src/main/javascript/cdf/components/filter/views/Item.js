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
