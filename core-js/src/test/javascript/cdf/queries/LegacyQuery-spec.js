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

define(["cdf/Dashboard.Clean"], function(Dashboard) {

  // legacy queries executes eval on data strings
  var unprocessedDataString = "{\"metadata\":[\"Sales\"],\"values\":[[\"Euro+ Shopping's Channel\",\"914.11\"],[\"Mini Gifts Ltd.\",\"6558.02\"]]}",
      unprocessedData = {metadata: [{colIndex : 0, colType : "String", colName : "Name"},
                                    {colIndex : 1, colType : "String", colName : "Sales"}],
                         resultset: [["Euro+ Shopping's Channel", "914.11"], ["Mini Gifts Ltd.", "6558.02"]]},
      processedData = {data: [1, 2, 3]},
      dashboard,
      legacyQuery;

  var unprocessedDataStringWithQueryInfo = "{\"metadata\":[\"Sales\"],\"values\":[[\"Euro+ Shopping's Channel\",\"914.11\"],[\"Mini Gifts Ltd.\",\"6558.02\"]],\"queryInfo\": {\"totalRows\":\"2\"}}",
      unprocessedDataWithQueryInfo = {metadata: [{colIndex : 0, colType : "String", colName : "Name"},
                                                 {colIndex : 1, colType : "String", colName : "Sales"}],
                                      resultset: [["Euro+ Shopping's Channel", "914.11"], ["Mini Gifts Ltd.", "6558.02"]],
                                      queryInfo: {totalRows:"2"}}
      processedDataWithQueryInfo = {data: [1, 2, 3]};

  beforeEach(function() {
    dashboard = new Dashboard();
    dashboard.init();
    legacyQuery = dashboard.getQuery("sql", {});
  });

  /**
   * ## Legacy query #
   */
  describe("Legacy query #", function() {

    /**
     * ## Legacy query # getSuccessHandler
     */
    describe("Legacy query # getSuccessHandler", function() {

      /**
       * ## Legacy query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        legacyQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedDataString);

        expect(legacyQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(legacyQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });

    describe("Legacy query # lastResultSet.reader", function() {

      describe("when passing well-formed json object's string representation", function() {

        it("should parse it successfully", function() {
          var actual = legacyQuery.interfaces.lastResultSet.reader(unprocessedDataString);
          expect(actual).toEqual(unprocessedData);
          expect(actual.queryInfo).toBeUndefined();
        });

        it("should parse it successfully with defined query info", function() {
          var actual = legacyQuery.interfaces.lastResultSet.reader(unprocessedDataStringWithQueryInfo);
          expect(actual).toEqual(unprocessedDataWithQueryInfo);
        });

      });

      describe("when passing malicious code", function() {

        it("it should not be executed; instead SyntaxError should be thrown", function() {
          var f = { inject: function() {/* dummy*/} };
          spyOn(f, "inject");
          var malicious = "f.inject()";

          var call = function() { legacyQuery.interfaces.lastResultSet.reader(malicious); };
          expect(call).toThrowError(SyntaxError);
          expect(f.inject).not.toHaveBeenCalled();
        });
      });
    });

  });
});
