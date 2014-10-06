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

define(["cdf/Dashboard", "cdf/components/JFreeChartComponent"],
  function(Dashboard, JFreeChartComponent) {
  
  /**
   * ## The JFreeChart Component
   */
  describe("The JFreeChart Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var topTenCustomers = new JFreeChartComponent(myDashboard, {
      name: "topTenCustomers",
      type: "jFreeChartComponent",
      chartDefinition: MetaLayerHome2.topTenCustomerDefinition,
      htmlObject: "sampleObject",
      executeAtStart: true
    });

    myDashboard.addComponent(topTenCustomers);

    /**
     * ## The JFreeChart Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(topTenCustomers, 'update').and.callThrough();
      myDashboard.update(topTenCustomers);
      setTimeout(function() {
        expect(topTenCustomers.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
