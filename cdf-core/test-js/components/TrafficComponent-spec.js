/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
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

define(["cdf/Dashboard.Clean", "cdf/components/TrafficComponent", "cdf/lib/jquery"],
  function(Dashboard, TrafficComponent, $) {
  
  /**
   * ## The Traffic Component
   */
  describe("The Traffic Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.addParameter('trafficTestParameter', 1);

    myDashboard.init();

    var trafficComponent = new TrafficComponent({
      name: "trafficComponent",
      type: "trafficComponent",
      trafficDefinition: {
        dataAccessId: "dataAccessTestId",
        intervals: [10, 20],
        path: "/test/path",
        showValue: true
      },
      htmlObject: "sampleObject",
      parameter: "trafficTestParameter"
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

    /**
     * ## The Traffic Component # Uses CDA
     */
    it("Uses CDA", function(done) {
      spyOn(trafficComponent, 'update').and.callThrough();
      spyOn(trafficComponent, 'doQuery').and.callThrough();
      var ajax = spyOn($, "ajax").and.callFake(function(options) {
        options.success({
          resultset: "queryResults"
        });
      });
      spyOn(trafficComponent, 'trafficLight');
      trafficComponent.update();
      setTimeout(function() {
        expect(trafficComponent.update).toHaveBeenCalled();
        expect(trafficComponent.doQuery).toHaveBeenCalled();
        expect(trafficComponent.trafficLight).toHaveBeenCalledWith("queryResults");
        done();
      }, 100);
    });

    /**
     * ## The Traffic Component # Uses XActions
     */
    it("Uses XActions", function(done) {
      trafficComponent.trafficDefinition.path = false;
      spyOn(trafficComponent, 'update').and.callThrough();
      spyOn(trafficComponent, 'doQuery').and.callThrough();
      spyOn(myDashboard, "callPentahoAction").and.callFake(function() {
        trafficComponent.trafficLight("queryResults", true);
      });
      spyOn(trafficComponent, 'trafficLight');
      trafficComponent.update();
      setTimeout(function() {
        expect(trafficComponent.update).toHaveBeenCalled();
        expect(trafficComponent.doQuery).toHaveBeenCalled();
        expect(myDashboard.callPentahoAction).toHaveBeenCalled();
        expect(trafficComponent.trafficLight).toHaveBeenCalledWith("queryResults", true);
        done();
      }, 100);
    });
  });
});
