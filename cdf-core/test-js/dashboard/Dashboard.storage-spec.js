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
    //an exact copy of this object is set in context.js
    var dashboard = new Dashboard();
    var storageObj = {
      test: 1
    };

    /**
     * ## The CDF storage # correctly calls the initStorage
     */
    it("correctly calls the initStorage", function() {
      expect(dashboard._initStorage).toBeDefined();
      expect(dashboard.storage).toEqual(storageObj);
      expect(dashboard.initialStorage).toEqual(storageObj);
    });

    /**
     * ## The CDF storage # loads the storage correctly
     */
    it("loads the storage correctly", function() {
      var dashboard2 = new Dashboard();
      var serverResponse = {test: 2};

      spyOn($, "ajax").and.callFake(function(params) {
        params.success(serverResponse);
        expect(dashboard2.storage).toEqual(serverResponse);
        expect(dashboard2.initialStorage).toEqual(serverResponse);
      });
      dashboard2.loadStorage();
    });

    /**
     * ## The CDF storage # is correctly read through the Dashboard constructor
     */
    it("is correctly read through the Dashboard constructor", function() {
      storageObj.test = 3;
      var options = {
        storage: storageObj
      };
      var dashboard3 = new Dashboard(options);

      expect(dashboard3.storage).toEqual(storageObj);
      expect(dashboard3.initialStorage).toEqual(storageObj);
    });
  });
});
