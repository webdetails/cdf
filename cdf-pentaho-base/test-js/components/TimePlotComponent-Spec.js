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

define(["cdf/Dashboard", "cdf/components/TimePlotComponent"],
  function(Dashboard, TimePlotComponent) {

  /**
   * ## The Time Plot Component
   */
  describe("The Time Plot Component #", function() {

    var MetaLayer = {
      timePlotDefinition: {
        width: 500,
        height: 300,
        title: "Total order income",
        queryType: 'mdx',
        jndi: "SampleData",
        catalog: "solution:/public/plugin-samples/pentaho-cdf/30-documentation/30-component_reference/10-core/31-TimePlotComponent/steelwheels.mondrian.xml",
        query: function() {
          var query = "SELECT Measures.Sales on columns, non empty [Time].[Date].Members on rows from SteelWheelsSales";
          return query;
        },
        columns: ["Total Price"],
        dots: false,
        showValues: true,
        fill: true
      }
    };

    var myDashboard = new Dashboard();

    myDashboard.init();

    var timePlotComponent = new TimePlotComponent(myDashboard, {
        name: "timePlotComponent",
        type: "timePlotComponent",
        chartDefinition: MetaLayer.timePlotDefinition,
        htmlObject: "sampleObject",
        executeAtStart: true
    });

    myDashboard.addComponent(timePlotComponent);

    /**
     * ## The Time Plot Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(timePlotComponent, 'update').and.callThrough();
      myDashboard.update(timePlotComponent);
      setTimeout(function() {
        expect(timePlotComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
