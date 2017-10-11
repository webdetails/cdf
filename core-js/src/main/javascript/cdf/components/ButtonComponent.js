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
  'amd!../lib/underscore',
  '../lib/jquery',
  './ActionComponent',
  'css!./ButtonComponent'
], function(_, $, ActionComponent) {

  /**
   * @class cdf.components.ButtonComponent
   * @amd cdf/components/ButtonComponent
   * @classdesc Button component class.
   * @extends cdf.components.ActionComponent
   * @ignore
   */
  return ActionComponent.extend(/** @lends cdf.components.ButtonComponent# */{
    _docstring: function() {
      return "Button Component that triggers a server action when clicked";
    },

    /**
     * Renders the button component UI.
     */
    render: function() {
      var myself = this;

      // making sure the button plugin we have loaded is the jquery one
      if($.fn.button.noConflict) {
        $.fn.button.noConflict();
      }

      // store the original success and failure callback functions and
      // set a new function to re-enable the button and call the original function
      if(typeof this.successCallback === 'function') {
        var orSuccessCallback = this.successCallback;
        this.successCallback = function() {
          myself.enable();
          orSuccessCallback.apply(myself, arguments);
        };
      } else {
        this.successCallback = function() { myself.enable(); };
      }
      if(typeof this.failureCallback === 'function') {
        var orFailureCallback = this.failureCallback;
        this.failureCallback = function() {
          myself.enable();
          orFailureCallback.apply(myself, arguments);
        };
      } else {
        this.failureCallback = function() { myself.enable(); };
      }

      if (typeof this.buttonStyle === "undefined") {
        this.buttonStyle = this.dashboard.getWcdfSettings().rendererType === "bootstrap" ?
          "bootstrap" : "themeroller";
      }
      var cssClass = this.cssClass || "";
      if (this.buttonStyle === "bootstrap") {
        cssClass = "btn-default " + cssClass;
      }

      var b = $("<button type='button'/>")
        .addClass('buttonComponent ' + cssClass)
        .unbind("click")
        .bind("click", function() {
          var proceed = true;

          // disable button to prevent unwanted presses
          myself.disable();

          if(_.isFunction(myself.expression)) {
            proceed = myself.expression.apply(myself, arguments);

            // re-enable the button if there's no action associated.
            // neither the successCallback nor the failureCallback will be called in this case
            if(!myself.hasAction()) {
              myself.enable();
            }
          } else if(!myself.expression) {
            if(!myself.hasAction()) {
              myself.enable();
            }
          }

          if(myself.hasAction() && !(proceed === false)) {
            return myself.triggerAction.apply(myself);
          } 
        });

      if(this._isJQueryUiButton()) {
        b.button();
      }
      b.appendTo(this.placeholder().empty());

      this.setLabel(this.label);
      this.enable();

      this._doAutoFocus();
    },

    /**
     * Disables the button (grays it out and prevents click events).
     */
    disable: function() {
      this.placeholder('button').attr('disabled', 'disabled');
      this.placeholder('button').removeClass('enabled').addClass('disabled');
    },

    /**
     * Enables the button.
     */
    enable: function() {
      this.placeholder('button').removeAttr('disabled');
      this.placeholder('button').removeClass('disabled').addClass('enabled');
    },

    /**
     * Changes the label shown on the button.
     *
     * @param {string|function} label The label to show in the component's HTML element.
     */
    setLabel: function(label) {
      var validatedLabel = typeof label === 'function' ? label.call(this) : (label || "");
      this.label = validatedLabel.toString();
      
      // if we have a jQueryUi button change the text with appropriate method
      if(this._isJQueryUiButton()) {
        this.placeholder('button').button('option', 'label', this.label);
      } else {
        this.placeholder('button').text(this.label);
      }      
    },

    /**
     * Returns whether or not the button is a
     * {@link http://api.jqueryui.com/button/|jQueryUI.button} widget.
     *
     * @private
     */
    _isJQueryUiButton: function() {
      return _.isUndefined(this.buttonStyle) || this.buttonStyle === "themeroller";
    }
  });

});
