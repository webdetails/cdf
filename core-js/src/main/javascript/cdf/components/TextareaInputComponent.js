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

define(["../lib/jquery", "./BaseComponent"], function($, BaseComponent) {

  var TextareaInputComponent = BaseComponent.extend({
    update: function() {
      var myself = this;
      var name = myself.name;

      var selectHTML = "<textarea id='" + name + "' name='" + name +
        (myself.numRows ? ("' rows='" + myself.numRows) : "") +
        (myself.numColumns ? ("' cols='" + myself.numColumns) : "") +
        "'>" + myself.dashboard.getParameterValue(myself.parameter) + '</textarea>';

      myself.placeholder().html(selectHTML);

      var el = $("#" + name);

      el.change(function() {
        if(myself.dashboard.getParameterValue(myself.parameter) !== el.val()) {
          myself.dashboard.processChange(name);
        }
      });
    },

    getValue: function() {
      return $("#" + this.name).val();
    }
  });

  return TextareaInputComponent;
});
