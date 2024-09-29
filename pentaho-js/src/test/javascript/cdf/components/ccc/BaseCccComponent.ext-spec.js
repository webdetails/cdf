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
  'cdf/components/ccc/BaseCccComponent.ext'
], function (BaseCccComponentExt) {

  function viewId(name) {
    return 'pentaho/ccc/visual/' + name;
  }

    /**
   * ## The Base Ccc Component Ext
   */
  describe("The Base Ccc Component Ext #", function () {
    it("Gets the correct Visualization View Id", function () {
      expect(BaseCccComponentExt.getMatchingVizViewId('', {})).toBe(null);
      expect(BaseCccComponentExt.getMatchingVizViewId('dummyChrt', {})).toBe(null);
      expect(BaseCccComponentExt.getMatchingVizViewId('dummyChart', {})).toBe(viewId('dummy'));
      expect(BaseCccComponentExt.getMatchingVizViewId('MetricDotChart', {})).toBe(viewId('Bubble'));
      expect(BaseCccComponentExt.getMatchingVizViewId('MetricLineChart', {})).toBe(viewId('Scatter'));
      expect(BaseCccComponentExt.getMatchingVizViewId('MetricLineChart', {
        stacked: true
      })).toBe(viewId('Scatter'));
      expect(BaseCccComponentExt.getMatchingVizViewId('DotChart', {})).toBe(viewId('Dot'));
      expect(BaseCccComponentExt.getMatchingVizViewId('DotChart', {
        stacked: true
      })).toBe(viewId('Dot'));
      expect(BaseCccComponentExt.getMatchingVizViewId('StackedDotChart', {})).toBe(viewId('Dot'));
      expect(BaseCccComponentExt.getMatchingVizViewId('StackedDotChart', {
        stacked: true
      })).toBe(viewId('Dot'));
      expect(BaseCccComponentExt.getMatchingVizViewId('AreaChart', {})).toBe(viewId('Area'));
      expect(BaseCccComponentExt.getMatchingVizViewId('AreaChart', {stacked: true})).toBe(viewId('AreaStacked'));
      expect(BaseCccComponentExt.getMatchingVizViewId('StackedAreaChart', {})).toBe(viewId('AreaStacked'));
      expect(BaseCccComponentExt.getMatchingVizViewId('StackedAreaChart', {stacked: true})).toBe(viewId('AreaStacked'));

      expect(BaseCccComponentExt.getMatchingVizViewId('HeatGridChart', {})).toBe(viewId('HeatGrid'));
      expect(BaseCccComponentExt.getMatchingVizViewId('HeatGridChart', {stacked: true})).toBe(viewId('HeatGrid'));

      expect(BaseCccComponentExt.getMatchingVizViewId('LineChart', {})).toBe(viewId('Line'));
      expect(BaseCccComponentExt.getMatchingVizViewId('LineChart', {stacked: true})).toBe(viewId('LineStacked'));
      expect(BaseCccComponentExt.getMatchingVizViewId('StackedLineChart', {})).toBe(viewId('LineStacked'));

      expect(BaseCccComponentExt.getMatchingVizViewId('PieChart', {})).toBe(viewId('Pie'));
      expect(BaseCccComponentExt.getMatchingVizViewId('PieChart', {stacked: true})).toBe(viewId('Pie'));

      expect(BaseCccComponentExt.getMatchingVizViewId('SunburstChart', {})).toBe(viewId('Sunburst'));
      expect(BaseCccComponentExt.getMatchingVizViewId('SunburstChart', {stacked: true})).toBe(viewId('Sunburst'));

      expect(BaseCccComponentExt.getMatchingVizViewId('BarChart', {})).toBe(viewId('Bar'));
      expect(BaseCccComponentExt.getMatchingVizViewId('BarChart', {
        valuesNormalized: true
      })).toBe(viewId('BarNormalized'));
      expect(BaseCccComponentExt.getMatchingVizViewId('BarChart', {stacked: true})).toBe(viewId('BarStacked'));
      expect(BaseCccComponentExt.getMatchingVizViewId('BarChart', {
        stacked: true,
        orientation: 'vertical'
      })).toBe(viewId('BarStacked'));
      expect(BaseCccComponentExt.getMatchingVizViewId('BarChart', {
        stacked: true,
        orientation: 'horizontal'
      })).toBe(viewId('BarStackedHorizontal'));
      expect(BaseCccComponentExt.getMatchingVizViewId('NormalizedBarChart', {})).toBe(viewId('BarNormalized'));
    });

    it("Gets the correct Promise and the Visualization Extension", function (done) {
      var returnedPromise = BaseCccComponentExt.getExtensionsPromise("pentaho/ccc/visual/Bar");
      expect(returnedPromise).toBeDefined();

      returnedPromise.then(function(extension){
        expect(extension).toBeDefined();
        expect(extension.definition).toBe('dummy');
        done();
      });
    });

    it("Gets the correct default colors", function () {
      expect(BaseCccComponentExt.getColors()).toEqual(['dummyA', 'dummyB']);
    });

    it("Gets the correct colors of a given palette", function () {
      expect(BaseCccComponentExt.getColors("pentaho/visual/color/palettes/quantitativeBlue3")).toEqual(
        ['dummy1', 'dummy2', 'dummy3']);
    });
  });

});
