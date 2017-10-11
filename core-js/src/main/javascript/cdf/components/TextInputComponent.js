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
  "../lib/jquery",
  "./BaseComponent",
  "../Logger"
], function($, BaseComponent, Logger) {

  return BaseComponent.extend({
    update: function() {
      var myself = this;

      myself._addHtmlToPlaceholder();

      var el = $("#" + myself.name);
      el.val(myself.dashboard.getParameterValue(myself.parameter));
      el.change(function() {
        if(myself.dashboard.getParameterValue(myself.parameter) !== el.val()) {
          myself.dashboard.processChange(myself.name);
        }
      }).keyup(function(ev) {
        if(ev.keyCode == 13 && myself.dashboard.getParameterValue(myself.parameter) !== el.val()) {
          myself.dashboard.processChange(myself.name);
        }
      });

      myself._doAutoFocus();
    },

    getValue: function() {
      return $("#" + this.name).val();
    },

    _addHtmlToPlaceholder: function() {
      var attrs = {
        type: "text",
        id: this.name,
        name: this.name,
        size: this.size || this.charWidth || undefined,
        maxlength: this.maxLength || this.maxChars || undefined
      };

      var componentHTML = '<input ' + processAttrs(attrs) + '>';

      if(this.size) Logger.warn("Attribute 'size' is deprecated");
      if(this.maxLength) Logger.warn("Attribute 'maxLength' is deprecated");

      this.placeholder().html(componentHTML);

      function processAttrs(conf) {
        var list = [];
        for(prop in conf) {
          if(conf.hasOwnProperty(prop) && conf[prop] != null) {
            list.push(prop + '="' + conf[prop] + '"');
          }
        }
        return list.join(" ");
      }
    }
  });

});
