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

define(["cdf/Dashboard.Clean", "cdf/components/MapBubbleComponent"],
  function(Dashboard, MapBubbleComponent) {

  /**
   * ## The Map Bubble Component
   */
  describe("The Text Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter( "city", "");
    dashboard.addParameter( "selectedPoint", "");

    // For testing porpuses
    dashboard.addParameter('mapData', new Array());

    dashboard.init();

    var mapBubble = new MapBubbleComponent({
      name: "mapBubble",
      type: "mapBubble",
      listeners: ["selectedPoint"],
      path: "/public/plugin-samples/pentaho-cdf-require/30-documentation/30-component_reference/30-map/33-MapBubble/cityDetails.xaction",
      parameters: [["city","selectedPoint"]],
      executeAtStart: false,
      preExecution:function() {},
      postExecution:function() {}
    });

    dashboard.addComponent(mapBubble);

    /**
     * ## The Map Bubble Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(mapBubble, 'update').and.callThrough();
      dashboard.update(mapBubble);
      setTimeout(function() {
        expect(mapBubble.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
