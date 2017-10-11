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
  '../../../AddIn',
  '../../../Dashboard',
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../../../lib/CCC/pvc',
], function(AddIn, Dashboard, $, _, pvc) {

  var cccChart = new AddIn({

    name: "cccChart",
    label: "cccChart",

    defaults: {
      type: 'BarChart',
      chartOpts: {
        compatVersion: 2,
        height: 100,
        animate: false,
        crosstabMode: false,
        seriesInRows: false,
        timeSeries: false,
      },

      transformData: function(data) {
        var result = {metadata: [], resultset: []};
        try {
          data = JSON.parse(data);
          var colMetadata = [];
          _.each(data, function(row, index) {
            if(index == 0) {
              _.each(row, function(col, index) {
                result.metadata.push({colIndex: index, colName: "Col" + index, colType: "String"});
              });
            }
            result.resultset.push(row);
          });
        } catch(e) {
          return null;
        }
        return result;
      },
      layout: '<span></span>',
      cssClass: 'cccChartContainer',
    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      var data = _.isFunction(opt.transformData) ? opt.transformData(st.value) : st.value;
          $tgt = $(tgt).empty().append($(opt.layout).addClass(opt.cssClass).append(data));

      if(data) {
        opt.chartOpts.canvas = $tgt.get(0);
        opt.chartOpts.width = opt.width || $tgt.width();
        opt.chartOpts.bulletMeasures = [data[0]];
        opt.chartOpts.bulletMarkers = [data[1]];
        var chart = new pvc[opt.type](opt.chartOpts);
        chart.setData(data, {});
        chart.render();
      }
    }
  });

  Dashboard.registerGlobalAddIn("Template", "templateType", cccChart);

  return cccChart;
});
