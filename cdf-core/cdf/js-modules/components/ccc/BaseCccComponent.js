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
  './ChartComponent',
  '../lib/CCC/pvc',
  '../lib/modernizr',
  '../lib/jquery',
  '../lib/CCC/protovis-compat!'
], function(ChartComponent, pvc, Modernizr, $, pv) {

  pvc.defaultCompatVersion(2);

  var BaseCccComponent = ChartComponent.extend({

    query: null,
    chart: null,

    _preProcessChartDefinition: function() {
      var chartDef = this.chartDefinition;
      if(chartDef) {
        // Obtain effective compatVersion
        var compatVersion = chartDef.compatVersion;
        if(compatVersion == null) {
          compatVersion = typeof pvc.defaultCompatVersion === 'function'
            ? pvc.defaultCompatVersion()
            : 1;
        }

        if(compatVersion <= 1) {
          // Properties that are no more registered in the component
          // and that had a name mapping.
          // The default mapping, for unknown properties, doesn't work.
          if('showLegend' in chartDef) {
            chartDef.legend = chartDef.showLegend;
            delete chartDef.showLegend;
          }

          // Don't presume chartDef props must be own
          for(var p in chartDef) {
            var m = /^barLine(.*)$/.exec(p);
            if(m) {
              chartDef['secondAxis' + (m[1] || '')] = chartDef[p];
              delete chartDef[p];
            }
          }
        }
      }
    },

    update: function() {
      if(this.parameters == null) {
        this.parameters = [];
      }

      // clear placeholder
      var ph = $("#" + this.htmlObject).empty();
      var me = this;

      // Set up defaults for height and width
      if(typeof(this.chartDefinition.width) === "undefined") {
        this.chartDefinition.width = ph.width();
      }

      if(typeof(this.chartDefinition.height) === "undefined") {
        this.chartDefinition.height = ph.height();
      }

      if(typeof Modernizr !== 'undefined' && Modernizr.svg) {
        this.renderChart();
      } else {
        pv.listenForPageLoad(function() {
          me.renderChart();
        });
      }
    },

    render: function(values) {

      $("#" + this.htmlObject).append('<div id="' + this.htmlObject + 'protovis"></div>');

      this._preProcessChartDefinition();

      var o = $.extend({}, this.chartDefinition);
      o.canvas = this.htmlObject + 'protovis';
      // Extension points
      if(typeof o.extensionPoints != "undefined") {
        var ep = {};
        o.extensionPoints.forEach(function(a) {
          ep[a[0]] = a[1];
        });
        o.extensionPoints = ep;
      }

      this.chart =  new this.cccType(o);
      if(arguments.length > 0) {
        this.chart.setData(
          values,
          {
            crosstabMode: this.crosstabMode,
            seriesInRows: this.seriesInRows
          });
      }
      this.chart.render();
    }
  });

  return BaseCccComponent;

});
