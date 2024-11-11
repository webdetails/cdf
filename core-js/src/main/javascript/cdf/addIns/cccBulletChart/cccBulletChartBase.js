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
  "../../lib/CCC/pvc",
  "../../lib/jquery"
], function(pvc, $) {

  return {
    name: "cccBulletChart",
    label: "CCC Bullet Chart",
    defaults: {
      chartOptions: {
        height: 40,
        animate: false,
        orientation: "horizontal",
        bulletSize: 16,     // Bullet height
        bulletSpacing: 150, // Spacing between bullets
        bulletMargin: 5,   // Left margin
        // Specific values
        bulletRanges: [30, 80, 100],
        extensionPoints: {
          "bulletMarker_shape": "triangle",
          "bulletTitle_textStyle": "green",
          "bulletMeasure_fillStyle": "black",
          "bulletRuleLabel_font": "8px sans-serif",
          "bulletRule_height": 5
        }
      },
      cssClass: 'cccBulletChartContainer',
      layout: '<span></span>'
    },

    init: function() { },

    sort: function() { },

    implementation: function(tgt, st, opt) {
      var chartOptions = opt.chartOptions,
          $html = $(opt.layout).addClass(opt.cssClass),
          $tgt = $(tgt).empty().append($html),
          values = st.value.split(",");

      chartOptions.canvas = $html.get(0);
      chartOptions.width = chartOptions.width || $tgt.width();
      chartOptions.bulletMeasures = [values[0]];
      chartOptions.bulletMarkers = [values[1]];

      var chart = new pvc.BulletChart(chartOptions);
      chart.setData(this.getData(values), {});
      chart.render();
    },

    getData: function(values) {
      var dataSet = {resultset: [values], metadata: []};

      for(var i = 0, L = values.length; i < L; i++) {
        dataSet.metadata.push({colIndex: i, colType: "String", colName: ""});
      }
      return dataSet;
    }
  };
});
