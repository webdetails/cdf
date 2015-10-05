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

define([
  "cdf/Dashboard.Clean",
  "cdf/components/MapBubbleComponent"
], function(Dashboard, MapBubbleComponent) {

  /**
   * ## The Map Bubble Component
   */
  describe("The Text Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("city", "");
    dashboard.addParameter("selectedPoint", "");

    // For testing porpuses
    dashboard.addParameter("mapData", new Array());

    dashboard.init();

    var mapBubbleComponent = new MapBubbleComponent({
      name: "mapBubble",
      type: "mapBubble",
      listeners: ["selectedPoint"],
      path: "/fake/cityDetails.xaction",
      parameters: [["city", "selectedPoint"]],
      executeAtStart: false,
      preExecution: function() {},
      postExecution: function() {}
    });

    dashboard.addComponent(mapBubbleComponent);

    /**
     * ## The Map Bubble Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(mapBubbleComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      mapBubbleComponent.once("cdf:postExecution", function() {
        expect(mapBubbleComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(mapBubbleComponent);
    });
  });
});
