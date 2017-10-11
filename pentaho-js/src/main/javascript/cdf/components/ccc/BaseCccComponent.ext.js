/*!
 * Copyright 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  '../../PentahoTypeContext',
  'amd!../../lib/underscore',
  '../../lib/jquery',
  'pentaho/shim/es6-promise'
], function(PentahoTypeContext, _, $, Promise){

  /**
   * The Regex to extract the chart type from its ccc visualization type
   *
   * @type {RegExp}
   * @private
   */
  var _reCccName = /^(.*)Chart$/;

  var _context = PentahoTypeContext.getInstance();

  /**
   * List of viz types to exclude from the Viz Api chart defaults
   *
   * @type {String[]}
   * @private
   */
  var _chartTypesBlackList = ['bullet'];

  /**
   * List of viz types to exclude from the form verification
   *
   * @type {String[]}
   * @private
   */
  var _chartFormExceptions = ['waterfall', 'treemap', 'boxplot', 'heatGrid', 'line', 'scatter', 'pie', 'pointAbstract', 'sunburst'];

  /**
   * List of viz types to do not apply normalized to the viz type name
   *
   * @type {String[]}
   * @private
   */
  var _valuesNormalizedExceptions = ['barNormalized', 'area', 'areaStacked'];

  /**
   * List of viz types to do not apply stacked to the viz type name
   *
   * @type {String[]}
   * @private
   */
  var _stackedExceptions = ['barNormalized', 'areaStacked'];

  /**
   * List of viz types to do not apply orientation to the viz type name
   *
   * @type {String[]}
   * @private
   */
  var _orientationException = ['area', 'areaStacked'];

  /**
   * Gets a raw visualization type name and digests that returning a valid name to be used to fetch the
   * visualization type extension defaults
   *
   * @param {String} name The raw name of the visualization
   * @param {Object} chartDefinition The chart definition to use as source of information
   * @returns {String|undefined} The digested visualization type name or undefined if it is an invalid name
   * @private
   */
  var getVizDigestedName = function (name, chartDefinition) {
    var fullName;

    var m = _reCccName.exec(name);
    if (m) {
      fullName = m[1].charAt(0).toLowerCase() + m[1].substr(1);
    } else {
      return;
    }

    // transformations
    switch (fullName) {
      case 'metricDot':
        fullName = 'bubble';
        break;
      case 'metricLine':
        fullName = 'scatter';
        break;
      case 'normalizedBar':
        fullName = 'barNormalized';
        break;
      case 'dot':
      case 'stackedDot':
        fullName = 'pointAbstract';
        break;
      case 'stackedLine':
        fullName = 'line';
        break;
      case 'stackedArea':
        fullName = 'areaStacked';
        break;
    }

    if (chartDefinition && !_.contains(_chartFormExceptions, fullName)) {
      if (chartDefinition.valuesNormalized && !_.contains(_valuesNormalizedExceptions, fullName)) {
        fullName += 'Normalized';
      }
      if (chartDefinition.stacked && !_.contains(_stackedExceptions, fullName)) {
        fullName += 'Stacked';
      }
      if ((chartDefinition.orientation || '').toLowerCase() === 'horizontal'
          && !_.contains(_orientationException, fullName)) {
        fullName += 'Horizontal';
      }
    }

    return fullName;
  };

  /**
   * Checks if the Viz Api Visualization type extensions should be applied, based on its name, if the compat
   * version is 3 and if it is a valid visualization type
   *
   * @param {String} name The Visualization Type Name
   * @returns {Boolean} True if the Viz Api Visualization Type extensions should be applied, False otherwise
   */
  var isValidVisualization = function (name) {
    return !!name && name != '' && !_.contains(_chartTypesBlackList, name);
  };

  /**
   * Gets a Promise with the Visualization Type Extensions ready to be used when it is resolved
   *
   * @param {String} name The Visualization Type Name
   * @param {Boolean} applyVizApiStyles True If the viz api styles should be applied, False otherwise
   * @returns {Promise} A Promise with the Visualization Type Extensions when it is resolved
   */
  var getExtensionsPromise = function (name, applyVizApiStyles) {
    if (!!applyVizApiStyles) {
      return _context.getAsync('pentaho/ccc/visual/' + name).then(function (View) {
        return $.extend({}, View.type.extensionEffective);
      });
    } else {
      // no external extensions
      return Promise.resolve(null);
    }
  };

  /**
   * Gets the Colors Array Registered in the Palette
   *
   * @param {String} [colorPalette] The color palette to retrieve. By default all colors are returned
   * @returns {Array} The Array with the registered colors
   */
  var getColors = function (colorPalette) {
    var palette;
    if(!colorPalette) {
      palette = _context.instances.getByType("pentaho/visual/color/palette", {
        filter: function(onePalette) {
          return onePalette.level === "nominal";
        }
      });
    } else {
      palette = _context.instances.getById(colorPalette);
    }

    return palette.colors.toArray().map(function(color) { return color.value; });
  };

  return {
    getVizDigestedName: getVizDigestedName,
    isValidVisualization: isValidVisualization,
    getExtensionsPromise: getExtensionsPromise,
    getColors: getColors
  }
});
