/*!
 * Copyright 2017 Webdetails, a Pentaho company. All rights reserved.
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
  'cdf/components/ccc/BaseCccComponent.ext'
], function (BaseCccComponentExt) {

  /**
   * ## The Base Ccc Component Ext
   */
  describe("The Base Ccc Component Ext #", function () {
    it("Gets the correct Visualization Digested Name", function () {
      expect(BaseCccComponentExt.getVizDigestedName('', {})).toBeUndefined();
      expect(BaseCccComponentExt.getVizDigestedName('dummyChart', {})).toBe('dummy');
      expect(BaseCccComponentExt.getVizDigestedName('dummyChrt', {})).toBeUndefined();
      expect(BaseCccComponentExt.getVizDigestedName('metricDotChart', {})).toBe('bubble');
      expect(BaseCccComponentExt.getVizDigestedName('metricLineChart', {})).toBe('scatter');
      expect(BaseCccComponentExt.getVizDigestedName('metricLineChart', {
        stacked: true
      })).toBe('scatter');
      expect(BaseCccComponentExt.getVizDigestedName('normalizedBarChart', {})).toBe('barNormalized');
      expect(BaseCccComponentExt.getVizDigestedName('dotChart', {})).toBe('pointAbstract');
      expect(BaseCccComponentExt.getVizDigestedName('dotChart', {
        stacked: true
      })).toBe('pointAbstract');
      expect(BaseCccComponentExt.getVizDigestedName('stackedDotChart', {})).toBe('pointAbstract');
      expect(BaseCccComponentExt.getVizDigestedName('stackedDotChart', {
        stacked: true
      })).toBe('pointAbstract');
      expect(BaseCccComponentExt.getVizDigestedName('stackedLineChart', {})).toBe('line');
      expect(BaseCccComponentExt.getVizDigestedName('areaChart', {})).toBe('areaStacked');
      expect(BaseCccComponentExt.getVizDigestedName('areaChart', {
        stacked: true
      })).toBe('areaStacked');
      expect(BaseCccComponentExt.getVizDigestedName('stackedAreaChart', {})).toBe('areaStacked');
      expect(BaseCccComponentExt.getVizDigestedName('stackedAreaChart', {
        stacked: true
      })).toBe('areaStacked');

      expect(BaseCccComponentExt.getVizDigestedName('heatGridChart', {})).toBe('heatGrid');
      expect(BaseCccComponentExt.getVizDigestedName('heatGridChart', {
        stacked: true
      })).toBe('heatGrid');

      expect(BaseCccComponentExt.getVizDigestedName('lineChart', {})).toBe('line');
      expect(BaseCccComponentExt.getVizDigestedName('lineChart', {
        stacked: true
      })).toBe('line');

      expect(BaseCccComponentExt.getVizDigestedName('pieChart', {})).toBe('pie');
      expect(BaseCccComponentExt.getVizDigestedName('pieChart', {
        stacked: true
      })).toBe('pie');

      expect(BaseCccComponentExt.getVizDigestedName('sunburstChart', {})).toBe('sunburst');
      expect(BaseCccComponentExt.getVizDigestedName('sunburstChart', {
        stacked: true
      })).toBe('sunburst');

      expect(BaseCccComponentExt.getVizDigestedName('barChart', {})).toBe('bar');
      expect(BaseCccComponentExt.getVizDigestedName('barChart', {
        valuesNormalized: true
      })).toBe('barNormalized');
      expect(BaseCccComponentExt.getVizDigestedName('barChart', {
        stacked: true
      })).toBe('barStacked');
      expect(BaseCccComponentExt.getVizDigestedName('barChart', {
        stacked: true,
        orientation: 'vertical'
      })).toBe('barStacked');
      expect(BaseCccComponentExt.getVizDigestedName('barChart', {
        stacked: true,
        orientation: 'horizontal'
      })).toBe('barStackedHorizontal');


    });

    it("Gets the boolean describing if the Visualization is valid", function () {
      expect(BaseCccComponentExt.isValidVisualization(undefined)).toBeFalsy();
      expect(BaseCccComponentExt.isValidVisualization(null)).toBeFalsy();
      expect(BaseCccComponentExt.isValidVisualization('')).toBeFalsy();
      expect(BaseCccComponentExt.isValidVisualization('boxplot')).toBeFalsy();
      expect(BaseCccComponentExt.isValidVisualization('bullet')).toBeFalsy();
      expect(BaseCccComponentExt.isValidVisualization('treemap')).toBeFalsy();
      expect(BaseCccComponentExt.isValidVisualization('waterfall')).toBeFalsy();

      expect(BaseCccComponentExt.isValidVisualization('dummyChart')).toBeTruthy();
    });

    it("Gets the correct Promise and Visualization extension as null when no vizapi styles are on", function (done) {
      var returnedPromise = BaseCccComponentExt.getExtensionsPromise("", false);
      expect(returnedPromise).toBeDefined();

      returnedPromise.then(function (extension) {
        expect(extension).toBeNull();
        done();
      });
    });

    it("Gets the correct Promise and the Visualization Extension", function (done) {
      var returnedPromise = BaseCccComponentExt.getExtensionsPromise("", true);
      expect(returnedPromise).toBeDefined();

      returnedPromise.then(function(extension){
        expect(extension).toBeDefined();
        expect(extension.definition).toBe('dummy');
        done();
      });
    })

    it("Gets the correct colors", function () {
      expect(BaseCccComponentExt.getColors()[0]).toBe('dummy');
    });
  });

});
