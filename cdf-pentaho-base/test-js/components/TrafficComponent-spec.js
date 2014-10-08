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

define(["cdf/Dashboard", "cdf/components/TrafficComponent"],
  function(Dashboard, TrafficComponent) {
  
  /**
   * ## The Traffic Component
   */
  describe("The Traffic Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var trafficComponent = new TrafficComponent(myDashboard, {
      name: "trafficComponent",
      type: "trafficComponent",
      trafficDefinition: {
        queryType: 'mdx',
        jndi: "SampleData",
        title: "Check current budget",
        catalog: "mondrian:/SampleData",
        intervals: [70000000,150000000],
        showValue: true,
        query: function() {
          var query =  " select NON EMPTY [Measures].[Budget] ON COLUMNS," +
            " NON EMPTY ([Department].[All Departments]) ON ROWS " +
            " from [Quadrant Analysis]";
          return query;
        }
      },
      htmlObject: "sampleObject",
      executeAtStart: true
    });

    myDashboard.addComponent(trafficComponent);

    /**
     * ## The Traffic Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(trafficComponent, 'update').and.callThrough();
      myDashboard.update(trafficComponent);
      setTimeout(function() {
        expect(trafficComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
