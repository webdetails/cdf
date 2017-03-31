/*!
 * Copyright 2002 - 2017 Webdetails, a Pentaho company. All rights reserved.
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
  '../ChartComponent',
  './BaseCccComponent.ext',
  '../../lib/CCC/pvc',
  '../../lib/CCC/def',
  '../../lib/modernizr',
  '../../lib/jquery',
  'amd!../../lib/underscore',
  '../../lib/CCC/protovis-compat!'
], function(ChartComponent, BaseCccComponentExt, pvc, def, Modernizr, $, _, pv) {

  pvc.defaultCompatVersion(3);

  /**
   * @class cdf.components.ccc.BaseCccComponent
   * @extends cdf.components.ChartComponent
   * @ignore
   */
  return ChartComponent.extend(/** @lends cdf.components.ccc.BaseCccComponent# */{

    query: null,
    chart: null,

    /**
     * The variable to hold the ccc visualization type name
     */
    _cccVizName: null,

    /**
     * Gets and assigns the Ccc Visualization name
     *
     * @returns {String|undefined} The Viz Type name if it is a valid visualization, undefined otherwise
     */
    getCccVisualizationName: function () {
      if (!this._cccVizName && this.cccType) {
        this._cccVizName = BaseCccComponentExt.getVizDigestedName(def.qualNameOf(this.cccType).name, this.chartDefinition);
      }
      return this._cccVizName;
    },

    /**
     * Handles the chart definition and checks the compat version, and some adjustments to its chart definition
     * properties based on the compat version value
     *
     * @private
     */
    _preProcessChartDefinition: function () {
      var chartDef = this.chartDefinition;
      if (chartDef) {
        // Obtain effective compatVersion
        var compatVersion = chartDef.compatVersion;
        if (compatVersion == null) {
          compatVersion = typeof pvc.defaultCompatVersion === 'function'
              ? pvc.defaultCompatVersion()
              : 1;
        }

        if (compatVersion <= 1) {
          // Properties that are no more registered in the component
          // and that had a name mapping.
          // The default mapping, for unknown properties, doesn't work.
          if ('showLegend' in chartDef) {
            chartDef.legend = chartDef.showLegend;
            delete chartDef.showLegend;
          }

          // Don't presume chartDef props must be own
          for (var p in chartDef) {
            var m = /^barLine(.*)$/.exec(p);
            if (m) {
              chartDef['secondAxis' + (m[1] || '')] = chartDef[p];
              delete chartDef[p];
            }
          }
        } else if (compatVersion >= 3) {
          this._vizApiStyles = BaseCccComponentExt.isValidVisualization(this.getCccVisualizationName());
        }
      }
    },

    /**
     * The main update method of the component
     */
    update: function () {
      if (this.parameters == null) {
        this.parameters = [];
      }

      // clear placeholder
      var ph = $("#" + this.htmlObject).empty();
      var me = this;

      // Set up defaults for height and width
      if (typeof(this.chartDefinition.width) === "undefined") {
        this.chartDefinition.width = ph.width();
      }

      if (typeof(this.chartDefinition.height) === "undefined") {
        this.chartDefinition.height = ph.height();
      }

      if (typeof Modernizr !== 'undefined' && Modernizr.svg) {
        this.renderChart();
      } else {
        pv.listenForPageLoad(function () {
          me.renderChart();
        });
      }
    },

    /**
     * Picks the data and renders the chart, either applying the Viz Api definitions (if it is enabled) or runs the
     * render without those extensions
     *
     * @param {Object} data The result set to render
     */
    render: function (data) {
      this._preProcessChartDefinition();

      BaseCccComponentExt.getExtensionsPromise(this.getCccVisualizationName(), this._vizApiStyles)
          .then(_.bind(this._renderInner, this, data))
          .then(_.bind(this.endExec, this), _.bind(this.failExec, this));
    },

    /**
     * The internal render function, which creates the html object, extends the chart definitions, applies colors
     * and starts the ccc render for a given visualization type
     *
     * @param {Object} data The result set to render
     * @param {Object} [externalChartDefinition] The extensions to apply to the chart render
     * @private
     */
    _renderInner: function (data, externalChartDefinition) {
      $("#" + this.htmlObject).append('<div id="' + this.htmlObject + 'protovis"></div>');

      // Always clone the original chartDefinition.
      var cd = $.extend({}, this.chartDefinition);

      // Handle cleanups
      if (this._vizApiStyles) {
        // special case for this array which $.extend does not smash
        if (cd.baseAxisLabelDesiredAngles && cd.baseAxisLabelDesiredAngles.length == 0) {
          cd.baseAxisLabelDesiredAngles = undefined;
        }

        // special case for this array which $.extend does not smash
        if (cd.orthoAxisLabelDesiredAngles && cd.orthoAxisLabelDesiredAngles.length == 0) {
          cd.orthoAxisLabelDesiredAngles = undefined;
        }
      }

      if (externalChartDefinition) {
        cd = $.extend(externalChartDefinition, cd);
      }

      // Handle overrides
      if (this._vizApiStyles) {
        // apply colors if that is intended
        if (!cd.colors || (cd.colors && cd.colors.length == 0)) {
          cd.continuousColorAxisColors = BaseCccComponentExt.getColors("blue-3");
          cd.discreteColorAxisColors = BaseCccComponentExt.getColors();
        }
      }

      cd.canvas = this.htmlObject + "protovis";

      // Process extension points
      if (cd.extensionPoints) {
        var ep = {};
        cd.extensionPoints.forEach(function(a){
          ep[a[0]] = a[1];
        });
        cd.extensionPoints = ep;
      }

      this.chart = new this.cccType(cd);

      if (arguments.length > 0) {
        this.chart.setData(data, {
          crosstabMode: this.crosstabMode,
          seriesInRows: this.seriesInRows
        });
      }

      this.chart.render();
    }
  });

});
