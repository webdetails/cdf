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

define(["cdf/Dashboard.Clean", "cdf/components/DialComponent"],
  function(Dashboard, DialComponent) {
    
  /**
   * ## The Dial Component
   */
  describe("The Dial Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var dialComponent = new DialComponent({
      name: "dialComponent",
      type: "dialComponent",
      chartDefinition: {
        width: 400,
        height: 200,
        chartType: "DialChart",
        queryType: 'mdx',
        jndi: "SampleData",
        title: "Check current budget",
        catalog: "mondrian:/SampleData",
        colors: ["#F16C3A","#FFFF00","#B0D837"],
        intervals: [7000000,70000000,150000000],
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

    myDashboard.addComponent(dialComponent);

    /**
     * ## The Dial Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(dialComponent, 'update').and.callThrough();
      myDashboard.update(dialComponent);
      setTimeout(function() {
        expect(dialComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
