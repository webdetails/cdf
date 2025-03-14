/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
'use strict';

/**
 * @module TreeFilter
 * @submodule Views
 */
(function($, _, Mustache, Views, TreeFilterTemplates) {

  /**
   * Root View: the part of the filter that
   * remains visible when the filter is collapsed
   * @class Root
   * @extends AbstractView
   * @constructor
   */
  Views.Root = Views.AbstractView.extend({
    type: 'Root',
    ID: 'TreeFilter.Views.Root',
    template: {
      skeleton: TreeFilterTemplates['Root-skeleton'],
      overlay: TreeFilterTemplates['Root-overlay'],
      header: TreeFilterTemplates['Root-header'],
      selection: TreeFilterTemplates['Root-template'],
      footer: TreeFilterTemplates['Root-footer']
    },
    events: {
      'click     .filter-root-header:eq(0)': 'onToggleCollapse',
      'click     .filter-root-selection:eq(0)': 'onSelection',
      'click     .filter-btn-apply:eq(0)': 'onApply',
      'click     .filter-btn-cancel:eq(0)': 'onCancel',
      'mouseover .filter-root-header': 'onMouseOver',
      'mouseout  .filter-root-header': 'onMouseOut',
      'keyup   .filter-filter:eq(0)': 'onFilterChange',
      'change  .filter-filter:eq(0)': 'onFilterChange',
      'click  .filter-filter-clear:eq(0)': 'onFilterClear',
      'click  .filter-overlay': 'onOverlayClick'
    },
    initialize: function(options) {
      this.renderOverlay = this.renderSlot('overlay');
      this.renderHeader = this.renderSlot('header');
      this.renderFooter = this.renderSlot('footer');
      return this.base(options);
    },
    bindToModel: function(model) {
      this.base(model);
      this.onChange(model, 'isCollapsed', this.updateCollapse);
      this.onChange(model, 'isSelected numberOfSelectedItems numberOfItems reachedSelectionLimit', this.updateHeader);
      this.onChange(model, 'isSelected numberOfSelectedItems numberOfItems selectedItems', this.updateSelection);
      this.onChange(model, 'reachedSelectionLimit isBusy', this.updateFooter);
      return this.onChange(model, 'isDisabled', _.bind(this.updateAvailability, this));
    },
    getViewModel: function() {
      var viewModel;
      viewModel = this.base();
      $.extend(viewModel, {
        selectedItems: _.map(
          this.configuration.selectionStrategy.strategy.getSelectedItems(this.model, 'label') /*this.model.getSelectedItems('label')*/, function(label) {
          return label + " ";
        }),
        allItemsSelected: this.model.getSelection() === true,
        noItemsSelected: this.model.getSelection() === false,
        hasChanged: this.model.hasChanged()
      });
      return viewModel;
    },
    render: function() {
      var viewModel;
      viewModel = this.getViewModel();
      this.renderSkeleton(viewModel);
      this.renderOverlay(viewModel);
      this.renderHeader(viewModel);
      this.renderCollapse(viewModel);
      this.renderSelection(viewModel);
      this.renderFooter(viewModel);
      this.renderAvailability(viewModel);
      return this;
    },
    updateHeader: function() {
      var viewModel;
      viewModel = this.getViewModel();
      this.renderHeader(viewModel);
      return this;
    },
    updateFooter: function() {
      var viewModel;
      viewModel = this.getViewModel();
      this.renderFooter(viewModel);
      return this;
    },
    updateCollapse: function() {
      var viewModel;
      viewModel = this.getViewModel();
      this.renderHeader(viewModel);
      this.renderOverlay(viewModel);
      this.renderCollapse(viewModel);
      return this;
    },
    renderCollapse: function(viewModel) {
      if (viewModel.isDisabled === true) {
        var expand = (viewModel.alwaysExpanded === true); // we might want to start off the component as always-expanded
        this.$('.filter-root-container').toggleClass('expanded', expand).toggleClass('collapsed', !expand).toggleClass('always-expanded', expand);
      } else if (viewModel.alwaysExpanded === true) {
        this.$('.filter-root-container').toggleClass('expanded', false).toggleClass('collapsed', false).toggleClass('always-expanded', true);
      } else if (viewModel.isCollapsed === true) {
        this.$('.filter-root-container').toggleClass('expanded', false).toggleClass('collapsed', true).toggleClass('always-expanded', false);
      } else {
        this.$('.filter-root-container').toggleClass('expanded', true).toggleClass('collapsed', false).toggleClass('always-expanded', false);
      }
      return this;
    },
    updateAvailability: function() {
      var viewModel;
      viewModel = this.getViewModel();
      this.renderAvailability(viewModel);
      return this;
    },
    renderAvailability: function(viewModel) {
      this.$('.filter-root-container').toggleClass('disabled', viewModel.isDisabled === true);
      return this;
    },
    onOverlayClick: function(event) {
      this.trigger("click:outside", this.model);
      if (this.config.view.overlaySimulateClick === true) {
        this.$('.filter-overlay').toggleClass('expanded', false).toggleClass('collapsed', true);
        _.delay(function() {
          var $element, item;
          $element = $(document.elementFromPoint(event.clientX, event.clientY));
          item = _.chain($element.parents()).filter(function(m) {
            return $(m).hasClass('filter-root-header');
          }).first().value();
          if (item != null) {
            return $(item).click();
          }
        }, 0);
      }
      return this;
    }
  });
})($, _, Mustache, TreeFilter.Views, TreeFilter.templates);
