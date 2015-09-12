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
    '../dashboard/Utils',
    './UnmanagedComponent',
    './ChartComponent.ext',
    './CggComponent.ext',
    '../lib/jquery',
    'amd!../lib/underscore'],
  function(Utils, UnmanagedComponent, ChartComponentExt, CggComponentExt, $, _) {

  var ChartComponent = UnmanagedComponent.extend({
    exportChart: function(outputType, overrides) {
      var me = this;

      var buildUrlParameters = function(overrides) {
        overrides = overrides || {};

        var urlParams = {};

        // Pass the parameters defined in this component to the used data source.
        var paramDefsArray = me.parameters;
        if(paramDefsArray && paramDefsArray.length) {
          var paramDefs = $.extend({}, Utils.propertiesArrayToObject(paramDefsArray), overrides);
          for(var name in paramDefs) {
            if(paramDefs.hasOwnProperty(name)) {
              // Works with eval ...
              var value = this.dashboard.getParameterValue(paramDefs[name]);
              if($.isArray(value) && value.length == 1 && ('' + value[0]).indexOf(';') >= 0) {
                // Special case where single element will wrongly be treated as a parsable array by cda
                value = Utils.doCsvQuoting(value[0],';');
              }
              //else Will not be correctly handled for functions that return arrays

              if(typeof value == 'function') { value = value(); }

              urlParams['param' + name] = value;
            }
          }
        }

        // Check debug level and pass as parameter
        var level = me.dashboard.debug;
        if(level > 1) {
          urlParams.paramdebug = true;
          urlParams.paramdebugLevel = level;
        }

        var scriptName =  me.name.replace(/render_/, '');

        urlParams.script = ChartComponentExt.getCccScriptPath(scriptName);

        urlParams.attachmentName = scriptName;

        return urlParams;
      };

      var urlParams = buildUrlParameters(overrides);
      urlParams.outputType = outputType || 'png';

      var url = CggComponentExt.getCggDrawUrl() + "?" + $.param(urlParams);

      var $exportIFrame = $('#cccExportIFrame');
      if(!$exportIFrame.length) {
        $exportIFrame = $('<iframe id="cccExportIFrame" style="display:none">');
        $exportIFrame[0].src = url;
        $exportIFrame.appendTo($('body'));
      } else {
        $exportIFrame[0].src = url;
      }
    },

    renderChart: function() {
      var cd = this.chartDefinition;

      // check if we should use a data source
      if(_.isString(cd.dataSource) && !_.isEmpty(cd.dataSource)) {
        // merge options, query definition options override options duplicated in the data source
        cd = _.extend({}, this.dashboard.getDataSource(cd.dataSource), cd);
        // remove the data source name from the query definition
        delete cd.dataSource;
      }

      if(cd.dataAccessId || cd.query || cd.endpoint /*cpk*/) {
        this.triggerQuery(cd, _.bind(this.render, this));
      } else if(this.valuesArray != undefined) {
        this.synchronous(_.bind(function() { this.render(this.valuesArray); }, this));
      } else {
        // initialize the component only
        this.synchronous(_.bind(this.render, this));
      }
    }
  });

  return ChartComponent;

});
