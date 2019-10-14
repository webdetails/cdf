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
  "cdf/components/XactionComponent.ext",
  "cdf/lib/jquery"
], function(Dashboard, XactionComponent, XactionComponentExt, $) {

  function createDashboard( xActionComponent ) {
    var dashboard = new Dashboard();
    dashboard.init();
    dashboard.addComponent(xActionComponent);
    return dashboard;
  }

  function createXActionComponent( action, path, solution) {
    return new XactionComponent({
      name: "xActionComponent",
      action: action,
      path: path,
      solution: solution,
      iframe: "mock_iframe"
    });
  }

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

  describe( "should call getCdfXAction method with correct parameters", function () {

    it("should call getCdfXAction method with action null", function(done) {
      var action = null;
      var path = "/public/mock/";
      var solution = "";
      var xActionComponent = createXActionComponent( action, path, solution );
      var dashboard = createDashboard( xActionComponent );

      spyOn(xActionComponent, "update").and.callThrough();
      spyOn(XactionComponentExt, "getCdfXaction").and.callThrough();

      // listen to cdf:postExecution event
      xActionComponent.once("cdf:postExecution", function() {
        expect(xActionComponent.update).toHaveBeenCalled();
        expect(XactionComponentExt.getCdfXaction)
            .toHaveBeenCalledWith(path, "", solution);
        done();
      });

      dashboard.update(xActionComponent);
    });

    it("should call getCdfXAction method with action in path", function(done) {
      var action = "action.xaction";
      var path = "/public/mock/action.xaction";
      var solution = "";
      var xActionComponent = createXActionComponent( action, path, solution );
      var dashboard = createDashboard( xActionComponent );

      spyOn(xActionComponent, "update").and.callThrough();
      spyOn(XactionComponentExt, "getCdfXaction").and.callThrough();

      // listen to cdf:postExecution event
      xActionComponent.once("cdf:postExecution", function() {
        expect(xActionComponent.update).toHaveBeenCalled();
        expect(XactionComponentExt.getCdfXaction)
            .toHaveBeenCalledWith(path, "", solution);
        done();
      });

      dashboard.update(xActionComponent);
    });

    it("should call getCdfXAction method without action in path", function(done) {
      var action = "action.xaction";
      var path = "/public/mock/";
      var solution = "";
      var xActionComponent = createXActionComponent( action, path, solution );
      var dashboard = createDashboard( xActionComponent );

      spyOn(xActionComponent, "update").and.callThrough();
      spyOn(XactionComponentExt, "getCdfXaction").and.callThrough();

      // listen to cdf:postExecution event
      xActionComponent.once("cdf:postExecution", function() {
        expect(xActionComponent.update).toHaveBeenCalled();
        expect(XactionComponentExt.getCdfXaction)
            .toHaveBeenCalledWith(path, action, solution);
        done();
      });

      dashboard.update(xActionComponent);
    });

  });

});
