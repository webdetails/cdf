/*!
 * Copyright 2002 - 2017 Webdetails, a Pentaho company. All rights reserved.
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
  "../lib/jquery",
  "./BaseComponent",
  "../Logger"
], function($, BaseComponent, Logger) {

  return BaseComponent.extend({
    update: function() {
      var myself = this;

      myself._addHtmlToPlaceholder();

      var el = $("#" + myself.name);

      el.change(function() {
        if(myself._isValueChanged(el)) {
          myself._runValidation(el.val());
          myself.dashboard.processChange(myself.name);
        }
      }).keyup(function(ev) {
        if((myself.refreshOnEveryKeyUp || ev.keyCode === 13) && myself._isValueChanged(el)) {
          myself._runValidation(el.val());
          myself.dashboard.processChange(myself.name);
        }
      });

      if(myself.clearButton) {
        $("#" + myself.name + "-clear-icon").click(function() {
          el.val("");
          myself._runValidation(el.val());
          myself.dashboard.processChange(myself.name);
        });
      }

      myself._doAutoFocus();
    },

    getValue: function() {
      return $("#" + this.name).val();
    },

    _addHtmlToPlaceholder: function() {
      var componentHTML = "<input" +
        " type='text'" +
        " id='" + this.name + "'" +
        " name='" + this.name + "'" +
        " value='" + this.dashboard.getParameterValue(this.parameter) +
        (this.size ? ("' size='" + this.size) : (this.charWidth ? ("' size='" + this.charWidth) : "")) +
        (this.maxLength ? ("' maxlength='" + this.maxLength) : (this.maxChars ? ("' maxlength='" + this.maxChars) : "")) + "'>";
      if(this.clearButton) {
        var className = "clear-icon" + (this.clearButton.className ? " " + this.clearButton.className : "");
        componentHTML += "<div id='" + this.name + "-clear-icon' class='" + className + "'></div>";
      }
      if(this.size) {
        Logger.warn("Attribute 'size' is deprecated");
      }
      if(this.maxLength) {
        Logger.warn("Attribute 'maxLength' is deprecated");
      }
      this.placeholder().html(componentHTML);
    },

    _isValueChanged: function(element) {
      return this.dashboard.getParameterValue(this.parameter) !== element.val();
    },

    _runValidation: function(value) {
      if(this.validation && this.validation.validate) {
        var validationInfo = this.validation.validate(value);

        if(validationInfo.isValid) {
          this.placeholder().removeClass(this.validation.invalidClassName || "invalid");
        } else {
          this.placeholder().addClass(this.validation.invalidClassName || "invalid");
        }
      }
    }
  });
});
