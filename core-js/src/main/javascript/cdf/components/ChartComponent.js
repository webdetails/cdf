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
  '../dashboard/Utils',
  './UnmanagedComponent',
  './ChartComponent.ext',
  './CggComponent.ext',
  '../lib/jquery',
  'amd!../lib/underscore'
], function (Utils, UnmanagedComponent, ChartComponentExt, CggComponentExt, $, _) {

  return UnmanagedComponent.extend({
    exportChart: function (outputType, overrides) {
      var me = this;

      var buildUrlParameters = function (overrides) {
        overrides = overrides || {};

        var urlParams = {};

        // Pass the parameters defined in this component to the used data source.
        var paramDefsArray = me.parameters;
        if (paramDefsArray && paramDefsArray.length) {
          var paramDefs = $.extend({}, Utils.propertiesArrayToObject(paramDefsArray), overrides);
          for (var name in paramDefs) {
            if (paramDefs.hasOwnProperty(name)) {
              // Works with eval ...
              var value = this.dashboard.getParameterValue(paramDefs[name]);
              if ($.isArray(value) && value.length == 1 && ('' + value[0]).indexOf(';') >= 0) {
                // Special case where single element will wrongly be treated as a parsable array by cda
                value = Utils.doCsvQuoting(value[0], ';');
              }
              //else Will not be correctly handled for functions that return arrays

              if (typeof value === 'function') {
                value = value();
              }

              urlParams['param' + name] = value;
            }
          }
        }

        // Check debug level and pass as parameter
        var level = me.dashboard.debug;
        if (level > 1) {
          urlParams.paramdebug = true;
          urlParams.paramdebugLevel = level;
        }

        var scriptName = me.name.replace(/render_/, '');

        urlParams.script = ChartComponentExt.getCccScriptPath(scriptName);

        urlParams.attachmentName = scriptName;

        return urlParams;
      };

      var urlParams = buildUrlParameters(overrides);
      urlParams.outputType = outputType || 'png';

      var url = CggComponentExt.getCggDrawUrl() + "?" + $.param(urlParams, /* traditional */true);

      var $exportIFrame = $('#cccExportIFrame');
      if (!$exportIFrame.length) {
        $exportIFrame = $('<iframe id="cccExportIFrame" style="display:none">');
        $exportIFrame[0].src = url;
        $exportIFrame.appendTo($('body'));
      } else {
        $exportIFrame[0].src = url;
      }
    },

    renderChart: function () {
      var cd = this.chartDefinition;

      if (this.dashboard.isValidQueryDefinition(cd)) {
        this.beginQuery(cd, _.bind(this.render, this));
      } else if (this.valuesArray != undefined) {
        this.execute(_.bind(function () {
          this.render(this.valuesArray);
        }, this));
      } else {
        // initialize the component only
        this.execute(_.bind(this.render, this));
      }
    }
  });

});
