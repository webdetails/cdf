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

define([
  "../lib/jquery",
  "./BaseComponent",
  "../Logger"
], function($, BaseComponent, Logger) {

  var TextInputComponent = BaseComponent.extend({
    update: function() {
      var myself = this;
      var name = myself.name;

      var selectHTML = "<input type='text' id='" + name + "' name='"  + name +
        "' value='" + myself.dashboard.getParameterValue(myself.parameter) +
        (myself.size ? ("' size='" + myself.size) : (myself.charWidth ? ("' size='" + myself.charWidth) : "")) +
        (myself.maxLength ? ("' maxlength='" + myself.maxLength) : (myself.maxChars ? ("' maxlength='" + myself.maxChars) : "")) + "'>";
      if(myself.size) {
        Logger.warn("Attribute 'size' is deprecated");
      }
      if(myself.maxLength) {
        Logger.warn("Attribute 'maxLength' is deprecated");
      }

      myself.placeholder().html(selectHTML);

      var el = $("#" + name);

      el.change(function() {
        if(myself.dashboard.getParameterValue(myself.parameter) !== el.val()) {
          myself.dashboard.processChange(name);
        }
      }).keyup(function(ev) {
        if(ev.keyCode == 13 && myself.dashboard.getParameterValue(myself.parameter) !== el.val()) {
          myself.dashboard.processChange(name);
        }
      });

      myself._doAutoFocus();
    },

    getValue: function() {
      return $("#" + this.name).val();
    }
  });

  return TextInputComponent;
});
