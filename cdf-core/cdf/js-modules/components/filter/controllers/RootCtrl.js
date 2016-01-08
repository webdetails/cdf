

/**
 * @module BaseFilter
 * @submodule Controllers
 */

define([
    'cdf/lib/jquery',
    'amd!cdf/lib/underscore',
    'cdf/lib/BaseEvents',
    '../base/Logger',
  '../models/SelectionTree'
], function( $, _, BaseEvents,  Logger, SelectionTree) {

  var SelectionStates = SelectionTree.SelectionStates;
      /**
       * General-purpose controller.
       *
       * @class RootCtrl
       * @constructor
       * @uses BaseFilter.Logger
       * @extends Backbone.View
       */
      var RootCtrl = BaseEvents.extend( Logger ).extend({
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
         * @method onSelection
         * @chainable
         */
        onSelection: function(model) {
          this.configuration.selectionStrategy.strategy.changeSelection(model);
          return this;
        },

        /**
         * Informs the model that the user chose to commit the current selection.
         * Delegates work to the current selection strategy.
         *
         * @method onApply
         * @chainable
         */
        onApply: function(model) {
          this.configuration.selectionStrategy.strategy.applySelection(model);
          return this;
        },

        /**
         * Informs the model that the user chose to revert to the last saved selection.
         * Delegates work to the current selection strategy.
         *
         * @method onCancel
         * @chainable
         */
        onCancel: function(model) {
          model.restoreSelectedItems();
          model.root().set('isCollapsed', true);
          return this;
        },
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
        onClickOutside: function(model) {
          model.set('isCollapsed', true);
          return this;
        },
        onOnlyThis: function(model) {
          this.debug("Setting Only This");
          this.model.root().setAndUpdateSelection(SelectionStates.NONE);
          this.configuration.selectionStrategy.strategy.setSelection(SelectionStates.ALL, model);
          return this;
        }
      });
  
  return RootCtrl;
});
