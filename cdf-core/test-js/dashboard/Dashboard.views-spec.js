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

define(["cdf/Dashboard.Clean", 'cdf/lib/jquery'], function(Dashboard, $) {

  /**
   * ## The CDF views
   */
  describe("The CDF views", function() {

    var dashboard = new Dashboard();

    /**
     * ## The CDF views # Correctly calls the initViews
     */
    it("Correctly calls the initViews", function(done) {
      setTimeout(function() {
        expect(dashboard._initViews).toBeDefined();
        expect(dashboard.viewParameters).toEqual({});
        expect(dashboard.view).toEqual(undefined);
        done();
      }, 100);
    });

    /**
     * ## The CDF views # Sets the view object according to server response
     */
    it("Sets the view object according to server response", function(done) {
      var serverResponse = {
        test: 1
      };

      spyOn($, "getJSON").and.callFake(function(json) {
        dashboard.view = serverResponse;
      });

      dashboard._initViews();

      setTimeout(function() {
        expect(dashboard.view).toEqual(serverResponse);
        done();
      }, 100);
      
    });
  });
});
