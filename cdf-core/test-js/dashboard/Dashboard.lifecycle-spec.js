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

define(["cdf/Dashboard", "cdf/lib/jquery", "cdf/lib/underscore", "cdf/components/ManagedFreeformComponent"],
  function(Dashboard, $, _, ManagedFreeformComponent) {

  /**
   * ## The CDF framework Dashboard Lifecycle
   */
  describe("The CDF framework Dashboard Lifecycle #", function() {
    /**
     * ## Global settings for all suites.
     * #begin
     * - beforeEach
     * - afterEach
     */
    beforeEach(function(done){
      var a = 0;
      setTimeout(function(){
        a = 1;
      }, 50);
      done();
    });
  
    afterEach(function(done){
      var a = 0;
      setTimeout(function(){
        a = 1;
      }, 50);
      done();
    });
    //#end
  
  
    var dashboard = new Dashboard();
  
    /*
     * Our setup consists of adding a bunch of components to CDF.
     */
    dashboard.init();
    var shouldUpdate = new ManagedFreeformComponent(dashboard, {
      name: "shouldUpdate",
      type: "managedFreeform",
      preExecution: function() {},
      customfunction: function() {},
      postExecution: function(){}
    });


    var shouldNotUpdate =  new ManagedFreeformComponent(dashboard, {
      name: "shouldNotUpdate",
      type: "managedFreeform",
      preExecution: function() {return false;},
      customfunction: function() {},
      postExecution: function(){}
    });
  
      
  
    dashboard.addComponents([shouldUpdate, shouldNotUpdate]);
  
    /************************
     * Test Core Lifecycle  *
     ************************/
    /**
     * ## The CDF framework Dashboard Lifecycle # Updates Components
     */
    it("Updates Components",function(done) {
      spyOn(shouldUpdate,"preExecution").and.callThrough();
      spyOn(shouldUpdate,"customfunction").and.callThrough();
      spyOn(shouldUpdate,"postExecution").and.callThrough();
  
      //Update
      dashboard.update(shouldUpdate);
  
      //Data to validate
      var dataToValidate = function(){
        expect(shouldUpdate.preExecution).toHaveBeenCalled();
        expect(shouldUpdate.postExecution).toHaveBeenCalled();
        expect(shouldUpdate.customfunction).toHaveBeenCalled();
        done();
      };
  
      setTimeout(dataToValidate, 100);
    });
    /**
     * ## The CDF framework Dashboard Lifecycle # Lets preExecution cancel updates
     */
    it("Lets preExecution cancel updates",function(done) {
      spyOn(shouldNotUpdate,"preExecution").and.callThrough();
      spyOn(shouldNotUpdate,"customfunction").and.callThrough();
      spyOn(shouldNotUpdate,"postExecution").and.callThrough();
  
      //Update
      dashboard.update(shouldNotUpdate);
  
      //Data to validate
      var dataToValidate = function(){
        expect(shouldNotUpdate.preExecution).toHaveBeenCalled();
        expect(shouldNotUpdate.postExecution).not.toHaveBeenCalled();
        expect(shouldNotUpdate.customfunction).not.toHaveBeenCalled();
        done();
      };
  
      setTimeout(dataToValidate, 100);
    });

    /**
     * ## The CDF framework Dashboard Lifecycle # Triggers postInit when all components have finished rendering
     */
    it("Triggers postInit when all components have finished rendering", function(done) {
     spyOn(dashboard, "_handlePostInit");
  
     dashboard.waitingForInit = null;
     dashboard.finishedInit = false;
     dashboard.init();
  
     //Data to validate
     var dataToValidate = function(){
       expect(dashboard._handlePostInit).toHaveBeenCalled();
       done();
     };
  
     setTimeout(dataToValidate, 500);
    });

    /**
     * ## Paralel query calls #
     */
    describe("function othersAwaitExecution() behaviour unit testing #", function() {

      var dashboard = new Dashboard();

      // component<number>priority<value>
      var comp1priority5 = window.basic = {
        updateFlag: 0,
        preExecutionFlag: 0,
        postExecutionFlag: 0,
        name: "comp1priority5",
        type: "freeform",
        htmlObject: 'html-obj',
        priority: 5,
        executeAtStart: false,
        startTimer: function() {},
        on: function() {},
        off: function() {},
        trigger: function( trigger, obj, bool ) { 
          if( trigger.indexOf('cdf:preExecution') > 0 ){ this.preExecution(); } 
          if( trigger.indexOf('cdf:postExecution') > 0 ){ this.postExecution(); }
        },
        preExecution: function() { this.preExecutionFlag = 1; return true; },
        update: function() { this.updateFlag = 1; },
        postExecution: function() { this.postExecutionFlag = 1; },
        reset: function(){
          this.preExecutionFlag = 0;
          this.updateFlag = 0;
          this.postExecutionFlag = 0;
        }
      };

      // component<number>priority<value>
      var comp2priority5 = window.basic = {
        updateFlag: 0,
        preExecutionFlag: 0,
        postExecutionFlag: 0,
        name: "comp2priority5",
        type: "freeform",
        htmlObject: 'html-obj',
        priority: 5,
        testFlag: 0,
        executeAtStart: true,
        startTimer: function() {},
        on: function() {},
        off: function() {},
        trigger: function( trigger, obj, bool ) {
          if( trigger.indexOf('cdf:preExecution') > 0 ){ this.preExecution(); } 
          if( trigger.indexOf('cdf:postExecution') > 0 ){ this.postExecution(); } 
        },
        preExecution: function() { this.preExecutionFlag = 1; return true; },
        update: function() { this.updateFlag = 1; },
        postExecution: function() { this.postExecutionFlag = 1; },
        reset: function(){
          this.preExecutionFlag = 0;
          this.updateFlag = 0;
          this.postExecutionFlag = 0;
        }
      };

      // component<number>priority<value>
      var comp3priority10 = window.basic = {
        updateFlag: 0,
        preExecutionFlag: 0,
        postExecutionFlag: 0,
        name: "comp3priority10",
        type: "freeform",
        htmlObject: 'html-obj',
        priority: 10,
        testFlag: 0,
        executeAtStart: true,
        on: function() {},
        off: function() {},  
        trigger: function( trigger, obj, bool ) {
          if( trigger.indexOf('cdf:preExecution') > 0 ){ this.preExecution(); } 
          if( trigger.indexOf('cdf:postExecution') > 0 ){ this.postExecution(); } 
        },
        startTimer: function() {},
        preExecution: function() { this.preExecutionFlag = 1; return true; },
        update: function() { this.updateFlag = 1; },
        postExecution: function() { this.postExecutionFlag = 1; },
        reset: function(){
          this.preExecutionFlag = 0;
          this.updateFlag = 0;
          this.postExecutionFlag = 0;
        }
      };

      it("Should return true when current object is comp1priority5 and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function(){

        var mockUpdateTiers = { 5:  [ comp1priority5 , comp2priority5 ], 10: [ comp3priority10 ] };

        var mockUpdateCurrent = { components: [ comp1priority5  ], priority: comp1priority5.priority };

        var otherCompAwaitExecution = dashboard.othersAwaitExecution( mockUpdateTiers, mockUpdateCurrent );

        expect( otherCompAwaitExecution ).toBeTruthy();
      });

      it("Should return false when current object is comp1priority5 and comp2priority5, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function(){

        var mockUpdateTiers = { 5:  [ comp1priority5 , comp2priority5 ], 10: [ comp3priority10 ] };

        var mockUpdateCurrent = { components: [ comp1priority5 , comp2priority5 ], priority: comp1priority5.priority };

        var otherCompAwaitExecution = dashboard.othersAwaitExecution( mockUpdateTiers, mockUpdateCurrent );

        expect( otherCompAwaitExecution ).not.toBeTruthy();
      });

      it("Should return true when current object is comp3priority10, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function(){

        var mockUpdateTiers = { 5:  [ comp1priority5 , comp2priority5 ], 10: [ comp3priority10 ] };

        var mockUpdateCurrent = { components: [ comp3priority10 ], priority: comp3priority10.priority };

        var otherCompAwaitExecution = dashboard.othersAwaitExecution( mockUpdateTiers, mockUpdateCurrent );

        expect( otherCompAwaitExecution ).toBeTruthy();
      });

      it("Should go through Dashboard.updateAll handling only comp1priority5, with an empty updateTier array", function(done){

        dashboard.updating = undefined;
        dashboard.updateQueue = undefined;
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([ comp1priority5, comp2priority5, comp3priority10 ]);
        
        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();

        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        // call Dashboard.updateAll
        dashboard.updateAll( [ comp1priority5 ] );

        var validate = function(){

          // Dashboard.updateAll call component.on when the updating begins (@see Dashboard.lifecycle:updateAll)
          expect( dashboard.updateComponent.calls.count() ).toEqual( 1 ); 

          expect( comp1priority5.preExecutionFlag ).toEqual( 1 );
          expect( comp1priority5.updateFlag ).toEqual( 1 );
          expect( comp1priority5.postExecutionFlag ).toEqual( 1 );

          done();
        }

        setTimeout( validate, 100 ); 
      });

      it("Should go through Dashboard.updateAll handling comp2priority5 and *not* comp1priority5 (because it's already in an updated status), with an updateTier array already holding comp1priority5 and a new update call made to comp2priority5", function(done){

        var dashboard = new Dashboard();

        dashboard.updateQueue = undefined;
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([ comp1priority5, comp2priority5, comp3priority10 ]);

        var mockUpdateTiers = {  5:  [ comp1priority5 ] };

        var mockUpdateCurrent = { components: [ comp1priority5 ], priority: comp1priority5.priority };

        dashboard.updating = { tiers: mockUpdateTiers, current: mockUpdateCurrent };
            
        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();    
        
        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        spyOn(comp2priority5, 'preExecution').and.callThrough();
        spyOn(comp2priority5, 'update').and.callThrough();
        spyOn(comp2priority5, 'postExecution').and.callThrough();

        // call Dashboard.updateAll
        dashboard.updateAll( [ comp2priority5 ] );

        // so: comp1priority5 is currently marked as executing, and comp2priority5 has just been triggered for update
        expect( dashboard.othersAwaitExecution ).toBeTruthy();

        var validateUpdateCycle = function(){

          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect( comp1priority5.preExecutionFlag ).toEqual( 0 );
          expect( comp1priority5.updateFlag ).toEqual( 0 );
          expect( comp1priority5.postExecutionFlag ).toEqual( 0 );

          // Dashboard.updateAll call component.on when the updating begins (@see Dashboard.lifecycle:updateAll)
          expect( dashboard.updateComponent.calls.count() ).toEqual( 1 ); 

          expect( comp2priority5.preExecutionFlag ).toEqual( 1 );
          expect( comp2priority5.updateFlag ).toEqual( 1 );
          expect( comp2priority5.postExecutionFlag ).toEqual( 1 );

          done();
        }

        setTimeout( validateUpdateCycle, 100 ); 

      });

      it("Should go through Dashboard.updateAll handling comp1priority5 and *only after comp1priority5's end* it should handle comp3priority10, when a call is made to comp3priority10 (due to its lower priority)", function(done){

        var dashboard = new Dashboard();

        dashboard.updateQueue = undefined;
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([ comp1priority5, comp2priority5, comp3priority10 ]);

        var mockUpdateTiers = {  5:  [ comp1priority5 ] };

        var mockUpdateCurrent = null;

        dashboard.updating = { tiers: mockUpdateTiers, current: mockUpdateCurrent };
            
        spyOn(dashboard, 'othersAwaitExecution').and.callThrough();
        spyOn(dashboard, 'updateComponent').and.callThrough();    
        
        spyOn(comp1priority5, 'preExecution').and.callThrough();
        spyOn(comp1priority5, 'update').and.callThrough();
        spyOn(comp1priority5, 'postExecution').and.callThrough();

        spyOn(comp3priority10, 'preExecution').and.callThrough();
        spyOn(comp3priority10, 'update').and.callThrough();
        spyOn(comp3priority10, 'postExecution').and.callThrough();

        // call Dashboard.updateAll
        dashboard.updateAll( [ comp3priority10 ] ); 
     
        // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
        // ( read: 1rst is comp1priority5, then is comp3priority10 )
        expect( dashboard.othersAwaitExecution ).toBeTruthy();

        var validateUpdateCycle = function(){

          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect( comp1priority5.preExecutionFlag ).toEqual( 1 );
          expect( comp1priority5.updateFlag ).toEqual( 1 );
          expect( comp1priority5.postExecutionFlag ).toEqual( 1 );

          expect( comp3priority10.preExecutionFlag ).toEqual( 0 );
          expect( comp3priority10.updateFlag ).toEqual( 0 );
          expect( comp3priority10.postExecutionFlag ).toEqual( 0 );

          // Dashboard.updateAll calls updateComponent (@see Dashboard.main:updateAll)
          expect( dashboard.updateComponent.calls.count() ).toEqual( 1 ); 

          // we need to do this by hand because we cannot mock this (Dashboard.Main:1107)
          /*
           * var current = this.updating.current;
           * current.components = _.without(current.components, component);
           * var tiers = this.updating.tiers;
           * tiers[current.priority] = _.without(tiers[current.priority], component);
           * this.updateAll();
           */
           debugger;
          var current = dashboard.updating.current;
          current.components = _.without(current.components, comp1priority5);
          var tiers = dashboard.updating.tiers;
          tiers[current.priority] = _.without(tiers[current.priority], comp1priority5);
          dashboard.updateAll();

        }

        var validateNextUpdateCycle = function(){

          // Dashboard.updateAll has updated comp3priority10
          expect( dashboard.updateComponent.calls.count() ).toEqual( 2 ); 

          expect( comp3priority10.preExecutionFlag ).toEqual( 1 );
          expect( comp3priority10.updateFlag ).toEqual( 1 );
          expect( comp3priority10.postExecutionFlag ).toEqual( 1 );

          done();
        }

        setTimeout( validateUpdateCycle, 100 );
        setTimeout( validateNextUpdateCycle, 200 ); 

      });


      it("Should go through Dashboard.updateAll handling comp2priority5 and *not* comp1priority5 (as it is already under updating) and *only after comp2priority5's end* it should handle comp3priority10  (due to its lower priority), when a call is made to comp2priority5", function(done){

        var dashboard = new Dashboard();

        dashboard.updateQueue = undefined;
        comp1priority5.reset();
        comp2priority5.reset();
        comp3priority10.reset();

        dashboard.addComponents([ comp1priority5, comp2priority5, comp3priority10 ]);

        var mockUpdateTiers = {  5:  [ comp1priority5 ], 10: [ comp3priority10 ] };

        var mockUpdateCurrent = { components: [ comp1priority5 ], priority: comp1priority5.priority };

        dashboard.updating = { tiers: mockUpdateTiers, current: mockUpdateCurrent };
            
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

        // call Dashboard.updateAll
        dashboard.updateAll( [ comp2priority5 ] ); 
     
        // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
        // ( read: 1rst is comp2priority5, then is comp3priority10 )
        expect( dashboard.othersAwaitExecution ).toBeTruthy();

        var validateUpdateCycle = function(){

          // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
          expect( comp1priority5.preExecutionFlag ).toEqual( 0 );
          expect( comp1priority5.updateFlag ).toEqual( 0 );
          expect( comp1priority5.postExecutionFlag ).toEqual( 0 );

          // comp2priority5 has been marked for updating, and given that is has a hiher priority than comp3priority10, it should be triggered now
          expect( comp2priority5.preExecutionFlag ).toEqual( 1 );
          expect( comp2priority5.updateFlag ).toEqual( 1 );
          expect( comp2priority5.postExecutionFlag ).toEqual( 1 );

          // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
          // ( read: 1rst is comp2priority5, then is comp3priority10 )
          expect( comp3priority10.preExecutionFlag ).toEqual( 0 );
          expect( comp3priority10.updateFlag ).toEqual( 0 );
          expect( comp3priority10.postExecutionFlag ).toEqual( 0 );

          // Dashboard.updateAll calls updateComponent (@see Dashboard.main:updateAll)
          expect( dashboard.updateComponent.calls.count() ).toEqual( 1 ); 

          // we need to do this by hand because we cannot mock this (Dashboard.lifecycle:506)
          /*
           * var current = this.updating.current;
           * current.components = _.without(current.components, component);
           * var tiers = this.updating.tiers;
           * tiers[current.priority] = _.without(tiers[current.priority], component);
           * this.updateAll();
           */

          var current = dashboard.updating.current;
          current.components = _.without(current.components, comp2priority5);
          var tiers = dashboard.updating.tiers;
          tiers[current.priority] = _.without(tiers[current.priority], comp2priority5);
          dashboard.updateAll();

        }

        var validateNextUpdateCycle = function(){

          // Dashboard.updateAll has updated comp3priority10
          expect( dashboard.updateComponent.calls.count() ).toEqual( 2 ); 

          expect( comp3priority10.preExecutionFlag ).toEqual( 1 );
          expect( comp3priority10.updateFlag ).toEqual( 1 );
          expect( comp3priority10.postExecutionFlag ).toEqual( 1 );

          done();
        }

        setTimeout( validateUpdateCycle, 100 );
        setTimeout( validateNextUpdateCycle, 200 ); 

      });
    });
  });

});
