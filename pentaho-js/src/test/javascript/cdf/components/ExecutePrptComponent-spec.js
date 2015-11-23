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
