/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  "../lib/jquery",
  "./BaseComponent",
  "../Logger"
], function($, BaseComponent, Logger) {

  return BaseComponent.extend({
    update: function() {
      var myself = this;

      myself._addHtmlToPlaceholder();

      // Format param value to be displayed.
      var el = $("#" + myself.name);
      var paramValue = myself.dashboard.getParameterValue(myself.parameter);
      var uiValue = myself._formatValue(paramValue);
      el.val(uiValue);

      el.change(function() {
        var newParamValue = myself.getValue();
        if(myself.dashboard.getParameterValue(myself.parameter) !== newParamValue) {
          // User can introduced non-formatted data,
          // thus we need to ensure that data is formatted.
          var uiValue = myself._formatValue(newParamValue);
          el.val(uiValue);

          myself.dashboard.processChange(myself.name);
        }
      }).keyup(function(ev) {
        var newParamValue = myself.getValue();
        if(ev.keyCode == 13 && myself.dashboard.getParameterValue(myself.parameter) !== newParamValue) {
          // User can introduced non-formatted data,
          // thus we need to ensure that data is formatted.
          var uiValue = myself._formatValue(newParamValue);
          el.val(uiValue);

          myself.dashboard.processChange(myself.name);
        }
      });

      myself._doAutoFocus();
    },

    getValue: function() {
      var value = $("#" + this.name).val();
      // If value is formatted, remove mask.
      return this._parseValue(value);
    },

    /**
     * Formats a given value for user presentation.
     *
     * @param {*} value - The value to format.
     * @return {string} The formatted value.
     * @protected
     */
    _formatValue: function(value) {
      return value;
    },

    /**
     * Parses a given formatted value.
     *
     * The parser should be lenient in case a
     * non-formatted value is given.
     *
     * @param {string} uiValue - The value to parse.
     * @return {*} The parsed value.
     * @protected
     */
    _parseValue: function(value) {
      return value;
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
