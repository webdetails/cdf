/*!
* Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

define(["../lib/jquery", "./BaseComponent"], function ($, BaseComponent) {

  var TextInputComponent = BaseComponent.extend({
    update: function() {
      var value;
      var myself = this;
      var selectHTML = "<input type='text' id='" + myself.name +
        "' name='"  + myself.name +
        "' value='" + myself.dashboard.getParameterValue(myself.parameter) +
        (myself.size ? ("' size='" + myself.size) : "") +
        (myself.maxLength ? ("' maxlength='" + myself.maxLength) : "") + "'>";

      myself.placeholder().html(selectHTML);

      $("#" + myself.name)
        .change(function() {
          if(myself.dashboard.getParameterValue(myself.parameter) === $("#"+myself.name).val()) {
            return;
          }
          myself.dashboard.processChange(myself.name);
        })
        .keyup(function(ev) {
          if(ev.keyCode == 13) {
            if(myself.dashboard.getParameterValue(myself.parameter) === $("#"+myself.name).val()) {
              return;
            }
            myself.dashboard.processChange(myself.name);
          }
        });

      myself._doAutoFocus();
    },
    getValue : function() {
      return $("#"+this.name).val();
    }
  });

  return TextInputComponent;

});
