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
   * View for groups of items
   * @class Group
   * @constructor
   * @extends AbstractView
   */
  return AbstractView.extend({
    type: 'Group',
    ID: 'BaseFilter.Views.Group',
    template: {
      skeleton: templates['Group-skeleton'],
      selection: templates['Group-template']
    },
    events: {
      'change    .filter-filter:eq(0)': 'onFilterChange',
      'keyup     .filter-filter:eq(0)': 'onFilterChange',
      'click     .filter-filter-clear:eq(0)': 'onFilterClear',
      'click     .filter-group-selection': 'onSelection',
      'click     .filter-collapse-icon:eq(0)': 'onToggleCollapse',
      'mouseover .filter-group-container': 'onMouseOver',
      'mouseout  .filter-group-container': 'onMouseOut'
    },
    bindToModel: function (model) {
      this.base(model);
      this.onChange(model, 'isSelected numberOfSelectedItems numberOfItems', this.updateSelection);
      return this.onChange(model, 'isCollapsed', this.updateCollapse);
    },
    updateCollapse: function () {
      var viewModel = this.getViewModel();
      return this.renderCollapse(viewModel);
    },
    renderCollapse: function (viewModel) {
      this.renderSelection(viewModel);
      var collapsable = ['.filter-group-body', '.filter-group-footer'].join(', ');
      if (viewModel.isCollapsed) {
        return this.$(collapsable).hide();
      } else {
        return this.$(collapsable).show();
      }
    }
  });

});
