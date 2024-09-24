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
