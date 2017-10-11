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
