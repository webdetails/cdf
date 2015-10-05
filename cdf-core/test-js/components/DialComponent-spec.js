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
  "cdf/components/DialComponent",
  "cdf/lib/jquery"
], function(Dashboard, DialComponent, $) {
    
  /**
   * ## The Dial Component
   */
  describe("The Dial Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addDataSource("dialQuery", {
      queryType: "mdx",
      jndi: "SampleData",
      catalog: "mondrian:/SampleData",
      query: function() {
        return " SELECT NON EMPTY [Measures].[Budget] ON COLUMNS,"
          + " NON EMPTY ([Department].[All Departments]) ON ROWS "
          + " FROM [Quadrant Analysis]";
      }
    });

    var dialComponent = new DialComponent({
      name: "dialComponent",
      type: "dialComponent",
      chartDefinition: {
        dataSource: "dialQuery",
        width: 400,
        height: 200,
        chartType: "DialChart",
        title: "Check current budget",
        colors: ["#F16C3A", "#FFFF00", "#B0D837"],
        intervals: [7, 70, 630]
      },
      htmlObject: "sampleObjectDial",
      executeAtStart: true
    });

    dashboard.addComponent(dialComponent);

    /**
     * ## The Dial Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(dialComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      dialComponent.once("cdf:postExecution", function() {
        expect(dialComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(dialComponent);
    });
  });
});
