/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
   * @class cdf.components.filter.views.Group
   * @amd cdf/components/filter/views/Group
   * @extends cdf.components.filter.views.Abstract
   * @classdesc View for groups of items.
   * @ignore
   */
  return AbstractView.extend(/** @lends cdf.components.filter.views.Group# */{
    /**
     * View type.
     *
     * @const
     * @type {string}
     */
    type: 'Group',
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.Views.Group',
    /**
     * Default templates.
     *
     * @type {object}
     */
    template: {
      skeleton: templates['Group-skeleton'],
      selection: templates['Group-template']
    },
    /**
     * Default event mappings.
     *
     * @type {object}
     */
    events: {
      'change    .filter-filter:eq(0)': 'onFilterChange',
      'keyup     .filter-filter:eq(0)': 'onFilterChange',
      'click     .filter-filter-clear:eq(0)': 'onFilterClear',
      'click     .filter-group-selection': 'onSelection',
      'click     .filter-collapse-icon:eq(0)': 'onToggleCollapse',
      'mouseover .filter-group-container': 'onMouseOver',
      'mouseout  .filter-group-container': 'onMouseOut'
    },
    /**
     * @param {object} model
     * @return {*}
     */
    bindToModel: function (model) {
      this.base(model);
      this.onChange(model, 'isSelected numberOfSelectedItems numberOfItems', this.updateSelection);
      return this.onChange(model, 'isCollapsed', this.updateCollapse);
    },
    /**
     * @return {*}
     */
    updateCollapse: function () {
      var viewModel = this.getViewModel();
      return this.renderCollapse(viewModel);
    },
    /**
     * @param {object} viewModel
     * @return {*}
     */
    renderCollapse: function (viewModel) {
      this.renderSelection(viewModel);
      var collapsable = ['.filter-group-body', '.filter-group-footer'].join(', ');
      if (!viewModel.isCollapsed) {
        return this.$(collapsable).hide();
      } else {
        return this.$(collapsable).show();
      }
    }
  });

});
