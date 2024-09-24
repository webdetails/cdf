/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

define(["cdf/Dashboard.Clean"], function(Dashboard) {

  var unprocessedData = {data: 0},
      processedData = {data: [1, 2, 3]},
      dashboard,
      cpkQuery;

  beforeEach(function() {
    dashboard = new Dashboard();
    dashboard.init();
    cpkQuery = dashboard.getQuery("cpk", {});
  });

  /**
   * ## CPK query #
   */
  describe("CPK query #", function() {

    /**
     * ## CPK query # getSuccessHandler
     */
    describe("CPK query # getSuccessHandler", function() {

      /**
       * ## CPK query # getSuccessHandler persists the last result and the post fetch processed result
       */
      it("persists the last result and the post fetch processed result", function() {

        cpkQuery.getSuccessHandler(function(data) { return processedData; })(unprocessedData);

        expect(cpkQuery.getOption("lastResultSet")).toEqual(unprocessedData);
        expect(cpkQuery.getOption("lastProcessedResultSet")).toEqual(processedData);
      });
    });

  });
});
