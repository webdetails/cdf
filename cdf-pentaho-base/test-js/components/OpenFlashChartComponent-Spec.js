/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(["cdf/Dashboard", "cdf/components/OpenFlashChartComponent"],
  function(Dashboard, OpenFlashChartComponent) {

  /**
   * ## The Open Flash Chart Component
   */
  describe("The Open Flash Chart Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var MetaLayerHome2 = {
      topTenCustomerDefinition: {
        width: "500",
        height: "500",
        chartType: "PieChart",
        datasetType: "CategoryDataset",
        is3d: "true",
        isStacked: false,
        includeLegend: false,
        title: "Top 10 Customers",
        parameterName: "PRODUCTLINE",
        urlTemplate: "alert('You clicked ' + encode_prepare('{PRODUCTLINE}'))",
        orientation: 'horizontal',
        queryType: 'mdx',
        catalog: 'mondrian:/SteelWheels',
        jndi: "SampleData",
        query: function() {
          return "select NON EMPTY [Measures].[Sales] ON COLUMNS," +
            " NON EMPTY TopCount([Customers].[All Customers].Children, 10, [Measures].[Sales])" +  
            " ON ROWS from [SteelWheelsSales]";
        }
      }
    };

    var openFlashChartComponent = new OpenFlashChartComponent(myDashboard, {
      name: "openFlashChartComponent",
      type: "openFlashChartComponent",
      chartDefinition: MetaLayerHome2.topTenCustomerDefinition,
      htmlObject: "sampleObject",
      executeAtStart: true
    });

    myDashboard.addComponent(openFlashChartComponent);

    /**
     * ## The Open Flash Chart Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(openFlashChartComponent, 'update').and.callThrough();
      myDashboard.update(openFlashChartComponent);
      setTimeout(function() {
        expect(openFlashChartComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
