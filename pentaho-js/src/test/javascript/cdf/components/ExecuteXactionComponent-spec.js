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
  "cdf/components/ExecuteXactionComponent"
], function(Dashboard, ExecuteXactionComponent) {

  /**
   * ## The Execute Xaction Component
   */
  describe("The Execute Xaction Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var executeXactionComponent = new ExecuteXactionComponent({
      name: "executeTopTenCustomers",
      type: "executeXaction",
      path: "/public/plugin-samples/pentaho-cdf/20-samples/home_dashboard/topTenCustomers.xaction",
      listeners: ["productLineParam", "territoryParam"],
      parameters: [["productLine", "productLineParam"], ["territory", "territoryParam"]],
      htmlObject: "sampleObjectExecXaction",
      label: "Execute XAction",
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      tooltip: "My first dashboard"
    });

    dashboard.addComponent(executeXactionComponent);

    /**
     * ## The Execute Xaction Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(executeXactionComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      executeXactionComponent.once("cdf:postExecution", function() {
        expect(executeXactionComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(executeXactionComponent);
    });
  });
});
