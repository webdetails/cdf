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

define([
  './BaseComponent',
  './AnalyzerComponent.ext',
  '../Logger',
  '../lib/moment',
  '../lib/jquery',
  'amd!../lib/underscore'
], function(BaseComponent, AnalyzerComponentExt, Logger, moment, $, _) {

  var EDIT_MODE = "editor";
  var VIEW_MODE = "viewer";

  return BaseComponent.extend({
    update: function() {
      this.clear();

      var url = this._getApiUrl();

      var iframe = this.generateIframe(url);
      $("#" + this.htmlObject).html(iframe);
    },

    getOptions: function() {
      var options = {
        command: this.command != null ? this.command : "open",
        frameless: this.frameless != null ? this.frameless : false
      };

      if (this.isEditMode()) {
        options.showFieldList = this.showFieldList != null ? this.showFieldList : false;
        options.showRepositoryButtons = this.showRepositoryButtons != null ? this.showRepositoryButtons : false;
      }

      this.dateFormats = this.dateFormats || {};

      // process params and update options
      this.parameters.forEach(function(param) {
        var extractedParameter = this._extractParameter(param);

        var value = extractedParameter.value;

        var dateFormat = this.dateFormats[extractedParameter.name];
        if (dateFormat != null) {
          var formattedDate = moment(value).format(dateFormat);
          if (formattedDate !== 'Invalid date') {
            value = formattedDate;
          }
        }

        options[extractedParameter.name] = value;
      }, this);

      options.ts = new Date().getTime();

      return options;
    },

    isEditMode: function() {
      if (this.viewOnly != null) {
        return !this.viewOnly || this.editMode;
      } else {
        return this.editMode;
      }
    },

    generateIframe: function(url) {
      var iFrameId = "iframe_" + this.htmlObject;
      var iFrameStyle = "height:100%;width:100%;border:0";

      return "<iframe id ='" + iFrameId + "' src='" + url + "'"
        + " style='" + iFrameStyle + "' frameborder='0'/>";
    },

    _getApiUrl: function() {
      var mode = this.isEditMode() ? EDIT_MODE : VIEW_MODE;

      var options = this.getOptions();

      var pathSegments = {
        solution: this.solution,
        path: this.path,
        action: this.action
      };

      return AnalyzerComponentExt.getAnalyzer(pathSegments, mode, options);
    },

    _extractParameter: function(param) {
      var name = param[0];
      var value = param[1];

      var paramValue;
      try {
        paramValue = this.dashboard.getParameterValue(value);
      } catch( e ) {
        var canLogValue = !_.isObject(value) || _.isFunction(value);

        var warning = "extractParameter detected static parameter " + name
          + "=" + (canLogValue ? value : JSON.stringify(value)) + ". "
          + "The parameter will be used as value instead its value obtained from getParameterValue";

        Logger.log(warning);

        paramValue = value;
      }

      if (paramValue === undefined) {
        paramValue = value;
      }

      if(_.isFunction(paramValue)) {
        paramValue = paramValue();
      }
      return {name: name, value: paramValue};
    }
  });
});
