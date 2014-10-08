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

define(["cdf/Dashboard", "cdf/components/JFreeChartComponent"],
  function(Dashboard, JFreeChartComponent) {
  
  /**
   * ## The JFreeChart Component
   */
  describe("The JFreeChart Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var topTenCustomers = new JFreeChartComponent(myDashboard, {
      name: "topTenCustomers",
      type: "jFreeChartComponent",
      chartDefinition: {
        width: 500,
        height: 300,
        chartType: "BarChart",
        datasetType: "CategoryDataset",
        is3d: false,
        byRow: false,
        isStacked: false,
        includeLegend: false,
        caption:{},
        domainLabelRotation: 0,
        backgroundColor: "#F3F3F3",
        title: "Top 10 Customers",
        parameterName: "PRODUCTLINE",
        urlTemplate: "javascript:require(['cdf/dashboard/Utf8Encoder'], function(Utf8Encoder) {" +
          " alert(\"You clicked \" + Utf8Encoder.encode_prepare(\"{PRODUCTLINE}\")); })",
        orientation: 'horizontal',
        queryType: 'mdx',
        catalog: 'mondrian:/SteelWheels',
        jndi: "SampleData",
        query: function() {
          var query = "select NON EMPTY {[Measures].[Sales]} ON COLUMNS," +
            " NON EMPTY TopCount([Customers].[All Customers].Children, 10.0, [Measures].[Sales])" +  
            " ON ROWS from [SteelWheelsSales]";
          return query;
        }
      },
      htmlObject: "sampleObject",
      executeAtStart: true
    });

    myDashboard.addComponent(topTenCustomers);

    /**
     * ## The JFreeChart Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(topTenCustomers, 'update').and.callThrough();
      myDashboard.update(topTenCustomers);
      setTimeout(function() {
        expect(topTenCustomers.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
