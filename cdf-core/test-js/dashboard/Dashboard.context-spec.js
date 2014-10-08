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
   * ## The CDF context
   */
  describe("The CDF context", function() {

    var dashboard = new Dashboard();

    /**
     * ## The CDF context # Correctly calls the initContext
     */
    it("Correctly calls the initContext", function(done) {
      setTimeout(function() {
        expect(dashboard._initContext).toBeDefined();
        expect(dashboard.context).toEqual({});
        done();
      }, 100);
    });

    /**
     * ## The CDF context # Sets the context object according to server response
     */
    it("Sets the context object according to server response", function(done) {
      var serverResponse = {
        "locale": "en_US",
        "params": {},
        "path": "/public/plugin-samples/pentaho-cdf-require/30-documentation/30-component_reference/10-core/34-TextComponent/text_component.xcdf",
        "queryData": {},
        "roles": [
          "Administrator",
          "Authenticated"
        ],
        "serverLocalDate": 1412605395782,
        "serverUTCDate": 1412601795782,
        "sessionAttributes": {},
        "sessionTimeout": 7200,
        "user": "admin"
      };
      
      spyOn($, "getJSON").and.callFake(function(json) {
        $.extend(dashboard.context,serverResponse);
      });

      dashboard._initContext();

      setTimeout(function() {
        expect(dashboard.context).toEqual(serverResponse);
        done();
      }, 100);
      
    });
  });
});