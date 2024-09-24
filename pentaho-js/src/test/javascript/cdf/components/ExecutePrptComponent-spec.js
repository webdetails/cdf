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
  "cdf/Dashboard.Clean",
  "cdf/components/ExecutePrptComponent",
  "cdf/lib/jquery"
], function(Dashboard, ExecutePrptComponent, $) {

  /**
   * ## The Execute Prpt Component
   */
  describe("The Execute Prpt Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var executePrpt = new ExecutePrptComponent({
      name: "executeTopTenCustomers",
      type: "executePrpt",
      path: "/public/Steel Wheels/Widget Library/Report Snippets/Product Sales.prpt",
      listeners: ["productLine", "territory"],
      parameters: [["productLine", '""'], ["territory", '""']],
      htmlObject: "sampleObjectExecutePrpt",
      paginate: false,
      showParameters: true,
      label: "Execute Prpt",
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      tooltip: "Click to generate report"
    });

    dashboard.addComponent(executePrpt);

    /**
     * ## The Execute Prpt Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(executePrpt, 'update').and.callThrough();

      // listen to cdf:postExecution event
      executePrpt.once("cdf:postExecution", function() {
        expect(executePrpt.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(executePrpt);
    });
  });
});
