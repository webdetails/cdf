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

define(["cdf/Dashboard.Clean", "cdf/components/NavigatorComponent"],
  function(Dashboard, NavigatorComponent) {

  /**
   * ## The Navigator Component
   */
  describe("The Navigator Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var navigatorComponent = new NavigatorComponent({
      name: "navigatorMenu",
      type: "navigator",
      listeners:[],
      htmlObject: "sampleObject",
      executeAtStart: true,
      mode: "horizontal",
      includeSolutions: true
    });

    dashboard.addComponent(navigatorComponent);

    /**
     * ## The Navigator Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(navigatorComponent, 'update').and.callThrough();
      dashboard.update(navigatorComponent);
      setTimeout(function() {
        expect(navigatorComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
