/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

define(["../lib/jquery", "./BaseComponent"], function($, BaseComponent) {

  return BaseComponent.extend({
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

});
