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
  'amd!../../../lib/underscore',
  '../../../lib/mustache',
  '../baseevents/baseeventsView',
  '../../../Logger',
  '../models/SelectionTree',
  '../../../lib/jquery',
  './scrollbar/ScrollBarFactory',
  '../HtmlUtils'
], function (_, Mustache, BaseView, Logger, SelectionTree, $, ScrollBarFactory, HtmlUtils) {

  /**
   * @class cdf.components.filter.views.Abstract
   * @amd cdf/components/filter/views/Abstract
   * @classdesc Abstract base class for all Views
   * @extends cdf.components.filter.baseevents.baseeventsView
   * @extends cdf.Logger
   * @ignore
   */
  return BaseView.extend(Logger).extend(/** @lends cdf.components.filter.views.Abstract# */{
    initialize: function (options) {
      this.configuration = options.configuration;
      this.loglevel = this.configuration.loglevel;
      this.config = this.configuration[this.type];

      /*
       * Consider user-defined templates
       */
      if (this.config.view.templates != null) {
        $.extend(true, this.template, this.config.view.templates);
      }
      if (this.model) {
        this.bindToModel(this.model);
      }
      this.setElement(options.target);
      this.render();
      return this;
    },
    bindToModel: function (model) {
      this.onChange(model, 'isVisible', this.updateVisibility);
      return this;
    },
    onChange: function (model, properties, callback) {
      var props = properties.split(' ');
      var events = _.map(props, function (prop) {
        return 'change:' + prop;
      }).join(' ');
      if (this.config.view.throttleTimeMilliseconds >= 0) {
        this.listenTo(model, events, _.throttle(callback, this.config.view.throttleTime, {
          leading: false
        }));
      } else {
        this.listenTo(model, events, callback);
      }
      return this;
    },
    updateSlot: function (slot) {
      return _.bind(function () {
        var viewModel = this.getViewModel();
        var renderer = this.renderSlot('slot');
        return renderer.call(this, viewModel);
      }, this);
    },
    renderSlot: function (slot) {
      return _.bind(function (viewModel) {
        if (this.template[slot]) {
          var html = Mustache.render(this.template[slot], viewModel);
		  html = HtmlUtils.sanitizeHtml(html);
          this.$(this.config.view.slots[slot]).replaceWith(html);
        }
        this.injectContent(slot);
        return this;
      }, this);
    },

    /*
     * View methods
     */
    getViewModel: function () {
      var viewOptions;
      viewOptions = _.result(this.config, 'options');
      return $.extend(true, this.model.toJSON(), viewOptions, {
        strings: _.result(this.config, 'strings'),
        selectionStrategy: _.omit(this.configuration.selectionStrategy, 'strategy'),
        isPartiallySelected: this.model.getSelection() === SelectionTree.SelectionStates.SOME,
        numberOfChildren: this.model.children() ? this.model.children().length : 0
      });
    },
    injectContent: function (slot) {
      var ref, ref1, renderers, that;
      renderers = (ref = this.config) != null ? (ref1 = ref.renderers) != null ? ref1[slot] : void 0 : void 0;
      if (renderers == null) {
        return;
      }
      if (!_.isArray(renderers)) {
        renderers = [renderers];
      }
      that = this;
      _.each(renderers, function (renderer) {
        if (_.isFunction(renderer)) {
          return renderer.call(that, that.$el, that.model, that.configuration);
        }
      });
      return this;
    },

    /**
     * Fully renders the view.
     */
    render: function () {
      var viewModel = this.getViewModel();
      this.renderSkeleton(viewModel);
      this.renderSelection(viewModel);
      this.updateVisibility(viewModel);
      return this;
    },
    renderSkeleton: function (viewModel) {
	  var rHtml = Mustache.render(this.template.skeleton, viewModel);
	  rHtml = HtmlUtils.sanitizeHtml(rHtml);
      this.$el.html(rHtml);
      return this;
    },
    updateSelection: function (model, options) {
      if (model === this.model) {
        var viewModel = this.getViewModel();
        this.renderSelection(viewModel);
      }
      return this;
    },
    renderSelection: function (viewModel) {
      var rHtml = Mustache.render(this.template.selection, viewModel);
	  rHtml = HtmlUtils.sanitizeHtml(rHtml);
      this.$(this.config.view.slots.selection).replaceWith(rHtml);
      this.injectContent('selection');
      return this;
    },
    updateVisibility: function () {
      if (this.model.getVisibility()) {
        return this.$el.show();
      } else {
        return this.$el.hide();
      }
    },

    /*
     * Children management
     */
    getChildrenContainer: function () {
      return this.$(this.config.view.slots.children);
    },
    createChildNode: function () {
      var $child = $('<div/>').addClass(this.config.view.childConfig.className);
      var $target = this.$(this.config.view.slots.children);
      $child.appendTo($target);
      return $child;
    },
    appendChildNode: function ($child) {
      var $target = this.$(this.config.view.slots.children);
      $child.appendTo($target);
      return $child;
    },

    /*
     * Scrollbar methods
     */
    updateScrollBar: function () {
      var nItems = this.config.options.scrollThreshold;
      var needsScrollBar = _.isFinite(this.configuration.pagination.pageSize) && this.configuration.pagination.pageSize > 0;
      needsScrollBar = needsScrollBar || this.type !== 'Item' && this.model.flatten().size().value() > nItems;
      if (needsScrollBar) {
        this.debug("There are more than " + nItems + " items, adding scroll bar");
        return this.addScrollBar();
      }
    },
    addScrollBar: function () {
      if (this._scrollBar != null) {
        return this;
      }
      this.debug("Adding a scrollbar to " + (this.model.get('label')));
      this._scrollBar = ScrollBarFactory.createScrollBar(this.config.view.scrollbar.engine,this);
      if (this.config.options.isResizable) {
        var $container = this.$(this.config.view.slots.children).parent();
        if (_.isFunction($container.resizable)) {
          $container.resizable({
            handles: 's'
          });
        }
      }
      return this;
    },
    setScrollBarAt: function ($tgt) {
      if (this._scrollBar != null) {
        this._scrollBar.scrollToPosition($tgt);
      }
      return this;
    },
    /*
     * Events triggered by the user
     */
    onMouseOver: function (event) {
      var $node;
      $node = this.$(this.config.view.slots.selection);
      $node = this.$('div:eq(0)');
      this.trigger('mouseover', this.model);
      return this;
    },
    onMouseOut: function (event) {
      var $node;
      $node = this.$(this.config.view.slots.selection);
      $node = this.$('div:eq(0)');
      this.trigger('mouseout', this.model);
      return this;
    },
    onSelection: function () {
      this.trigger('selected', this.model);
      return this;
    },
    onApply: function (event) {
      this.trigger('control:apply', this.model);
      return this;
    },
    onCancel: function (event) {
      this.debug("triggered Cancel");
      this.trigger('control:cancel', this.model);
      return this;
    },
    onFilterChange: function (event) {
      var text = $(event.target).val();
      this.trigger('filter', text, this.model);
      return this;
    },
    onFilterClear: function (event) {
      var text = '';
      this.$('.filter-filter-input:eq(0)').val(text);
      this.trigger('filter', text, this.model);
      return this;
    },
    onToggleCollapse: function (event) {
      this.debug("triggered collapse");
      this.trigger("toggleCollapse", this.model, event);
      return this;
    },

    /*
     * Boilerplate methods
     */
    close: function () {
      this.remove();
      return this.unbind();

      /*
       * Update tree of views
       */
    }
  });

});
