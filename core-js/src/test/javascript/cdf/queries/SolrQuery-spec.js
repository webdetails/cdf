/*!
 * Copyright 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  "cdf/lib/jquery"
], function(Dashboard, $) {
  "use strict";

  /* globals beforeEach, describe, it, expect, spyOn */

  describe("SolrQuery", function () {
    var solrQuery;
    var solrOptions;

    var MOCK_EMPTY_DATA = {
      resultset: [],
      metadata: [],
      queryInfo: {}
    };

    var MOCK_DATA = {
      resultset: [
        ["foo1", "bar1"],
        ["foo2", "bar2"]
      ],
      metadata: [
        { colName: "Foo Header", colType: "string", colIndex: 0 },
        { colName: "Bar Header", colType: "string", colIndex: 1 }
      ],
      queryInfo: { totalRows: "2" }
    };

    var MOCK_DATA_SCHEMA = {
      columnNames: ["Foo Header", "Bar Header"],
      columnTypes: ["string", "string"],
      columnPaths: ["foo", "bar"]
    };

    var MOCK_DATA_SOLR_RESPONSE = {
      response: {
        docs: [{
          foo: "foo1", bar: "bar1"
        }, {
          foo: "foo2", bar: "bar2"
        }]
      }
    };

    beforeEach(function() {
      var type = "solr";
      var name = "solrTest";

      var dashboard = new Dashboard();

      dashboard.addDataSource(name, { queryType: type, endpoint: "", collection: "" });
      dashboard.init();

      solrQuery = dashboard.getQuery(type, { dataSource: name });
    });

    describe("#init", function() {

      beforeEach(function() {
        solrOptions = {
          endpoint: "http://solr.service.endpoint",
          collection: "solrCollection",
          requestHandler: "handler"
        };

        solrQuery.setOption("url", null);
      });

      it("should throw 'InvalidQuery' when the options endpoint, collection or both are not specified.", function() {
        expect(function() { solrQuery.init({}); }).toThrow('InvalidQuery');
      });

      it("should build the query request url.", function() {
        expect(solrQuery.getOption('url')).toBeNull();

        solrQuery.init(solrOptions);

        var expectedUrl = solrOptions.endpoint + "/" + solrOptions.collection + "/" + solrOptions.requestHandler;
        expect(solrQuery.getOption('url')).toBe(expectedUrl);
      });
    });

    describe("#buildQueryDefinition", function() {
      beforeEach(function () {
        solrOptions = {
          endpoint: "",   // isRequired
          collection: "", // isRequired

          start: 5,
          rows: 50,
          wt: "rType",
          q: "foo:bar"
        };

        solrQuery.init(solrOptions);
      });

      it("should return a query definition object.", function() {
        var queryDefinition = solrQuery.buildQueryDefinition();

        expect(queryDefinition).not.toBeNull();

        expect(queryDefinition.start).toBe(solrOptions.start);
        expect(queryDefinition.rows).toBe(solrOptions.rows);
        expect(queryDefinition.wt).toBe(solrOptions.wt);
        expect(queryDefinition.q).toBe(solrOptions.q);
      });

      it("should return a query definition object, which values were overridden by the specified definitions",
        function() {

        var overrides = {
          rows: 100,
          q: "bar:foo",
          otherDefinition: "otherValue"
        };

        var queryDefinition = solrQuery.buildQueryDefinition(overrides);

        expect(queryDefinition).not.toBeNull();

        expect(queryDefinition.start).toBe(solrOptions.start);
        expect(queryDefinition.rows).toBe(overrides.rows);
        expect(queryDefinition.wt).toBe(solrOptions.wt);
        expect(queryDefinition.q).toBe(overrides.q);
        expect(queryDefinition.otherDefinition).toBe(overrides.otherDefinition);
      });
    });


    describe("#getSuccessHandler", function() {
      it("should parse solr response to CDA data format.", function(done) {
        spyOn(solrQuery, "__buildSchema").and.returnValue(MOCK_DATA_SCHEMA);

        solrQuery.getSuccessHandler(function(result) {
          expect(result).not.toBeNull();

          expect(result.metadata).toEqual(MOCK_DATA.metadata);
          expect(result.resultset).toEqual(MOCK_DATA.resultset);
          expect(result.queryInfo).toEqual(MOCK_DATA.queryInfo);

          done();
        })(JSON.stringify(MOCK_DATA_SOLR_RESPONSE));
      });
    });


    describe("#doQuery", function() {

      it("should call doQuery's success callback and return an object in CDA format," +
         "when the ajax request is successful", function(done) {
        spyOn(solrQuery, "__buildSchema").and.returnValue(MOCK_DATA_SCHEMA);

        spyOn($, "ajax").and.callFake(function(ajax) {
          ajax.success(JSON.stringify(MOCK_DATA_SOLR_RESPONSE));
        });

        solrQuery.doQuery(function(result) {
          expect(result).toEqual(MOCK_DATA);
          done();
        });
      });

      it("should call doQuery's success callback and return an object in CDA format without data," +
         "when the ajax request is successful but return bad data.", function(done) {
        spyOn($, "ajax").and.callFake(function(ajax) {
          ajax.success(false);
        });

        solrQuery.doQuery(function(result) {
          expect(result).toEqual(MOCK_EMPTY_DATA);
          done();
        });
      });

      it("should call doQuery's error callback when the ajax request fails.", function(done) {
        var expectedResult = "Oops";

        spyOn($, "ajax").and.callFake(function(ajax) {
          ajax.error(expectedResult);
        });

        solrQuery.doQuery(undefined, function(error) {
          expect(error).toEqual(expectedResult);
          done();
        });
      });

    });

  });

});
