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
  "cdf/components/OpenFlashChartComponent",
  "cdf/lib/jquery"
], function(Dashboard, OpenFlashChartComponent, $) {

  /**
   * ## The Open Flash Chart Component
   */
  describe("The Open Flash Chart Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addDataSource("topTenQuery", {
      queryType: "mdx",
      catalog: "mondrian:/SteelWheels",
      jndi: "SampleData",
      query: function() {
        return "SELECT NON EMPTY [Measures].[Sales] ON COLUMNS, "
             + "NON EMPTY TopCount([Customers].[All Customers].Children, 10, [Measures].[Sales]) "
             + "ON ROWS FROM [SteelWheelsSales]";
      }
    });

    var openFlashChartComponent = new OpenFlashChartComponent({
      name: "openFlashChartComponent",
      type: "openFlashChartComponent",
      chartDefinition: {
        dataSource: "topTenQuery",
        width: "500",
        height: "500",
        chartType: "PieChart",
        datasetType: "CategoryDataset",
        is3d: "true",
        isStacked: false,
        includeLegend: false,
        title: "Top 10 Customers",
        parameterName: "PRODUCTLINE",
        urlTemplate: "alert('clicked')",
        orientation: "horizontal"
      },
      htmlObject: "sampleObjectOpenFlashChart",
      executeAtStart: true
    });

    dashboard.addComponent(openFlashChartComponent);

    /**
     * ## The Open Flash Chart Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(openFlashChartComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      openFlashChartComponent.once("cdf:postExecution", function() {
        expect(openFlashChartComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(openFlashChartComponent);
    });
  });
});
