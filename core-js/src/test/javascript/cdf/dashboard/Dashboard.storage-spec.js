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
