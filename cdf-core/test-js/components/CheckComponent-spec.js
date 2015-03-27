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

define(["cdf/Dashboard.Clean", "cdf/components/CheckComponent"],
  function(Dashboard, CheckComponent) {
  
  /**
   * ## The Check Component
   */
  describe("The Check Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("input", "");

    dashboard.init();

    var checkComponent = new CheckComponent({
      name: "checkComponent",
      type: "checkComponent",
      parameters:[],
      path: "/public/plugin-samples/pentaho-cdf/20-samples/sample_dashboard_broadcast/regions.xaction",
      parameter: "region",
      separator: ",&nbsp;",
      valueAsId: true,
      htmlObject: "sampleObject",
      executeAtStart: true,
      postChange: function() {
        alert("you chose: " + this.dashboard.getParameterValue(this.parameter));
      }
    });

    dashboard.addComponent(checkComponent);

    /**
     * ## The Check Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(checkComponent, 'update').and.callThrough();
      dashboard.update(checkComponent);
      setTimeout(function() {
        expect(checkComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
