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

define(["cdf/Dashboard.Clean", "cdf/lib/jquery"], function(Dashboard, $) {

  /**
   * ## The CDF storage
   */
  describe("The CDF storage", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    /**
     * ## The CDF storage # correctly calls the initStorage
     */
    it("correctly calls the initStorage", function() {
      expect(dashboard._initStorage).toBeDefined();
      expect(dashboard.storage).toEqual({});
      expect(dashboard.initialStorage).toEqual({});
    });

    /**
     * ## The CDF storage # sets the storage objects according to server response
     */
    it("sets the storage objects according to server response", function() {
      var serverResponse = {test: 1};

      spyOn($, "ajax").and.callFake(function(params) {
        params.success(serverResponse);
      });

      dashboard._initStorage();

      expect(dashboard.storage).toEqual(serverResponse);
      expect(dashboard.initialStorage).toEqual(serverResponse);
    });
  });
});
