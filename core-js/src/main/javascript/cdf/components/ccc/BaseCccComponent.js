/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  '../../lib/CCC/protovis-compat!',
  'pentaho/shim/es6-promise'
], function(ChartComponent, BaseCccComponentExt, pvc, def, Modernizr, $, _, pv, Promise) {

  // ATTENTION: A part of this code is synchronized with:
  // cgg/core/src/main/javascript/pt/webdetails/cgg/resources/cdf/components/ccc/BaseCccComponent.js

  pvc.defaultCompatVersion(3);

  var DEFAULT_QUANTITATIVE_PALETTE_ID = "pentaho/visual/color/palettes/quantitativeBlue3";

  /**
   * @class cdf.components.ccc.BaseCccComponent
   * @extends cdf.components.ChartComponent
   * @ignore
   */
  return ChartComponent.extend(/** @lends cdf.components.ccc.BaseCccComponent# */{

    query: null,
    chart: null,

    /**
     * The identifier of the matching visualization view type, if any; `null` if none.
     *
     * When uninitialized, the value is `undefined`.
     *
     * @type {?string|undefined}
     * @private
     */
    __cccVizViewId: undefined,

    /**
     * Gets the identifier of the matching visualization view type, if any.
     *
     * @returns {?string} The visualization type identifier, `null` otherwise.
     * @private
     */
    __getMatchingVizViewId: function () {

      if (this.__cccVizViewId === undefined) {

        var cccClassName = def.qualNameOf(this.cccType).name;
        this.__cccVizViewId = BaseCccComponentExt.getMatchingVizViewId(cccClassName, this.chartDefinition);
      }

      return this.__cccVizViewId;
    },

    /**
     * Gets a value that indicates if the Viz. API styles should be applied.
     *
     * @type {boolean}
     * @private
     */
    __applyVizApiStyles: false,

    /**
     * Handles the chart definition and checks the compat version, and some adjustments to its chart definition
     * properties based on the compat version value
     *
     * @private
     */
    _preProcessChartDefinition: function () {

      var applyVizApiStyles = false;

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

          // Don't assume chartDef props must be own.
          for (var p in chartDef) {
            var m = /^barLine(.*)$/.exec(p);
            if (m) {
              chartDef['secondAxis' + (m[1] || '')] = chartDef[p];
              delete chartDef[p];
            }
          }
        } else if (compatVersion >= 3) {
          applyVizApiStyles = this.__getMatchingVizViewId() !== null;
        }
      }

      this.__applyVizApiStyles = applyVizApiStyles;
    },

    /**
     * The main update method of the component
     */
    update: function () {
      if (this.parameters == null) {
        this.parameters = [];
      }

      // clear placeholder
      var clear = !!this.clearsBeforePreExecution && this._getEffectiveRenderMode() === "total";
      var ph = clear ? $("#" + this.htmlObject).empty() : $("#" + this.htmlObject);
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

    /** @inheritDoc */
    renderChart: function () {
      var renderMode = this._getEffectiveRenderMode();
      var doesRenderModeLoadData = renderMode === "total" || renderMode === "partialSameMetadata";
      if(doesRenderModeLoadData) {
        this.base();
      } else {
        this.execute(_.bind(this.render, this));
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

      var extensionsPromise = this.__applyVizApiStyles
        ? BaseCccComponentExt.getExtensionsPromise(this.__getMatchingVizViewId())
        : Promise.resolve(null);

      extensionsPromise
        .then(_.bind(this._renderInner, this, data))
        .then(_.bind(this.endExec, this), _.bind(this.failExec, this));
    },

    _getEffectiveRenderMode: function() {
      return !this.chart || !this.renderMode ? "total" : this.renderMode;
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

      var renderMode = this._getEffectiveRenderMode();

      var $placeholder = this.placeholder();
      var createCanvas = $placeholder.children().length === 0;
      if(createCanvas) {
        $placeholder.append('<div id="' + this.htmlObject + 'protovis"></div>');
      }

      // Always clone the original chartDefinition.
      var cd = $.extend({}, this.chartDefinition);

      // Handle cleanups
      if (this.__applyVizApiStyles) {
        // special case for this array which $.extend does not smash
        if (cd.baseAxisLabelDesiredAngles && cd.baseAxisLabelDesiredAngles.length === 0) {
          cd.baseAxisLabelDesiredAngles = undefined;
        }

        // special case for this array which $.extend does not smash
        if (cd.orthoAxisLabelDesiredAngles && cd.orthoAxisLabelDesiredAngles.length === 0) {
          cd.orthoAxisLabelDesiredAngles = undefined;
        }
      }

      if (externalChartDefinition) {
        cd = $.extend(externalChartDefinition, cd);
      }

      // Handle overrides
      if (this.__applyVizApiStyles) {

        // Apply color scales' defaults.
        if (isArrayEmpty(cd.colors)) {

          if (isArrayEmpty(cd.continuousColorAxisColors))  {
            cd.continuousColorAxisColors = BaseCccComponentExt.getColors(DEFAULT_QUANTITATIVE_PALETTE_ID);
          }

          cd.discreteColorAxisColors = BaseCccComponentExt.getColors();
        }
      }

      cd.canvas = this.htmlObject + "protovis";

      // Process extension points
      if (cd.extensionPoints) {
        var ep = {};
        cd.extensionPoints.forEach(function(a) {
          ep[a[0]] = a[1];
        });
        cd.extensionPoints = ep;
      }

      switch (renderMode) {

        case "total":
          // Recreate the CCC chart each time.
          // Data can be completely different each time.

          // Dispose of the existing chart to not leak memory.
          if(this.chart && this.chart.dispose) {
            this.chart.dispose();
          }

          this.chart = new this.cccType(cd);

          if (arguments.length > 0) {
            this.chart.setData(data, {
              crosstabMode: this.crosstabMode,
              seriesInRows: this.seriesInRows
            });
          }

          this.chart.render();
          break;

        case "partialSameMetadata":
          // Preserve CCC chart.
          // * Reload data (must have the same metadata)
          // * Relayout
          // * Refresh interactive state
          this._updateChartOptions(cd);

          if (arguments.length > 0) {
            this.chart.setData(data);
          }

          this.chart.render({
            recreate: true,
            dataOnRecreate: this.dataAdditiveMode ? "add" : "reload"
          });
          break;

        case "partialSameData":
          // Preserve CCC chart.
          // * Relayout
          // * Refresh interactive state
          this._updateChartOptions(cd);

          this.chart.render({
            recreate: true,
            dataOnRecreate: null // do not reload data
          });
          break;

        case "partialSameLayout":
          // Preserve CCC chart.
          // * Refresh interactive state
          this._updateChartOptions(cd);

          this.chart.renderInteractive();
          break;
      }
    },

    _updateChartOptions: function(cd) {
      $.extend(true, this.chart.options, cd);
    }
  });

  function isArrayEmpty(values) {
    return values == null || values.length === 0;
  }
});
