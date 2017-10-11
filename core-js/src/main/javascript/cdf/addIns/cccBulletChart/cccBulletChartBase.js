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
