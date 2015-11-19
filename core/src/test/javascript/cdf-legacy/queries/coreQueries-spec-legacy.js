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

/**
 * ## CDF core queries #
 */
describe("CDF legacy core queries #", function() {

  var unprocessedData = {data: 0},
      processedData = {data: [1, 2, 3]};

  /**
   * ## CDF core queries # Base query #
   */
  describe("Base query #", function() {
    var baseQuery;

    beforeEach(function() {
      baseQuery = Dashboards.getBaseQuery()(false);
      baseQuery.setOption("lastResultSet", null);
      baseQuery.setOption("lastProcessedResultSet", null);
    });

    /**
     * ## CDF core queries # Base query # getSuccessHandler
     */
    describe("Base query # getSuccessHandler", function() {

      /**
       * ## CDF core queries # Base query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        baseQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedData);

        expect(baseQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(baseQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });

    /**
     * ## CDF core queries # Base query # lastResults
     */
    describe("Base query # lastResults", function() {

      /**
       * ## CDF core queries # Base query # lastResults throws an exception if the lastResultSet option value wasn't set
       */
      it("throws an exception if the lastResultSet option value wasn't set", function() {
        expect(function() { baseQuery.lastResults(); }).toThrow("NoCachedResults");
      });

      /**
       * ## CDF core queries # Base query # lastResults returns a copy of the lastResultSet option value
       */
      it("returns a copy of the lastResults option value", function() {

        baseQuery.setOption('lastResultSet', unprocessedData);

        expect(baseQuery.lastResults()).toEqual(unprocessedData);
      });
    });

    /**
     * ## CDF core queries # Base query # lastProcessedResults
     */
    describe("Base query # lastProcessedResults", function() {

      /**
       * ## CDF core queries # Base query # lastProcessedResults throws an exception if the lastProcessedResultSet option value wasn't set
       */
      it("throws an exception if the lastProcessedResultSet option value wasn't set", function() {
        expect(function() { baseQuery.lastProcessedResults(); }).toThrow("NoCachedResults");
      });

      /**
       * ## CDF core queries # Base query # lastProcessedResults returns a copy of the lastProcessedResultSet option value
       */
      it("returns a copy of the lastProcessedResultSet option value", function() {

        baseQuery.setOption('lastProcessedResultSet', processedData);

        expect(baseQuery.lastProcessedResults()).toEqual(processedData);
      });
    });
  });

  /**
   * ## CDF core queries # CPK query #
   */
  describe("CPK query #", function() {
    var unprocessedData = {data: 0},
      processedData = {data: [1, 2, 3]},
      cpkQuery;

    beforeEach(function() {
      cpkQuery = Dashboards.getQuery("cpk", {});
    });

    /**
     * ## CDF core queries # CPK query # getSuccessHandler
     */
    describe("CPK query # getSuccessHandler", function() {

      /**
       * ## CDF core queries # CPK query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        cpkQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedData);

        expect(cpkQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(cpkQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });
  });

  /**
   * ## CDF core queries # Legacy query #
   */
  describe("CDF core queries # Legacy query #", function() {

    // legacy queries execute eval on data strings
    var unprocessedDataString = '{"metadata":["Sales"],"values":[["Euro+ Shopping Channel","914.11"],["Mini Gifts Ltd.","6558.02"]]}',
        unprocessedData = {metadata: [{colIndex : 0, colType : 'String', colName : 'Name'},
                                      {colIndex : 1, colType : 'String', colName : 'Sales'}],
                           resultset: [['Euro+ Shopping Channel', '914.11'], ['Mini Gifts Ltd.', '6558.02']]},
        processedData = {data: [1, 2, 3]},
        legacyQuery;

    beforeEach(function() {
      legacyQuery = Dashboards.getQuery("sql", {});
    });

    /**
     * ## CDF core queries # Legacy query # getSuccessHandler
     */
    describe("CDF legacy core queries # Legacy query # getSuccessHandler", function() {

      /**
       * ## CDF core queries # Legacy query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        legacyQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedDataString);

        expect(legacyQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(legacyQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });
  });
});
