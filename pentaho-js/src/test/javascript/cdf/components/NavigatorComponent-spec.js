/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



define([
  "cdf/Dashboard.Clean",
  "cdf/components/NavigatorComponent"
], function(Dashboard, NavigatorComponent) {

  /**
   * ## The Navigator Component
   */
  describe("The Navigator Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var navigatorComponent = new NavigatorComponent({
      name: "navigatorMenu",
      type: "navigator",
      listeners: [],
      htmlObject: "sampleObjectNavigator",
      executeAtStart: true,
      mode: "horizontal",
      includeSolutions: true
    });

    dashboard.addComponent(navigatorComponent);

    /**
     * ## The Navigator Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(navigatorComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      navigatorComponent.once("cdf:postExecution", function() {
        expect(navigatorComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(navigatorComponent);
    });
  });
});
