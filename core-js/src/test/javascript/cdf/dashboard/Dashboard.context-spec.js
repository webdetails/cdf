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

  /**
   * ## The CDF context
   */
  describe("The CDF context", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    //an exact copy of this object is set in context.js
    var contextObj = {
      "locale": "en_US",
      "params": {},
      "path": "/test/fake_from_module_configuration.xcdf",
      "queryData": {},
      "roles": ["Administrator", "Authenticated"],
      "serverLocalDate": 1412605395782,
      "serverUTCDate": 1412601795782,
      "sessionAttributes": {},
      "sessionTimeout": 7200,
      "user": "admin"
    };

    /**
     * ## The CDF context # is correctly read through the module configuration
     */
    it("is correctly read through the module configuration", function() {
      expect(dashboard.context).toEqual(contextObj);
    });

    /**
     * ## The CDF context # is correctly read through the Dashboard constructor
     */
    it("is correctly read through the Dashboard constructor", function() {
      contextObj.path = "/test/fake_from_dashboard_constructor.xcdf";
      var dashboard2 = new Dashboard({context: contextObj});
      expect(dashboard2.context).toEqual(contextObj);
    });
  });
});
