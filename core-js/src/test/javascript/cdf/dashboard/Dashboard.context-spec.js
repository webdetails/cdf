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
