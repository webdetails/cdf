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

define(["cdf/Dashboard.Clean", "cdf/components/QueryComponent", "cdf/lib/jquery"],
  function(Dashboard, QueryComponent, $) {
  
  /**
   * ## The Query Component
   */
  describe("The Query Component #", function() {
    var dashboard;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addParameter("result", "");
    });

    var queryComponent = new QueryComponent({
      name: "executeQueryComponent",
      type: "queryComponent",
      htmlObject: "sampleObject",
      executeAtStart: true,
      resultvar: "result",
      queryDefinition: {
        queryType: 'mdx',
        jndi: "SampleData",
        catalog: "mondrian:/SteelWheels",
        query: function() {
          return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS," +
                 "NON EMPTY TopCount([Customers].[All Customers].Children," +
                 "10.0,[Measures].[Sales]) ON ROWS from [SteelWheelsSales]";
          }
      },
      postFetch: function(data) { }
    })

    /**
     * ## The Query Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(queryComponent);

      spyOn(queryComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success(JSON.stringify({responseXML: "<test/>"}));
      });
      spyOn(queryComponent, 'postFetch').and.callThrough();

      // listen to cdf:postExecution event
      queryComponent.once("cdf:postExecution", function() {
        expect(queryComponent.update).toHaveBeenCalled();
        expect($.ajax.calls.count()).toEqual(1);
        expect(queryComponent.postFetch.calls.count()).toEqual(1);
        done();
      });

      dashboard.update(queryComponent);
    });
  });
});
