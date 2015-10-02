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
  "cdf/dashboard/Query",
  "cdf/lib/jquery",
  "amd!cdf/lib/underscore",
  "cdf/components/BaseComponent",
  "cdf/components/UnmanagedComponent"
], function(Dashboard, Query, $, _, BaseComponent, UnmanagedComponent) {

  var HelloBaseComponent = BaseComponent.extend({
    update: function() {
      $("#" + this.htmlObject).text("Hello World!");
      this.myFunction();
    }
  });

  var HelloUnmanagedComponent = UnmanagedComponent.extend({
    update: function() {
      var render = _.bind(this.render, this);
      this.synchronous(render);
    },
    render: function() {
      $("#" + this.htmlObject).text("Hello World!");
      this.myFunction();
    }
  });

  var HelloQueryBaseComponent = BaseComponent.extend({
    update: function() {
      var myself = this;

      var query = new Query(myself.dashboard.getDataSource(myself.queryDefinition), null, myself.dashboard);
      query.fetchData(myself.parameters, function(values) {
        var changedValues = undefined;
        if((typeof(myself.postFetch) == 'function')) {
          changedValues = myself.postFetch(values);
        }
        if(changedValues !== undefined) {
          values = changedValues;
        }
        myself.render(values);
      });
    },
    render: function(data) {
      $("#" + this.htmlObject).text(JSON.stringify(data));
    }
  });

  var HelloQueryUnmanagedComponent = UnmanagedComponent.extend({
    update: function() {
      var render = _.bind(this.render,this);
      this.triggerQuery(this.queryDefinition, render);
    },
    render: function(data) {
      $("#" + this.htmlObject).text(JSON.stringify(data));
    }
  });

  /**
   * ## Unmanaged Component #
   */
  describe("Unmanaged Component #", function() {
    var dashboard;

    var mhello = new HelloBaseComponent({
      name: "mhello",
      type: "HelloBase",
      testFlag: 0,
      htmlObject: 'mhello',
      executeAtStart: true,
      myFunction: function() {}
    });
  
    var uhello = new HelloUnmanagedComponent({
      name: "uhello",
      type: "HelloUnmanaged",
      htmlObject: 'uhello',
      executeAtStart: true,
      myFunction: function() {}
    });
  
    var mquery = new HelloQueryBaseComponent({
      name: "mquery",
      type: "HelloQueryBase",
      htmlObject: 'mquery',
      executeAtStart: true,
      queryDefinition: {dataSource: "fakeQuery"}
    });
  
    var uquery = new HelloQueryUnmanagedComponent({
      name: "uquery",
      type: "HelloQueryUnmanaged",
      htmlObject: 'uquery',
      executeAtStart: true,
      queryDefinition: {dataSource: "fakeQuery"}
    });

    var uqueryWithParams = new HelloQueryUnmanagedComponent({
      name: "uqueryWithParams",
      type: "HelloQueryUnmanaged",
      htmlObject: 'uquery',
      executeAtStart: true,
      queryDefinition: {dataSource: "fakeQuery"},
      parameters: {
        "MYPARAM1": "myparam1",
        "MYPARAM2": "myparam2",
        "MYPARAM3": "myparam3"
      }
    });

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addComponents([mhello, uhello, mquery, uquery, uqueryWithParams]);
      dashboard.addDataSource("fakeQuery", {dataAccessId: "1", path: "/test/path"});
    });

    /**
     * ## Unmanaged Component # allows a dashboard to execute update on a managed component
     */
    it("allows a dashboard to execute update on a managed component", function(done) {
      spyOn(mhello, 'update').and.callThrough();
      spyOn(mhello, 'myFunction');

      // listen to cdf:postExecution event
      mhello.once("cdf:postExecution", function() {
        expect(mhello.update).toHaveBeenCalled();
        expect(mhello.myFunction.calls.count()).toEqual(1);
        done();
      });

      dashboard.update(mhello);
    });

    /**
     * ## Unmanaged Component # allows a dashboard to execute update on a unmanaged component
     */
    it("allows a dashboard to execute update on a unmanaged component", function(done) {
      spyOn(uhello, 'update').and.callThrough();
      spyOn(uhello, 'myFunction');

      // listen to cdf:postExecution event
      uhello.once("cdf:postExecution", function() {
        expect(uhello.update).toHaveBeenCalled();
        expect(uhello.myFunction.calls.count()).toEqual(1);
        done();
      });

      dashboard.update(uhello);
    });

    /**
     * ## Unmanaged Component # allows a dashboard to execute update on a managed query component
     */
    it("allows a dashboard to execute update on a managed query component", function(done) {
      spyOn(mquery, 'update').and.callThrough();

      // listen to cdf:postExecution event
      mquery.once("cdf:postExecution", function() {
        expect(mquery.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(mquery);
    });

    /**
     * ## Unmanaged Component # allows a dashboard to execute update on a unmanaged query component
     */
    it("allows a dashboard to execute update on a unmanaged query component", function(done) {
      spyOn(uquery, 'update').and.callThrough();

      // listen to cdf:postExecution event
      uquery.once("cdf:postExecution", function() {
        expect(uquery.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(uquery);
    });

    it("triggers query with the parameters of the unmanaged query component unchanged", function(done) {
      spyOn(uqueryWithParams, 'update').and.callThrough();

      var myQuery = new Query(
        dashboard.getDataSource(uqueryWithParams.queryDefinition),
        null,
        uqueryWithParams.dashboard);

      spyOn(myQuery, 'fetchData').and.callThrough();

      spyOn(uqueryWithParams.dashboard, 'getQuery').and.returnValue(myQuery);

      // listen to cdf:postExecution event
      uqueryWithParams.once("cdf:postExecution", function() {
        expect(uqueryWithParams.update).toHaveBeenCalled();
        expect(myQuery.fetchData).toHaveBeenCalledWith(
          uqueryWithParams.parameters,
          jasmine.any(Function),
          jasmine.any(Function)
        );
        done();
      });

      dashboard.update(uqueryWithParams);
    });

    /**
     * ## Unmanaged Component # getSuccessHandler
     */
    describe("getSuccessHandler", function() {

      /**
       * ## Unmanaged Component # getSuccessHandler # returns a callback function that returns the processed data after calling postFetch on a successful data request
       */
      it("returns a callback function that returns the processed data after calling postFetch on a successful data request", function() {
        var unprocessedData = {},
            processedData = {data: [1, 2, 3]};
        // set postFetch function that does the data transformation
        uquery.postFetch = function(data) { return processedData; };
        // set fake counter values to allow to proceed with the simulated successful execution
        uquery.counter = 0;
        uquery.runCounter = 0;
        // test with a simulated successful data request
        expect(uquery.getSuccessHandler(function success(){})(unprocessedData)).toEqual(processedData);
      });
    });
  });
});
