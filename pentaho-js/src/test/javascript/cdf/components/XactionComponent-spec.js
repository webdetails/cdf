/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  "cdf/components/XactionComponent",
  "cdf/lib/jquery"
], function(Dashboard, XactionComponent, $) {

  /**
   * ## The Xaction Component
   */
  describe("The Xaction Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var xactionComponent = new XactionComponent({
      name: "xactionComponent",
      type: "xactionComponent",
      path: "/public/plugin-samples/pentaho-cdf/20-samples/home_dashboard/topTenCustomers.xaction",
      listeners: ["productLineParam", "territoryParam"],
      parameters: [["productLine", "productLineParam"], ["territory", "territoryParam"]],
      htmlObject: "sampleObjectXaction",
      executeAtStart: true,
      tooltip: "My first dashboard"
    });

    dashboard.addComponent(xactionComponent);

    /**
     * ## The Xaction Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(xactionComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      xactionComponent.once("cdf:postExecution", function() {
        expect(xactionComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(xactionComponent);
    });
  });
});
