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

define(["cdf/Dashboard.Clean", 'cdf/lib/jquery'], function(Dashboard, $) {

  /**
   * ## The CDF framework Dashboard Views
   */
  describe("The CDF framework Dashboard Views #", function() {
    var dashboard,
        serverResponse = {test: 1};
    
    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     */
    beforeEach(function() {
      dashboard = new Dashboard();
    });
    //#end

    /**
     * ## Dashboard Views # correctly calls the initViews
     */
    it("correctly calls the initViews", function(done) {
      spyOn($, "ajax").and.callFake(function(params) {
        params.success(serverResponse);
      });

      // listen to cdf:postInit event
      dashboard.once("cdf:postInit", function() {
        expect(dashboard._initViews).toBeDefined();
        expect(dashboard.viewParameters).toEqual({});
        expect(dashboard.view).toEqual(undefined);
        done();
      });

      dashboard.init();
    });

    /**
     * ## The CDF framework Dashboard Views # sets the view object according to server response
     */
    it("sets the view object according to server response", function(done) {
      dashboard.init();

      spyOn(dashboard, "_initViews").and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success(serverResponse);
        expect(dashboard._initViews.calls.count()).toEqual(1);
        expect(dashboard.view).toEqual(serverResponse);
        done();
      });

      dashboard._initViews();
    });
  });
});
