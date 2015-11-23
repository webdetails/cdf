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
  './JFreeChartComponent.ext',
  '../lib/jquery',
  './JFreeChartComponent'
], function(JFreeChartComponentExt, $, JFreeChartComponent) {

  var OpenFlashChartComponent = JFreeChartComponent.extend({

    callPentahoAction: function() {

      this.dashboard.incrementRunningCalls();

      var myself = this,
          getDataFunction;

      this.dashboard.callPentahoAction(myself, "system", "pentaho-cdf/actions", "openflashchart.xaction", this.getParameters(), function(jXML) {

        if(jXML != null) {
          var result = JFreeChartComponentExt.getOpenFlashChart(jXML.find("ExecuteActivityResponse:first-child").text());
          getDataFunction = result.match(/getData.*\(\)/gi);
          $("#" + myself.htmlObject).html(result);
        }

        myself.dashboard.decrementRunningCalls();

      });

      OpenFlashChartComponent.prototype.onClick = function(value) {
        if(getDataFunction != null && myself.chartDefinition.urlTemplate != undefined && myself.chartDefinition.parameterName != undefined) {
          myself.data = myself.data != undefined ? myself.data : eval('(' + eval(getDataFunction[0]) + ')');
          if(myself.data.x_axis != undefined) {
            var urlTemplate = myself.chartDefinition.urlTemplate.replace("{" + myself.chartDefinition.parameterName + "}", myself.data.x_axis.labels.labels[value]);
            eval(urlTemplate);
          }
        }
      };
    }
  });

  return OpenFlashChartComponent;

});
