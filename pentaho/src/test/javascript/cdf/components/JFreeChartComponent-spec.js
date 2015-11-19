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
  "cdf/Dashboard.Clean",
  "cdf/components/JFreeChartComponent",
  "cdf/lib/jquery"
], function(Dashboard, JFreeChartComponent, $) {
  
  /**
   * ## The JFreeChart Component
   */
  describe("The JFreeChart Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addDataSource("topTenQuery", {
      queryType: 'mdx',
      catalog: 'mondrian:/SteelWheels',
      jndi: "SampleData",
      query: function() {
        return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS, "
             + "NON EMPTY TopCount([Customers].[All Customers].Children, 10.0, [Measures].[Sales]) "
             + "ON ROWS from [SteelWheelsSales]";
      }
    });

    var jFreeChartComponent = new JFreeChartComponent({
      name: "topTenCustomers",
      type: "jFreeChartComponent",
      chartDefinition: {
        dataSource: "topTenQuery",
        width: 500,
        height: 300,
        chartType: "BarChart",
        datasetType: "CategoryDataset",
        is3d: false,
        byRow: false,
        isStacked: false,
        includeLegend: false,
        caption: {},
        domainLabelRotation: 0,
        backgroundColor: "#F3F3F3",
        title: "Top 10 Customers",
        parameterName: "PRODUCTLINE",
        urlTemplate: "alert('clicked')",
        orientation: "horizontal"
      },
      htmlObject: "sampleObjectJFreeChart",
      executeAtStart: true
    });

    dashboard.addComponent(jFreeChartComponent);

    /**
     * ## The JFreeChart Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(jFreeChartComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      jFreeChartComponent.once("cdf:postExecution", function() {
        expect(jFreeChartComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(jFreeChartComponent);
    });
  });
});
