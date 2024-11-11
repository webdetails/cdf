/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  "cdf/Dashboard.Clean",
  "cdf/components/TableComponent",
  "amd!cdf/lib/datatables"
], function(Dashboard, TableComponent, $) {

  /**
   * ## The Table Component
   */
  describe("The Table Component #", function() {
    var dashboard;
    var dataSource = {
      queryType: "cda",
      dataAccessId: "1",
      path: "path",
      catalog: "mondrian:/SteelWheels",
      jndi: "SampleData",
      query: function() {
        return "SELECT NON EMPTY {[Measures].[Sales]} ON COLUMNS, "
             + "NON EMPTY TopCount([Customers].[All Customers].Children, 50.0, [Measures].[Sales]) "
             + "ON ROWS FROM [SteelWheelsSales]";
      }
    };
    var tableComponentDefaults = {
      name: "tableComponent",
      type: "tableComponent",
      chartDefinition: {
        dataSource: "tableQuery",
        colHeaders: ["Customers", "Sales"],
        colTypes: ['string', 'numeric'],
        colFormats: [null, '%.0f'],
        colWidths: ['500px', null],
        displayLength: 10,
        colSearchable:['1', '2'],
        colSortable:['true', 'true'],
        sortBy:[]
      },
      htmlObject: "sampleObjectTable",
      executeAtStart: true
    };

    var resultSet = '{"metadata":[{"colName":"Product","colType":"String","colIndex":0}, {"colName":"Sales","colType":"Numeric","colIndex":1}],"resultset":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}';
    var tableComponent;

    // DataTables manages it's own events, the event 'aoInitComplete' executes
    // the table component's fnInitComplete() callback function which executes postExec() and unblock()
    var $htmlObject = $('<div />').attr('id', tableComponentDefaults.htmlObject);

    beforeEach(function() {
      $('body').append($htmlObject);
      dashboard = new Dashboard();
      dashboard.init();
      dashboard.addDataSource("tableQuery", dataSource);
      tableComponent = new TableComponent(tableComponentDefaults);
      dashboard.addComponent(tableComponent);
    });

    afterEach(function() {
      $htmlObject.remove();
    });

    /**
     * ## The Table Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(tableComponent, 'update').and.callThrough();
      spyOn(tableComponent, 'triggerQuery').and.callThrough();
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success(resultSet);
      });

      // listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect(tableComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(tableComponent);
    });

    var testHeaders = function(value, done) {
      tableComponent.chartDefinition.colHeaders[0] = value;
      var text = value || "";
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success(resultSet);
      });
      tableComponent.once("cdf:postExecution", function() {
        //find the first column header, and make sure it is html escaped
        var $firstHeader = $($("#" + tableComponentDefaults.htmlObject).find("thead tr th")[0]);
        expect($firstHeader.html()).toEqual($("<div>").text(text).html());
        expect($firstHeader.text()).toEqual(text);
        done();
      });
      dashboard.update(tableComponent);
    };

    it("properly escapes column headers", function(done) {
      testHeaders('<script>alert("Gotcha!")</script>', done);
    });

    it("ignores null column headers", function(done) {
      testHeaders(null, done);
    });

    /**
     * ## The Table Component # calls failureCallback when a query fails.
     */
    it("calls failureCallback when a query fails", function(done) {
      spyOn($, 'ajax').and.callFake(function(params) {
          params.error();
      });
      tableComponent.failureCallback = function () {
         done();
      };
      dashboard.update(tableComponent);
    });

    /**
     * ## The Table Component # executes with a empty result set and column types ,column widths ,column sortable and column searchable properties defined.
     */
    it("executes with a empty result set and column types ,column widths ,column sortable and column searchable properties defined.", function(done) {
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success('');
      });

      var json = {
        metadata: {
          map: function() {
            return [];
          }
        },
        resultSet: []
      }

      var processTableComponentResponse = tableComponent.processTableComponentResponse;
      spyOn(tableComponent, 'processTableComponentResponse').and.callFake(function() {
        return processTableComponentResponse.call(tableComponent, json);
      });

      tableComponent.chartDefinition.colHeaders = [];
      //listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect(tableComponent.rawData).toBeDefined();
        done();
      });
      dashboard.update(tableComponent);
    });

    /**
     * ## The Table Component # executes with a result set that has less columns than column types ,column widths ,column searchable and column sortable properties defined.
     */
    it("executes with a result set that has less columns than column types ,column widths ,column searchable and column sortable properties defined.", function(done) {
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success(JSON.parse(resultSet));
      });
      tableComponent.chartDefinition.colTypes = ['string', 'string', 'string', 'string'];
      tableComponent.chartDefinition.colWidths = ['500px', '500px', '500px', '500px'];
      tableComponent.chartDefinition.colSearchable = ['1', '2', '1', '2'];
      tableComponent.chartDefinition.colSortable = ['true', 'true', 'true', 'true'];

      //listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect(tableComponent.rawData).toBeDefined();
        done();
      });
      dashboard.update(tableComponent);
    });

    /**
     * ## The Table Component # executes with a result set that has more columns than column types ,column widths ,column searchable and column sortable properties defined.
     */
    it("executes with a result set that has more columns than column types ,column widths ,column searchable and column sortable properties defined", function(done) {
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success(JSON.parse(resultSet));
      });
      tableComponent.chartDefinition.colTypes = ['string'];
      tableComponent.chartDefinition.colWidths = ['500px'];
      tableComponent.chartDefinition.colSearchable = ['1'];
      tableComponent.chartDefinition.colSortable = ['true'];

      //listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect(tableComponent.rawData).toBeDefined();
        done();
      });
      dashboard.update(tableComponent);
    });

    /**
     * ## The Table Component # can update when server side is true
     */
    it("can update when server side is true", function(done) {
      spyOn(tableComponent, 'update').and.callThrough();
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success(JSON.parse(resultSet));
      });
      
      tableComponent.chartDefinition.paginateServerside = true;
      tableComponent.parameters = [];
 
      // listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect(tableComponent.update).toHaveBeenCalled();
        done();
      });
      
      dashboard.update(tableComponent);
    });

    /**
     * ## The Table Component # paginatingUpdate can execute without defined parameters
     */
    it("can update when server side is true and without defined parameters", function() {
      tableComponent.queryState = jasmine.createSpyObj("queryState", ['setParameters'])
      tableComponent.queryState.fetchData = jasmine.createSpy('fetchData');
      tableComponent.queryState.setCallback = jasmine.createSpy('setCallback');
      tableComponent.queryState.setPageSize = jasmine.createSpy('setPageSize');
      tableComponent.queryState.setAjaxOptions = jasmine.createSpy('setAjaxOptions');

      tableComponent.paginatingUpdate();
      expect(tableComponent.queryState.setParameters).not.toHaveBeenCalled();
      expect(tableComponent.queryState.setCallback).toHaveBeenCalled();
      expect(tableComponent.queryState.setPageSize).toHaveBeenCalled();
      expect(tableComponent.queryState.setAjaxOptions).toHaveBeenCalled();
      expect(tableComponent.queryState.fetchData).toHaveBeenCalled();
    });

    /**
     * ## The Table Component # paginatingUpdate can execute with defined parameters
     */
    it("can update when server side is true and without defined parameters", function() {
      tableComponent.queryState = jasmine.createSpyObj("queryState", ['setParameters']);
      tableComponent.queryState.fetchData = jasmine.createSpy('fetchData');
      tableComponent.queryState.setCallback = jasmine.createSpy('setCallback');
      tableComponent.queryState.setPageSize = jasmine.createSpy('setPageSize');
      tableComponent.queryState.setAjaxOptions = jasmine.createSpy('setAjaxOptions');
      tableComponent.parameters = jasmine.createSpy('parameters');

      tableComponent.paginatingUpdate();
      expect(tableComponent.queryState.setParameters).toHaveBeenCalled();
      
    });
    /**
     * ## The Table Component # should only trigger one query on start-up
     */
    it("should only trigger one query on start-up.", function(done) {
      
      spyOn($, 'ajax').and.callFake(function(params) {
        params.success(JSON.parse(resultSet));
      });
      
      tableComponent.chartDefinition.colTypes = ['string'];
      tableComponent.chartDefinition.colWidths = ['500px'];
      tableComponent.chartDefinition.colSearchable = ['1'];
      tableComponent.chartDefinition.colSortable = ['true'];
      tableComponent.chartDefinition.paginateServerside = 'true';
      tableComponent.parameters = [];

      //listen to cdf:postExecution event
      tableComponent.once("cdf:postExecution", function() {
        expect($.ajax.calls.count()).toEqual(1);
        done();
      });
      dashboard.update(tableComponent);
    });
    /**
     * ## The Table Component # pagingCallback
     */
    describe("pagingCallback", function () {

      it("should only setCallback without triggering a query the first run", function () {
        tableComponent.queryState = jasmine.createSpyObj("queryState", ['fetchData', 'setCallback', 'setPageSize', 'setAjaxOptions', 'setParameters', 'setSortBy', 'setPageStartingAt', 'setSearchPattern']);
        var callbackSpy = jasmine.createSpy("callback");
        var jsonSpy = jasmine.createSpyObj("json", ['resultset']);
        tableComponent.pagingCallback("url", [], callbackSpy, "datatable", jsonSpy, true);
        expect(tableComponent.queryState.setCallback).toHaveBeenCalled();
        expect(tableComponent.queryState.fetchData).not.toHaveBeenCalled();        
      });

      it("should not execute setCallback and should triggering a query after the first run", function () {
        tableComponent.queryState = jasmine.createSpyObj("queryState", ['fetchData', 'setCallback', 'setPageSize', 'setAjaxOptions', 'setParameters', 'setSortBy', 'setPageStartingAt', 'setSearchPattern']);        var callbackSpy = jasmine.createSpy("callback");
        var jsonSpy = jasmine.createSpyObj("json", ['resultset']);
        tableComponent.pagingCallback("url", [], callbackSpy, "datatable", jsonSpy, false);
        expect(tableComponent.queryState.setCallback).not.toHaveBeenCalled();
        expect(tableComponent.queryState.fetchData).toHaveBeenCalled();        
      });
    });

    /**
     * ## The Table Component # processTableComponentResponse
     */
    describe("processTableComponentResponse", function () {

      it("should set the datatable display length if no query info is provided", function () {
        var dataTableMock = jasmine.createSpyObj("dataTable", ["anOpen"]);  
        var dataTableSpy = spyOn($.prototype, "dataTable").and.callFake(function(settings){
          expect(settings.iDisplayLength).toBe(2);
          expect(settings.bLengthChange).toBe(false);
          return dataTableMock;
        });
        tableComponent.ph = jasmine.createSpyObj("ph", ['trigger','html']);
        tableComponent.ph.find = function(param) { return {bind: function (click,fun) {return "bind"}};};
        tableComponent.chartDefinition.dataTableOptions = {bServerSide: true};

        tableComponent.processTableComponentResponse(JSON.parse(resultSet));
      });

      it("should not set the datatable display length if the query info is provided", function () {
        var dataTableMock = jasmine.createSpyObj("dataTable", ["anOpen"]);  
        var dataTableSpy = spyOn($.prototype, "dataTable").and.callFake(function(settings){
          expect(settings.iDisplayLength).toBe(10);
          expect(settings.bLengthChange).toBe(undefined);
          return dataTableMock;
        });
        tableComponent.ph = jasmine.createSpyObj("ph", ['trigger','html']);
        tableComponent.ph.find = function(param) { return {bind: function (click,fun) {return "bind"}};};
        tableComponent.chartDefinition.dataTableOptions = {bServerSide: true};
        var json = {"metadata":["Sales"],"resultset":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]],"queryInfo": {"totalRows":2}}
        tableComponent.processTableComponentResponse(json);
      });
    });
  });
});
