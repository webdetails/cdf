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
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../../../lib/BaseEvents',
  '../../../Logger',
  '../models/SelectionTree'
], function($, _, BaseEvents,  Logger, SelectionTree) {

  return BaseEvents.extend(Logger).extend(/** @lends cdf.components.filter.controllers.RootCtl# */{
    /**
     * @constructs
     * @amd cdf/components/filter/controllers/RootCtl
     * @extends cdf.lib.baseEvents.BaseEvents
     * @classdesc General-purpose controller.
     * @param {object} args Some aditional default options.
     * @ignore
     */
    constructor: function(args) {
      $.extend(this, _.pick(args, ['model', 'view', 'configuration']));
      if (this.view) {
        this.bindToView(this.view);
      }
      this.loglevel = this.configuration.loglevel;
      return this;
    },
    bindToView: function(view) {
      var bindings, that;
      bindings = {
        'selected': this.onSelection,
        'toggleCollapse': this.onToggleCollapse,
        'control:only-this': this.onOnlyThis,
        'control:apply': this.onApply,
        'control:cancel': this.onCancel,
        'click:outside': this.onClickOutside
      };
      that = this;
      _.each(bindings, function(callback, event) {
        return that.listenTo(view, event, callback);
      });
      return this;
    },

    /*
     * Event handling
     */

    /**
     * Acts upon the model whenever the user selected something.
     * Delegates work to the current selection strategy.
     *
     * @param {object} model The target model.
     * @return {this}
     */
    onSelection: function(model) {
      this.configuration.selectionStrategy.strategy.changeSelection(model);
      return this;
    },

    /**
     * Informs the model that the user chose to commit the current selection.
     * Delegates work to the current selection strategy.
     *
     * @param {object} model The target model.
     * @return {this}
     */
    onApply: function(model) {
      this.configuration.selectionStrategy.strategy.applySelection(model);
      return this;
    },

    /**
     * Informs the model that the user chose to revert to the last saved selection.
     * Delegates work to the current selection strategy.
     *
     * @param {object} model The target model.
     * @return {this}
     */
    onCancel: function(model) {
      model.restoreSelectedItems();
      model.root().set('isCollapsed', true);
      return this;
    },

    /**
     * Toggles the component collapsed state and updates the models visibility.
     * When collapsing the component, if no model was visible,
     * the filter (search pattern) is reset.
     *
     * @param {object} model The target model.
     * @return {this}
     */
    onToggleCollapse: function(model) {
      var newState, oldState;
      this.debug("Setting isCollapsed");
      if (model.get('isDisabled') === true) {
        newState = true;
      } else {
        oldState = model.get('isCollapsed');
        newState = !oldState;
      }
      var hasVisibleNode = !!model.nodes() && _.some(model.nodes().models, function(model) {
        return model.get('isVisible');
      });
      if (!hasVisibleNode && oldState) {
        this.view.onFilterClear();
      }
      model.set('isCollapsed', newState);
      return this;
    },

    /**
     * Collapses the component when a mouse click happens outside the component.
     *
     * @param {object} model The target model.
     * @return {this}
     */
    onClickOutside: function(model) {
      model.set('isCollapsed', true);
      return this;
    },

    /**
     * UPdates the models selection state when the _only-this_ button is pressed.
     *
     * @param {object} model The target model.
     * @return {this}
     */
    onOnlyThis: function(model) {
      this.debug("Setting Only This");
      this.model.root().setAndUpdateSelection(SelectionTree.SelectionStates.NONE);
      this.configuration.selectionStrategy.strategy.setSelection(SelectionTree.SelectionStates.ALL, model);
      return this;
    }
  });

});
