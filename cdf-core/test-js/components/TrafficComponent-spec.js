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
  "cdf/components/TrafficComponent",
  "cdf/lib/jquery"
], function(Dashboard, TrafficComponent, $) {
  
  /**
   * ## The Traffic Component
   */
  describe("The Traffic Component #", function() {
    var dashboard;
    var trafficComponent;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addParameter('trafficTestParameter', 1);

      trafficComponent = new TrafficComponent({
        name: "trafficComponentCDA",
        type: "trafficComponent",
        trafficDefinition: {
          dataSource: "queryTraffic",
          title: "Check current budget",
          intervals: [10, 20],
          showValue: true
        },
        htmlObject: "sampleObjectTraffic",
        parameter: "trafficTestParameter",
        executeAtStart: true
      });
    });

    /**
     * ## The Traffic Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addDataSource("queryTraffic", {
        dataAccessId: "1",
        path: "/test/path"
      });
      dashboard.addComponent(trafficComponent);

      spyOn(trafficComponent, 'update').and.callThrough();
      spyOn(trafficComponent, 'doQuery').and.callThrough();
      spyOn(trafficComponent, 'triggerQuery').and.callThrough()
      spyOn($, "ajax").and.callFake(function(params) {
        params.success({"resultset": [[1.4]]});
      });

      // listen to cdf:postExecution event
      trafficComponent.once("cdf:postExecution", function() {
        expect(trafficComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(trafficComponent);
    });

    /**
     * ## The Traffic Component # executes CDA queries
     */
    it("executes CDA queries", function(done) {
      dashboard.addDataSource("queryTraffic", {
        dataAccessId: "1",
        path: "/test/path"
      });
      dashboard.addComponent(trafficComponent);

      spyOn(trafficComponent, 'doQuery').and.callThrough();
      spyOn(trafficComponent, 'triggerQuery').and.callThrough();
      spyOn(trafficComponent, 'synchronous').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success({"resultset": [[1.4]]});
      });
      spyOn(trafficComponent, 'trafficLight').and.callThrough();

      // listen to cdf:postExecution event
      trafficComponent.once("cdf:postExecution", function() {
        expect(trafficComponent.doQuery).toHaveBeenCalled();
        expect(trafficComponent.triggerQuery).toHaveBeenCalled();
        expect(trafficComponent.synchronous).not.toHaveBeenCalled();
        expect(trafficComponent.trafficLight).toHaveBeenCalledWith([[1.4]]);
        done();
      });

      dashboard.update(trafficComponent);
    });

    /**
     * ## The Traffic Component # executes XActions if trafficDefinition's path or dataAccessId is falsy
     */
    it("executes XActions if trafficDefinition's path or dataAccessId is falsy", function(done) {
      dashboard.addDataSource("queryTraffic", {
        queryType: 'mdx',
        jndi: "SampleData",
        catalog: "mondrian:/SampleData",
        query: function() {
          return "select NON EMPTY [Measures].[Budget] ON COLUMNS, "
               + "NON EMPTY ([Department].[All Departments]) ON ROWS "
               + "from [Quadrant Analysis]";
        }
      });
      dashboard.addComponent(trafficComponent);

      spyOn(trafficComponent, 'update').and.callThrough();
      spyOn(trafficComponent, 'doQuery').and.callThrough();
      spyOn(trafficComponent, 'triggerQuery').and.callThrough();
      spyOn(trafficComponent, 'synchronous').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.complete({responseXML: "<SOAP-ENV><VALUE>1.4</VALUE></SOAP-ENV>"});
      });
      var jXML;
      spyOn(dashboard, 'parseXActionResult').and.callFake(function(obj, html) {
        // store the data for further validation
        jXML = $(html);
        return jXML;
      })
      spyOn(trafficComponent, 'trafficLight').and.callThrough();

      // listen to cdf:postExecution event
      trafficComponent.once("cdf:postExecution", function() {
        expect(trafficComponent.doQuery).toHaveBeenCalled();
        expect(trafficComponent.triggerQuery).not.toHaveBeenCalled();
        expect(trafficComponent.synchronous).toHaveBeenCalled();
        expect(dashboard.parseXActionResult).toHaveBeenCalledWith(trafficComponent, "<SOAP-ENV><VALUE>1.4</VALUE></SOAP-ENV>");
        expect(trafficComponent.trafficLight).toHaveBeenCalledWith(jXML, true);
        done();
      });

      dashboard.update(trafficComponent);
    });
  });
});
