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
  "cdf/components/QueryComponent",
  "cdf/lib/jquery"
], function(Dashboard, QueryComponent, $) {

  /**
   * ## The Synchronous Query Component
   */
  describe("The Synchronous Query Component #", function() {
    var dashboard;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addParameter("result", "");
      dashboard.addDataSource("topTenQuery", {
        queryType: "cda",
        dataAccessId: "1",
        path: "samplePath",
        jndi: "SampleData",
        query: function() {
          return "SELECT NON EMPTY [Measures].[Sales] ON COLUMNS, "
               + "NON EMPTY TopCount([Customers].[All Customers].Children, 10, [Measures].[Sales]) "
               + "ON ROWS FROM [SteelWheelsSales]";
        }
      });
    });

    var queryComponentSync = new QueryComponent({
      name: "executeQueryComponent",
      type: "queryComponent",
      htmlObject: "sampleObjectQueryComp",
      executeAtStart: true,
      asynchronousMode: false,
      resultvar: "result",
      queryDefinition: {dataSource: "topTenQuery"},
      postFetch: function(data) { }
    });

    /**
     * ## The Synchronous Query Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(queryComponentSync);

      spyOn(queryComponentSync, 'update').and.callThrough();
      spyOn(queryComponentSync, 'synchronous').and.callThrough();
      spyOn(queryComponentSync, 'triggerQuery').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success(JSON.stringify({responseXML: "<test/>"}));
      });
      spyOn(queryComponentSync, 'postFetch').and.callThrough();

      // listen to cdf:postExecution event
      queryComponentSync.once("cdf:postExecution", function() {
        expect(queryComponentSync.update).toHaveBeenCalled();
        expect(queryComponentSync.synchronous).toHaveBeenCalled();
        expect(queryComponentSync.triggerQuery).not.toHaveBeenCalled();
        expect($.ajax.calls.count()).toEqual(1);
        expect(queryComponentSync.postFetch.calls.count()).toEqual(1);
        done();
      });

      dashboard.update(queryComponentSync);
    });
  });

  /**
   * ## The Asynchronous Query Component
   */
  describe("The Asynchronous Query Component #", function() {
    var dashboard;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addParameter("result", "");
      dashboard.addDataSource("topTenQuery", {
        queryType: "cda",
        dataAccessId: "1",
        path: "samplePath",
        catalog: "mondrian:/SteelWheels",
        jndi: "SampleData",
        query: function() {
          return "SELECT NON EMPTY [Measures].[Sales] ON COLUMNS, "
               + "NON EMPTY TopCount([Customers].[All Customers].Children, 10, [Measures].[Sales]) "
               + "ON ROWS FROM [SteelWheelsSales]";
        }
      });
    });

    var queryComponentAsync = new QueryComponent({
      name: "executeQueryComponent",
      type: "queryComponent",
      htmlObject: "sampleObject",
      executeAtStart: true,
      asynchronousMode: true,
      resultvar: "result",
      queryDefinition: {dataSource: "topTenQuery"},
      postFetch: function(data) { }
    });

    /**
     * ## The Asynchronous Query Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(queryComponentAsync);

      spyOn(queryComponentAsync, 'update').and.callThrough();
      spyOn(queryComponentAsync, 'synchronous').and.callThrough();
      spyOn(queryComponentAsync, 'triggerQuery').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success(JSON.stringify({responseXML: "<test/>"}));
      });
      spyOn(queryComponentAsync, 'postFetch').and.callThrough();

      // listen to cdf:postExecution event
      queryComponentAsync.once("cdf:postExecution", function() {
        expect(queryComponentAsync.update).toHaveBeenCalled();
        expect(queryComponentAsync.synchronous).not.toHaveBeenCalled();
        expect(queryComponentAsync.triggerQuery).toHaveBeenCalled();
        expect($.ajax.calls.count()).toEqual(1);
        expect(queryComponentAsync.postFetch.calls.count()).toEqual(1);
        done();
      });

      dashboard.update(queryComponentAsync);
    });
  });
});
