/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  "cdf/components/TableComponent",
  "cdf/lib/jquery"
], function(Dashboard, TableComponent, $) {

  /**
   * ## The Table Component
   */
  describe("The Table Component #", function() {
    var dashboard;
    var dataSource = {
      queryType: "mdx",
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

    var tableComponent; ;

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
        params.success('{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}');
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
        params.success('{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}');
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
      }
      spyOn(tableComponent, 'failureCallback').and.callThrough();
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
        params.success('{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}');
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
        params.success('{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}');
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

  });
});
