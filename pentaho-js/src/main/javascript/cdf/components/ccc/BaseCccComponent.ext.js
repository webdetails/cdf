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
  "require",
  'pentaho/module/instancesOf!pentaho/visual/color/Palette',
  'amd!../../lib/underscore',
  '../../lib/jquery',
  'pentaho/shim/es6-promise'
], function(localRequire, allPalettes, _, $, Promise) {

  var defaultNominalPalette = getFirstNominalPalette();

  // Release memory.
  allPalettes = null;

  /**
   * The RegExp to extract a clean CCC chart class name from its somewhat already cleaned CCC class name...
   *
   * Example: "BarChart" -> "Bar".
   *
   * @type {RegExp}
   * @private
   */
  var __reCccClassName = /^(.*)Chart$/;

  /**
   * List of chart types for which there is no corresponding visualization type.
   *
   * @type {string[]}
   * @private
   */
  var __chartTypesBlackList = ['Bullet'];

  /**
   * List of chart types to exclude from the form verification.
   *
   * @type {string[]}
   * @private
   */
  var __chartFormExceptions = [
    'Waterfall', 'Treemap', 'Boxplot', 'HeatGrid', 'Scatter',
    'Bubble', 'Pie', 'PointAbstract', 'Sunburst', 'Dot'
  ];

  /**
   * List of chart types for which `Normalized` should not be applied to the viz view identifier.
   *
   * @type {string[]}
   * @private
   */
  var __valuesNormalizedExceptions = ['BarNormalized', 'Area', 'AreaStacked', 'Line', 'LineStacked'];

  /**
   * List of chart types for which `Stacked` should not be applied to the viz view identifier.
   *
   * @type {string[]}
   * @private
   */
  var __stackedExceptions = ['BarNormalized', 'AreaStacked', 'LineStacked'];

  /**
   * List of chart types for which the orientation modifier should not be applied to the viz view identifier.
   *
   * @type {string[]}
   * @private
   */
  var __orientationException = ['Area', 'AreaStacked', 'Line', 'LineStacked'];

  return {
    getMatchingVizViewId: getMatchingVizViewId,
    getExtensionsPromise: getExtensionsPromise,
    getColors: getColors
  };

  /**
   * Gets the identifier of the visualization view associated with a given CCC chart class name.
   *
   * @param {string} name - The CCC chart class name.
   * @param {?object} chartDefinition - The component's chart definition object.
   * @returns {?string} The identifier of the visualization view, if any; `null` if none.
   */
  function getMatchingVizViewId(name, chartDefinition) {

    var match = __reCccClassName.exec(name);
    if (!match) {
      return null;
    }

    var fullName = match[1];

    if (_.contains(__chartTypesBlackList, fullName)) {
      return null;
    }

    // transformations
    switch (fullName) {
      case 'MetricDot':
        fullName = 'Bubble';
        break;
      case 'MetricLine':
        fullName = 'Scatter';
        break;
      case 'NormalizedBar':
        fullName = 'BarNormalized';
        break;
      case 'StackedDot':
        fullName = 'Dot';
        break;
      case 'StackedLine':
        fullName = 'LineStacked';
        break;
      case 'StackedArea':
        fullName = 'AreaStacked';
        break;
    }

    if (chartDefinition != null && !_.contains(__chartFormExceptions, fullName)) {
      // Line*, Area*, Bar*
      if (chartDefinition.valuesNormalized && !_.contains(__valuesNormalizedExceptions, fullName)) {
        fullName += 'Normalized';
      }

      if (chartDefinition.stacked && !_.contains(__stackedExceptions, fullName)) {
        fullName += 'Stacked';
      }

      var orientation = (chartDefinition.orientation || '').toLowerCase();
      if (orientation === 'horizontal' && !_.contains(__orientationException, fullName)) {
        fullName += 'Horizontal';
      }
    }

    return 'pentaho/ccc/visual/' + fullName;
  }

  /**
   * Gets a promise for the extensions object of a visualization view type.
   *
   * @param {string} vizViewId - The identifier of the visualization view type.
   * @returns {Promise.<Object>} A promise for its extensions object.
   */
  function getExtensionsPromise(vizViewId) {
    return new Promise(function(resolve, reject) {

      localRequire([vizViewId], function(View) {

        var extension = $.extend({}, View.prototype.extensionEffective);
        resolve(extension);

      }, reject);
    });
  }

  /**
   * Gets the array of color values of a registered palette, given its identifier, or,
   * when unspecified, those of the default nominal palette.
   *
   * @param {?string} [colorPaletteId] The identifier of the color palette.
   *
   * @returns {string[]} An array of color values.
   */
  function getColors(colorPaletteId) {
    var palette;
    if(colorPaletteId == null) {
      palette = defaultNominalPalette;
    } else {
      palette = localRequire(colorPaletteId);
    }

    // Extract the color values.
    return palette.colors.toArray().map(function (color) { return color.value; });
  }

  /**
   * Gets the first palette of a `nominal` level, if there is one.
   *
   * @returns {?pentaho.visual.color.Palette} The first nominal palette, or `null`.
   */
  function getFirstNominalPalette () {

    var nominalPalettes = allPalettes.filter(function (onePalette) {
      return onePalette.level === "nominal";
    });

    return nominalPalettes.length > 0 ? nominalPalettes[0] : null;
  }
});
