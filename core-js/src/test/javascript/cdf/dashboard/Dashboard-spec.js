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


define([
  "cdf/Dashboard.Clean",
  "cdf/components/ManagedFreeformComponent"
], function(Dashboard, ManagedFreeformComponent) {

  /**
   * ## The CDF framework Dashboard
   */
  describe("The CDF framework Dashboard #", function() {
    var dashboard;

    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     */
    beforeEach(function() {
      dashboard = new Dashboard();
      dashboard.init();
    });
    //#end

    /**
     * Our setup consists of adding a bunch of components to CDF.
     */
    var component = new ManagedFreeformComponent({
      name: "shouldUpdate",
      type: "managedFreeform",
      executeAtStart: true,
      preExecution: function() {},
      customfunction: function() {},
      postExecution: function() {}
    });

    /************************
     * Test Dashboard       *
     ************************/

    /**
     * ## The CDF framework Dashboard # disposes correctly
     */
    it("disposes correctly", function(done) {
      dashboard.addComponents([component]);
      var eventFunction = function(){};
      dashboard.registerEvent( "dummy event", eventFunction);

      spyOn(dashboard, "dispose").and.callThrough();
      spyOn(dashboard.refreshEngine, "dispose").and.callThrough();
      spyOn(dashboard, "_disposeComponents").and.callThrough();
      spyOn(dashboard, "_disposeStorage").and.callThrough();
      spyOn(dashboard, "_disposeParameters").and.callThrough();
      spyOn(dashboard, "_disposeViews").and.callThrough();

      expect(dashboard.refreshEngine).toBeDefined();
      expect(dashboard.components.length).toEqual(1);
      expect(dashboard.events["dummy event"]).toBeTruthy();
      expect(dashboard.events["dummy event"]).toEqual(eventFunction);

      dashboard.dispose();

      expect(dashboard.dispose).toHaveBeenCalled();
      expect(dashboard.refreshEngine.dispose).toHaveBeenCalled();
      expect(dashboard.events["dummy event"]).toEqual(undefined);
      expect(dashboard._disposeComponents).toHaveBeenCalled();
      expect(dashboard.components.length).toEqual(0);
      expect(dashboard._disposeStorage).toHaveBeenCalled();
      expect(dashboard._disposeParameters).toHaveBeenCalled();
      expect(dashboard._disposeViews).toHaveBeenCalled();

      done();
    });
  });
});
