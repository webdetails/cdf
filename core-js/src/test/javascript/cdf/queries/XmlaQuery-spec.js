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
  "cdf/lib/jquery",
  "amd!cdf/lib/underscore",
  "cdf/Dashboard.Clean"
], function($, _, Dashboard) {

  var unprocessedData = {data: 0},
      processedData = {data: [1, 2, 3]},
      dashboard;

  /**
   * ## XMLA query #
   */
  describe("XMLA query #", function() {

    var xmlaQuery;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.addDataSource("queryXMLA", {
        queryType: "xmla",
        catalog: "SteelWheels",
        query: function() {
          return "select NON EMPTY {[Measures].[Sales]} ON COLUMNS," +
                 "NON EMPTY TopCount([Customers].[All Customers].Children," +
                 "10.0,[Measures].[Sales]) ON ROWS from [SteelWheelsSales]";
        }
      });
      dashboard.init();
    });

    /**
     * ## XMLA query # doQuery
     */
    describe("XMLA query # doQuery", function() {
      /**
       * ## XMLA query # doQuery # persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {
        spyOn(XMLHttpRequest.prototype, 'send').and.callFake(function() { /* noop */ });
        xmlaQuery = dashboard.getQuery("xmla", {dataSource: "queryXMLA"});

        var fakeXmlaDoQuery = _.bind(
          xmlaQuery.doQuery,
          // override some of the original methods to avoid having to mock XMLHttpRequests 
          $.extend(true, xmlaQuery, {
            _executeQuery: function(qd) { return unprocessedData;},
            transformXMLAResults: function(results) { return unprocessedData; }
          })
        );
        fakeXmlaDoQuery(function(data) { return processedData; });

        expect(xmlaQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(xmlaQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });
  });

  /**
   * ## XMLA discover query #
   */
  describe("XMLA discover query #", function() {

    var xmlaDiscoverQuery;

    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.addDataSource("queryXMLADiscover", {
        queryType: "xmlaDiscover",
        catalog: "SteelWheels",
        query: function() { return Xmla.DBSCHEMA_CATALOGS; }
      });
      dashboard.init();
    });

    /**
     * ## XMLA discover query # doQuery
     */
    describe("XMLA discover query # doQuery", function() {
      /**
       * ## XMLA discover query # doQuery # persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {
        spyOn(XMLHttpRequest.prototype, 'send').and.callFake(function() { /* noop */ });
        xmlaDiscoverQuery = dashboard.getQuery("xmlaDiscover", {dataSource: "queryXMLADiscover"});

        var fakeXmlaDoQuery = _.bind(
          xmlaDiscoverQuery.doQuery,
          // override some of the original methods to avoid having to mock XMLHttpRequests 
          $.extend(true, xmlaDiscoverQuery, {
            _executeDiscoverQuery: function(qd) { return unprocessedData;},
            transformXMLADiscoverResults: function(results) { return unprocessedData; }
          })
        );
        fakeXmlaDoQuery(function(data) { return processedData; });

        expect(xmlaDiscoverQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(xmlaDiscoverQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });

  });
});
