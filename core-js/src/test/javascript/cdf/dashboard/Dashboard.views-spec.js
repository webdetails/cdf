/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


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
