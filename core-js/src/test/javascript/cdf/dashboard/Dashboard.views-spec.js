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
   * ## The CDF framework Dashboard Views
   */
  describe("The CDF framework Dashboard Views #", function() {
    var dashboard = new Dashboard();
    
    //an exact copy of this object is set in context.js
    var viewObj = {param: 1};

    /**
     * ## Dashboard Views # is correctly read through the module configuration
     */
    it("is correctly read through the module configuration", function() {
      expect(dashboard._initViews).toBeDefined();
      expect(dashboard.viewParameters).toEqual({});
      expect(dashboard.view).toEqual(viewObj);
    });

    /**
     * ## Dashboard Views # is correctly read through the Dashboard constructor
     */
    it("is correctly read through the Dashboard constructor", function() {
      viewObj.param = 2;
      var dashboard2 = new Dashboard({view: viewObj});
      expect(dashboard2.view).toEqual(viewObj);
    });
  });
});
