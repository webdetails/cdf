/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(["cdf/Dashboard", 'cdf/lib/jquery'], function(Dashboard, $) {

  /**
   * ## The CDF storage
   */
  describe("The CDF storage", function() {

    var dashboard = new Dashboard();

    /**
     * ## The CDF storage # Correctly calls the initStorage
     */
    it("Correctly calls the initStorage", function(done) {
      setTimeout(function() {
        expect(dashboard._initStorage).toBeDefined();
        expect(dashboard.storage).toEqual({});
        expect(dashboard.initialStorage).toEqual({});
        done();
      }, 100);
    });

    /**
     * ## The CDF storage # Sets the storage objects according to server response
     */
    it("Sets the storage objects according to server response", function(done) {
      var serverResponse = {
        test: 1
      };

      spyOn($, "getJSON").and.callFake(function(json) {
        $.extend(dashboard.storage, serverResponse);
        $.extend(dashboard.initialStorage, serverResponse);
      });

      dashboard._initStorage();

      setTimeout(function() {
        expect(dashboard.storage).toEqual(serverResponse);
        expect(dashboard.initialStorage).toEqual(serverResponse);
        done();
      }, 100);
      
    });
  });
});
