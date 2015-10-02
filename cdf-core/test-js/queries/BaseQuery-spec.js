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

define(["cdf/queries/BaseQuery"], function(BaseQuery) {

  var unprocessedData = {data: 0},
      processedData = {data: [1, 2, 3]},
      baseQuery;

  beforeEach(function() {
    baseQuery = new BaseQuery();
  });

  /**
   * ## Base query #
   */
  describe("Base query #", function() {

    /**
     * ## Base query # getSuccessHandler
     */
    describe("Base query # getSuccessHandler", function() {

      /**
       * ## Base query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        baseQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedData);

        expect(baseQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(baseQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });

    /**
     * ## Base query # lastResults
     */
    describe("Base query # lastResults", function() {

      /**
       * ## Base query # lastResults throws an exception if the lastResultSet option value wasn't set
       */
      it("throws an exception if the lastResultSet option value wasn't set", function() {
        expect(function() { baseQuery.lastResults(); }).toThrow("NoCachedResults");
      });

      /**
       * ## Base query # lastResults returns a copy of the lastResultSet option value
       */
      it("returns a copy of the lastResults option value", function() {

        baseQuery.setOption('lastResultSet', unprocessedData);

        expect(baseQuery.lastResults()).toEqual(unprocessedData);
      });
    });

    /**
     * ## Base query # lastProcessedResults
     */
    describe("Base query # lastProcessedResults", function() {

      /**
       * ## Base query # lastProcessedResults throws an exception if the lastProcessedResultSet option value wasn't set
       */
      it("throws an exception if the lastProcessedResultSet option value wasn't set", function() {
        expect(function() { baseQuery.lastProcessedResults(); }).toThrow("NoCachedResults");
      });

      /**
       * ## Base query # lastProcessedResults returns a copy of the lastProcessedResultSet option value
       */
      it("returns a copy of the lastProcessedResultSet option value", function() {

        baseQuery.setOption('lastProcessedResultSet', processedData);

        expect(baseQuery.lastProcessedResults()).toEqual(processedData);
      });
    });
  });
});
