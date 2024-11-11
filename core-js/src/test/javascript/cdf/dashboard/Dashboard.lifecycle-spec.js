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
   * ## The CDF framework Dashboard Lifecycle
   */
  describe("The CDF framework Dashboard Lifecycle #", function() {
    var dashboard;

    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     */
    beforeEach(function() {
      dashboard = new Dashboard();
    });
    //#end

    /**
     * Our setup consists of adding a bunch of components to CDF.
     */
    var shouldUpdate = new ManagedFreeformComponent({
      name: "shouldUpdate",
      type: "managedFreeform",
      executeAtStart: true,
      preExecution: function() {},
      customfunction: function() {},
      postExecution: function() {}
    });

    var shouldNotUpdate = new ManagedFreeformComponent({
      name: "shouldNotUpdate",
      type: "managedFreeform",
      preExecution: function() { return false; },
      customfunction: function() {},
      postExecution: function() {}
    });

    /************************
     * Test Core Lifecycle *
     ************************/

    /**
     * ## The CDF framework Dashboard Lifecycle # updates components
     */
    it("updates components", function(done) {
      dashboard.init();
      dashboard.addComponents([shouldUpdate, shouldNotUpdate]);

      spyOn(shouldUpdate, "preExecution").and.callThrough();
      //spyOn(shouldUpdate, "customfunction").and.callThrough();
      spyOn(shouldUpdate, "postExecution").and.callThrough();

      // listen to cdf:postExecution event
      shouldUpdate.once("cdf:postExecution", function() {
        expect(shouldUpdate.preExecution).toHaveBeenCalled();
        //expect(shouldUpdate.customfunction).toHaveBeenCalled();
        expect(shouldUpdate.postExecution).toHaveBeenCalled();
        done();
      });

      dashboard.update(shouldUpdate);
    });

    /**
     * ## The CDF framework Dashboard Lifecycle # by default doesn't ping the server and show timeout notifications [BACKLOG-5131]
     */
    it("by default doesn't ping the server and show timeout notifications [BACKLOG-5131]", function() {
      // default value
      expect(dashboard.serverCheckResponseTimeout).toEqual(Infinity);
      dashboard.init();
      // during init the value of context.sessionTimeout is passed via the "cdf/dashboard/Dashboard" AMD module configuration (see context.js)
      expect(dashboard.serverCheckResponseTimeout).toEqual(contextObj.sessionTimeout * 900); // 90% converted to milliseconds
    });

    /**
     * ## The CDF framework Dashboard Lifecycle # lets preExecution cancel updates
     */
    it("lets preExecution cancel updates", function(done) {
      dashboard.init();
      dashboard.addComponents([shouldUpdate, shouldNotUpdate]);

      spyOn(shouldNotUpdate, "preExecution").and.callThrough();
      spyOn(shouldNotUpdate, "customfunction").and.callThrough();
      spyOn(shouldNotUpdate, "postExecution").and.callThrough();

      // listen to cdf:preExecution event
      shouldUpdate.once("cdf:postExecution", function() {
        expect(shouldNotUpdate.preExecution).toHaveBeenCalled();
        expect(shouldNotUpdate.postExecution).not.toHaveBeenCalled();
        expect(shouldNotUpdate.customfunction).not.toHaveBeenCalled();
        done();
      });

      dashboard.update(shouldNotUpdate);
      dashboard.update(shouldUpdate);
    });

    /**
     * ## The CDF framework Dashboard Lifecycle # triggers postInit when all components have finished rendering
     */
    it("triggers postInit when all components have finished rendering", function(done) {
      dashboard.addComponents([shouldUpdate, shouldNotUpdate]);

      spyOn(dashboard, "_handlePostInit").and.callThrough();

      dashboard.waitingForInit = null;
      dashboard.finishedInit = false;

      // listen to cdf:postInit event
      dashboard.once("cdf:postInit", function() {
       expect(dashboard._handlePostInit).toHaveBeenCalled();
       done();
      });

      dashboard.init();
    });

    /**
     * ## Update Tier
     */
    describe("Update Tier #", function() {

      /**
       * ## Global settings for all suites.
       * #begin
       * - beforeEach
       */
      beforeEach(function() {
        dashboard.init();
      });
      //#end

      // comp<component number>priority<value>
      var comp1priority5 = new ManagedFreeformComponent({
        updateFlag: 0,
        preExecutionFlag: 0,
        postExecutionFlag: 0,
        name: "comp1priority5",
        type: "freeform",
        htmlObject: 'html-obj',
        priority: 5,
        executeAtStart: false,
        preExecution: function() { this.preExecutionFlag = 1; return true; },
        update: function() { this.updateFlag = 1; },
        postExecution: function() { this.postExecutionFlag = 1; },
        reset: function() {
          this.preExecutionFlag = 0;
          this.updateFlag = 0;
          this.postExecutionFlag = 0;
        }
      });
      var comp2priority5 = new ManagedFreeformComponent({
        updateFlag: 0,
        preExecutionFlag: 0,
        postExecutionFlag: 0,
        name: "comp2priority5",
        type: "freeform",
        htmlObject: 'html-obj',
        priority: 5,
        testFlag: 0,
        executeAtStart: true,
        preExecution: function() { this.preExecutionFlag = 1; return true; },
        update: function() { this.updateFlag = 1; },
        postExecution: function() { this.postExecutionFlag = 1; },
        reset: function() {
          this.preExecutionFlag = 0;
          this.updateFlag = 0;
          this.postExecutionFlag = 0;
        }
      });
      var comp3priority10 = new ManagedFreeformComponent({
        updateFlag: 0,
        preExecutionFlag: 0,
        postExecutionFlag: 0,
        name: "comp3priority10",
        type: "freeform",
        htmlObject: 'html-obj',
        priority: 10,
        testFlag: 0,
        executeAtStart: true,
        preExecution: function() { this.preExecutionFlag = 1; return true; },
        update: function() { this.updateFlag = 1; },
        postExecution: function() { this.postExecutionFlag = 1; },
        reset: function() {
          this.preExecutionFlag = 0;
          this.updateFlag = 0;
          this.postExecutionFlag = 0;
        }
      });

      /**
       * ## should return true when current object is comp1priority5 and updateTier array holds comp1priority5, comp2priority5 and comp3priority10
       */
      it("should return true when current object is comp1priority5 and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function() {

        var mockUpdateTiers = {5: [comp1priority5 , comp2priority5], 10: [comp3priority10]};

        var mockUpdateCurrent = {components: [comp1priority5], priority: comp1priority5.priority};

        var otherCompAwaitExecution = dashboard.othersAwaitExecution(mockUpdateTiers, mockUpdateCurrent);

        expect(otherCompAwaitExecution).toBeTruthy();
      });

      /**
       * ## should return false when current object is comp1priority5 and comp2priority5, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10
       */
      it("should return false when current object is comp1priority5 and comp2priority5, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function() {

        var mockUpdateTiers = {5: [comp1priority5 , comp2priority5], 10: [comp3priority10]};

        var mockUpdateCurrent = {components: [comp1priority5 , comp2priority5], priority: comp1priority5.priority};

        var otherCompAwaitExecution = dashboard.othersAwaitExecution(mockUpdateTiers, mockUpdateCurrent);

        expect(otherCompAwaitExecution).not.toBeTruthy();
      });

      /**
       * ## should return true when current object is comp3priority10, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10
       */
      it("should return true when current object is comp3priority10, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function() {

        var mockUpdateTiers = {5: [comp1priority5 , comp2priority5], 10: [comp3priority10]};

        var mockUpdateCurrent = {components: [comp3priority10], priority: comp3priority10.priority};

        var otherCompAwaitExecution = dashboard.othersAwaitExecution(mockUpdateTiers, mockUpdateCurrent);

        expect(otherCompAwaitExecution).toBeTruthy();
      });

      /**
       * ## should go through dashboard.updateAll handling only comp1priority5, with an empty updateTier array
       */
      it("should go through dashboard.updateAll handling only comp1priority5, with an empty updateTier array", function(done) {
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([comp1priority5, comp2priority5, comp3priority10]);
        
        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();

        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        // listen to cdf:postExecution event
        comp1priority5.once("cdf:postExecution", function() {
          // dashboard.updateAll call component.on when the updating begins (@see Dashboard.lifecycle:updateAll)
          expect(dashboard.updateComponent.calls.count()).toEqual(1); 

          expect(comp1priority5.preExecutionFlag).toEqual(1);
          expect(comp1priority5.updateFlag).toEqual(1);
          expect(comp1priority5.postExecutionFlag).toEqual(1);

          done();
        });

        // call dashboard.updateAll
        dashboard.updateAll([comp1priority5]);
      });

      /**
       * ## should go through dashboard.updateAll handling comp2priority5 and *not* comp1priority5 (because it's already in an updated status), with an updateTier array already holding comp1priority5 and a new update call made to comp2priority5
       */
      it("should go through dashboard.updateAll handling comp2priority5 and *not* comp1priority5 (because it's already in an updated status), with an updateTier array already holding comp1priority5 and a new update call made to comp2priority5", function(done) {
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([comp1priority5, comp2priority5, comp3priority10]);

        var mockUpdateTiers = {5: [comp1priority5]};

        var mockUpdateCurrent = {components: [comp1priority5], priority: comp1priority5.priority};

        dashboard.updating = {tiers: mockUpdateTiers, current: mockUpdateCurrent, updatingInFlight:[]};

        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();

        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        spyOn(comp2priority5, 'preExecution').and.callThrough();
        spyOn(comp2priority5, 'update').and.callThrough();
        spyOn(comp2priority5, 'postExecution').and.callThrough();

        // listen to cdf:postExecution event
        comp2priority5.once("cdf:postExecution", function() {
          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect(comp1priority5.update).not.toHaveBeenCalled();
          expect(comp1priority5.preExecution).not.toHaveBeenCalled();
          expect(comp1priority5.postExecution).not.toHaveBeenCalled();
          expect(comp1priority5.preExecutionFlag).toEqual(0);
          expect(comp1priority5.updateFlag).toEqual(0);
          expect(comp1priority5.postExecutionFlag).toEqual(0);

          // dashboard.updateAll call component.on when the updating begins (@see Dashboard.lifecycle:updateAll)
          expect(dashboard.updateComponent.calls.count()).toEqual(1); 

          expect(comp2priority5.update).toHaveBeenCalled();
          expect(comp2priority5.preExecution).toHaveBeenCalled();
          expect(comp2priority5.postExecution).toHaveBeenCalled();
          expect(comp2priority5.preExecutionFlag).toEqual(1);
          expect(comp2priority5.updateFlag).toEqual(1);
          expect(comp2priority5.postExecutionFlag).toEqual(1);

          done();
        });

        // call dashboard.updateAll
        dashboard.updateAll([comp2priority5]);

        // so: comp1priority5 is currently marked as executing, and comp2priority5 has just been triggered for update
        expect(dashboard.othersAwaitExecution).toBeTruthy();
      });

      /**
       * ## should go through dashboard.updateAll handling comp1priority5 and *only after comp1priority5's end* it should handle comp3priority10, when a call is made to comp3priority10 (due to its lower priority)", function(done) {
       */
      it("should go through dashboard.updateAll handling comp1priority5 and *only after comp1priority5's end* it should handle comp3priority10, when a call is made to comp3priority10 (due to its lower priority)", function(done) {
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([comp1priority5, comp2priority5, comp3priority10]);

        var mockUpdateTiers = {5: [comp1priority5]};

        var mockUpdateCurrent = null;

        dashboard.updating = {tiers: mockUpdateTiers, current: mockUpdateCurrent, updatingInFlight:[]};

        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();

        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        spyOn(comp3priority10, 'preExecution').and.callThrough();
        spyOn(comp3priority10, 'update').and.callThrough();
        spyOn(comp3priority10, 'postExecution').and.callThrough();

        // listen to cdf:postExecution event
        comp1priority5.once("cdf:postExecution", function() {
          // dashboard.updateAll calls updateComponent (@see Dashboard.components:updateAll)
          expect(dashboard.updateComponent.calls.count()).toEqual(1); 

          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect(comp1priority5.update).toHaveBeenCalled();
          expect(comp1priority5.preExecution).toHaveBeenCalled();
          expect(comp1priority5.postExecution).toHaveBeenCalled();
          expect(comp1priority5.preExecutionFlag).toEqual(1);
          expect(comp1priority5.updateFlag).toEqual(1);
          expect(comp1priority5.postExecutionFlag).toEqual(1);

          expect(comp3priority10.update).not.toHaveBeenCalled();
          expect(comp3priority10.preExecution).not.toHaveBeenCalled();
          expect(comp3priority10.postExecution).not.toHaveBeenCalled();
          expect(comp3priority10.preExecutionFlag).toEqual(0);
          expect(comp3priority10.updateFlag).toEqual(0);
          expect(comp3priority10.postExecutionFlag).toEqual(0);

          // (read: 1rst is comp1priority5, then is comp3priority10)
          expect(dashboard.othersAwaitExecution).toBeTruthy();
        });

        // listen to cdf:postExecution event
        comp3priority10.once("cdf:postExecution", function() {
          // dashboard.updateAll calls updateComponent (@see Dashboard.components:updateAll)
          // dashboard.updateAll has updated comp3priority10
          expect(dashboard.updateComponent.calls.count()).toEqual(2); 

          expect(comp1priority5.update).toHaveBeenCalled();
          expect(comp1priority5.preExecution).toHaveBeenCalled();
          expect(comp1priority5.postExecution).toHaveBeenCalled();
          expect(comp1priority5.preExecutionFlag).toEqual(1);
          expect(comp1priority5.updateFlag).toEqual(1);
          expect(comp1priority5.postExecutionFlag).toEqual(1);

          expect(comp3priority10.update).toHaveBeenCalled();
          expect(comp3priority10.preExecution).toHaveBeenCalled();
          expect(comp3priority10.postExecution).toHaveBeenCalled();
          expect(comp3priority10.preExecutionFlag).toEqual(1);
          expect(comp3priority10.updateFlag).toEqual(1);
          expect(comp3priority10.postExecutionFlag).toEqual(1);

          done();
        });

        // call dashboard.updateAll
        dashboard.updateAll([comp3priority10]); 

        // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
        // (read: 1rst is comp1priority5, then is comp3priority10)
        expect(dashboard.othersAwaitExecution).toBeTruthy();
      });

      /**
       * ## should go through dashboard.updateAll handling comp2priority5 and *not* comp1priority5 (as it is already under updating) and *only after comp2priority5's end* it should handle comp3priority10  (due to its lower priority), when a call is made to comp2priority5", function(done) {
       */
      it("should go through dashboard.updateAll handling comp2priority5 and *not* comp1priority5 (as it is already under updating) and *only after comp2priority5's end* it should handle comp3priority10  (due to its lower priority), when a call is made to comp2priority5", function(done) {
        //dashboard.updateQueue = undefined;
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([comp1priority5, comp2priority5, comp3priority10]);

        var mockUpdateTiers = {5: [comp1priority5], 10: [comp3priority10]};

        var mockUpdateCurrent = {components: [comp1priority5], priority: comp1priority5.priority};

        dashboard.updating = {tiers: mockUpdateTiers, current: mockUpdateCurrent, updatingInFlight:[]};

        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();

        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        spyOn(comp2priority5, 'preExecution').and.callThrough();
        spyOn(comp2priority5, 'update').and.callThrough();
        spyOn(comp2priority5, 'postExecution').and.callThrough();

        spyOn(comp3priority10, 'preExecution').and.callThrough();
        spyOn(comp3priority10, 'update').and.callThrough();
        spyOn(comp3priority10, 'postExecution').and.callThrough();

        // listen to cdf:postExecution event
        comp1priority5.once("cdf:postExecution", function() {
          // dashboard.updateAll calls updateComponent (@see Dashboard.components:updateAll)
          expect(dashboard.updateComponent.calls.count()).toEqual(1);

          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect(comp1priority5.preExecutionFlag).toEqual(0);
          expect(comp1priority5.updateFlag).toEqual(0);
          expect(comp1priority5.postExecutionFlag).toEqual(0);

          // comp2priority5 has been marked for updating, and given that is has a hiher priority than comp3priority10, it should be triggered now
          expect(comp2priority5.preExecutionFlag).toEqual(1);
          expect(comp2priority5.updateFlag).toEqual(1);
          expect(comp2priority5.postExecutionFlag).toEqual(1);

          // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
          // (read: 1rst is comp2priority5, then is comp3priority10)
          expect(comp3priority10.preExecutionFlag).toEqual(0);
          expect(comp3priority10.updateFlag).toEqual(0);
          expect(comp3priority10.postExecutionFlag).toEqual(0);

          // (read: 1rst is comp2priority5, then is comp3priority10)
          expect(dashboard.othersAwaitExecution).toBeTruthy();
        });

        // listen to cdf:postExecution event
        comp3priority10.once("cdf:postExecution", function() {
          // dashboard.updateAll has updated comp3priority10
          expect(dashboard.updateComponent.calls.count()).toEqual(2);

          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect(comp1priority5.preExecutionFlag).toEqual(0);
          expect(comp1priority5.updateFlag).toEqual(0);
          expect(comp1priority5.postExecutionFlag).toEqual(0);

          // comp2priority5 has been marked for updating, and given that is has a hiher priority than comp3priority10, it should be triggered now
          expect(comp2priority5.preExecutionFlag).toEqual(1);
          expect(comp2priority5.updateFlag).toEqual(1);
          expect(comp2priority5.postExecutionFlag).toEqual(1);

          expect(comp3priority10.preExecutionFlag).toEqual(1);
          expect(comp3priority10.updateFlag).toEqual(1);
          expect(comp3priority10.postExecutionFlag).toEqual(1);

          done();
        });

        // call dashboard.updateAll
        dashboard.updateAll([comp2priority5]); 

        // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
        // (read: 1rst is comp2priority5, then is comp3priority10)
        expect(dashboard.othersAwaitExecution).toBeTruthy();
      });
    });

    /**
     * ## _initEngine function
     */
    describe("_initEngine function", function() {

      it("doesn't add the PostInitMarker component if no components were added to the dashboard", function() {
        spyOn(dashboard, "addComponent").and.callThrough();
        expect(dashboard.getComponent("PostInitMarker")).toEqual(undefined);

        dashboard._initEngine();

        expect(dashboard.addComponent).not.toHaveBeenCalled();
        expect(dashboard.getComponent("PostInitMarker")).toEqual(undefined);
      });

      it("doesn't add the PostInitMarker component if the components added to the dashboard don't have the executeAtStart flag set to true", function() {
        spyOn(dashboard, "addComponent").and.callThrough();
        expect(dashboard.getComponent("PostInitMarker")).toEqual(undefined);

        dashboard.addComponent(shouldNotUpdate);
        dashboard._initEngine();

        expect(dashboard.addComponent).toHaveBeenCalled();
        expect(dashboard.getComponent("PostInitMarker")).toEqual(undefined);
      });

      it("adds the PostInitMarker component if more components were added to the dashboard with the executeAtStart flag set to true", function() {
        spyOn(dashboard, 'addComponent').and.callThrough();
        expect(dashboard.getComponent("PostInitMarker")).toEqual(undefined);

        dashboard.addComponent(shouldUpdate);
        dashboard._initEngine();

        expect(dashboard.addComponent).toHaveBeenCalled();
        expect(dashboard.getComponent("PostInitMarker")).not.toEqual(undefined);
      });
    });
  });
});
