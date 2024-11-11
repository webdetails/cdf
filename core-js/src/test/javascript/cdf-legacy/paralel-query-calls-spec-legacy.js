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
/**
 * ## Paralel query calls #
 */
describe("Dashboards.othersAwaitExecution behaviour unit testing #", function() {

  var mockDashboard = _.extend({},Dashboards);

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

  it("Should return true when current object is comp1priority5 and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function(done){

    var mockUpdateTiers = { 5:  [ comp1priority5 , comp2priority5 ], 10: [ comp3priority10 ] };

    var mockUpdateCurrent = { components: [ comp1priority5  ], priority: comp1priority5.priority };

    var otherCompAwaitExecution = Dashboards.othersAwaitExecution( mockUpdateTiers, mockUpdateCurrent );

    expect( otherCompAwaitExecution ).toBeTruthy();
    done();
  });

  it("Should return false when current object is comp1priority5 and comp2priority5, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function(done){

    var mockUpdateTiers = { 5:  [ comp1priority5 , comp2priority5 ], 10: [ comp3priority10 ] };

    var mockUpdateCurrent = { components: [ comp1priority5 , comp2priority5 ], priority: comp1priority5.priority };

    var otherCompAwaitExecution = Dashboards.othersAwaitExecution( mockUpdateTiers, mockUpdateCurrent );

    expect( otherCompAwaitExecution ).not.toBeTruthy();
    done();
  });

  it("Should return true when current object is comp3priority10, and updateTier array holds comp1priority5, comp2priority5 and comp3priority10", function(done){

    var mockUpdateTiers = { 5:  [ comp1priority5 , comp2priority5 ], 10: [ comp3priority10 ] };

    var mockUpdateCurrent = { components: [ comp3priority10 ], priority: comp3priority10.priority };

    var otherCompAwaitExecution = Dashboards.othersAwaitExecution( mockUpdateTiers, mockUpdateCurrent );

    expect( otherCompAwaitExecution ).toBeTruthy();
    done();
  });

  it("Should go through Dashboards.updateAll handling only comp1priority5, with an empty updateTier array", function(done){

    mockDashboard.updating = undefined;
    mockDashboard.updateQueue = undefined;
    comp1priority5.reset();
    comp2priority5.reset();
    comp3priority10.reset();

    mockDashboard.components = [ comp1priority5, comp2priority5, comp3priority10 ];

    spyOn(mockDashboard, 'othersAwaitExecution').and.callThrough();
    spyOn(mockDashboard, 'updateComponent').and.callThrough();

    spyOn(comp1priority5, 'preExecution').and.callThrough();
    spyOn(comp1priority5, 'update').and.callThrough();
    spyOn(comp1priority5, 'postExecution').and.callThrough();

    // call Dashboards.updateAll
    mockDashboard.updateAll( [ comp1priority5 ] );

    var validate = function(){

      // Dashboards.updateAll call component.on when the updating begins (@see Dashboards.main:updateAll)
      expect( mockDashboard.updateComponent.calls.count() ).toEqual( 1 );

      expect( comp1priority5.preExecutionFlag ).toEqual( 1 );
      expect( comp1priority5.updateFlag ).toEqual( 1 );
      expect( comp1priority5.postExecutionFlag ).toEqual( 1 );

      done();
    }

    setTimeout( validate, 100 );
  });

  it("Should go through Dashboards.updateAll handling comp2priority5 and *not* comp1priority5 (because it's already in an updated status), with an updateTier array already holding comp1priority5 and a new update call made to comp2priority5", function(done){

    var mockDashboard = _.extend({},Dashboards);

    mockDashboard.updateQueue = undefined;
    comp1priority5.reset();
    comp2priority5.reset();
    comp3priority10.reset();

    mockDashboard.components = [ comp1priority5, comp2priority5, comp3priority10 ];

    var mockUpdateTiers = {  5:  [ comp1priority5 ] };

    var mockUpdateCurrent = { components: [ comp1priority5 ], priority: comp1priority5.priority };

    mockDashboard.updating = { tiers: mockUpdateTiers, current: mockUpdateCurrent, updatingInFlight:[] };

    spyOn(mockDashboard, 'othersAwaitExecution').and.callThrough();
    spyOn(mockDashboard, 'updateComponent').and.callThrough();

    spyOn(comp1priority5, 'preExecution').and.callThrough();
    spyOn(comp1priority5, 'update').and.callThrough();
    spyOn(comp1priority5, 'postExecution').and.callThrough();

    spyOn(comp2priority5, 'preExecution').and.callThrough();
    spyOn(comp2priority5, 'update').and.callThrough();
    spyOn(comp2priority5, 'postExecution').and.callThrough();

    // call Dashboards.updateAll
    mockDashboard.updateAll( [ comp2priority5 ] );

    // so: comp1priority5 is currently marked as executing, and comp2priority5 has just been triggered for update
    expect( mockDashboard.othersAwaitExecution ).toBeTruthy();

    var validateUpdateCycle = function(){

      // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
      expect( comp1priority5.preExecutionFlag ).toEqual( 0 );
      expect( comp1priority5.updateFlag ).toEqual( 0 );
      expect( comp1priority5.postExecutionFlag ).toEqual( 0 );

      // Dashboards.updateAll call component.on when the updating begins (@see Dashboards.main:updateAll)
      expect( mockDashboard.updateComponent.calls.count() ).toEqual( 1 );

      expect( comp2priority5.preExecutionFlag ).toEqual( 1 );
      expect( comp2priority5.updateFlag ).toEqual( 1 );
      expect( comp2priority5.postExecutionFlag ).toEqual( 1 );

      done();
    }

    setTimeout( validateUpdateCycle, 100 );

  });

  it("Should go through Dashboards.updateAll handling comp1priority5 and *only after comp1priority5's end* it should handle comp3priority10, when a call is made to comp3priority10 (due to its lower priority)", function(done){

    var mockDashboard = _.extend({},Dashboards);

    mockDashboard.updateQueue = undefined;
    comp1priority5.reset();
    comp2priority5.reset();
    comp3priority10.reset();

    mockDashboard.components = [ comp1priority5, comp2priority5, comp3priority10 ];

    var mockUpdateTiers = {  5:  [ comp1priority5 ] };

    var mockUpdateCurrent = null;

    mockDashboard.updating = { tiers: mockUpdateTiers, current: mockUpdateCurrent, updatingInFlight:[] };

    spyOn(mockDashboard, 'othersAwaitExecution').and.callThrough();
    spyOn(mockDashboard, 'updateComponent').and.callThrough();

    spyOn(comp1priority5, 'preExecution').and.callThrough();
    spyOn(comp1priority5, 'update').and.callThrough();
    spyOn(comp1priority5, 'postExecution').and.callThrough();

    spyOn(comp3priority10, 'preExecution').and.callThrough();
    spyOn(comp3priority10, 'update').and.callThrough();
    spyOn(comp3priority10, 'postExecution').and.callThrough();

    // call Dashboards.updateAll
    mockDashboard.updateAll( [ comp3priority10 ] );

    // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
    // ( read: 1rst is comp1priority5, then is comp3priority10 )
    expect( mockDashboard.othersAwaitExecution ).toBeTruthy();

    var validateUpdateCycle = function(){

      // comp1priority5 had already been updated and consequently marked as dashboards.updating.current, so no updating should be done for it
      expect( comp1priority5.preExecutionFlag ).toEqual( 1 );
      expect( comp1priority5.updateFlag ).toEqual( 1 );
      expect( comp1priority5.postExecutionFlag ).toEqual( 1 );

      expect( comp3priority10.preExecutionFlag ).toEqual( 0 );
      expect( comp3priority10.updateFlag ).toEqual( 0 );
      expect( comp3priority10.postExecutionFlag ).toEqual( 0 );

      // Dashboards.updateAll calls updateComponent (@see Dashboards.main:updateAll)
      expect( mockDashboard.updateComponent.calls.count() ).toEqual( 1 );

      // we need to do this by hand because we cannot mock this (Dashboards.Main:1107)
      /*
       * var current = this.updating.current;
       * current.components = _.without(current.components, component);
       * var tiers = this.updating.tiers;
       * tiers[current.priority] = _.without(tiers[current.priority], component);
       * this.updateAll();
       */

      var current = mockDashboard.updating.current;
      current.components = _.without(current.components, comp1priority5);
      var tiers = mockDashboard.updating.tiers;
      tiers[current.priority] = _.without(tiers[current.priority], comp1priority5);
      mockDashboard.updateAll();

    }

    var validateNextUpdateCycle = function(){

      // Dashboards.updateAll has updated comp3priority10
      expect( mockDashboard.updateComponent.calls.count() ).toEqual( 2 );

      expect( comp3priority10.preExecutionFlag ).toEqual( 1 );
      expect( comp3priority10.updateFlag ).toEqual( 1 );
      expect( comp3priority10.postExecutionFlag ).toEqual( 1 );

      done();
    }

    setTimeout( validateUpdateCycle, 100 );
    setTimeout( validateNextUpdateCycle, 200 );

  });


  it("Should go through Dashboards.updateAll handling comp2priority5 and *not* comp1priority5 (as it is already under updating) and *only after comp2priority5's end* it should handle comp3priority10  (due to its lower priority), when a call is made to comp2priority5", function(done){

    var mockDashboard = _.extend({},Dashboards);

    mockDashboard.updateQueue = undefined;
    comp1priority5.reset();
    comp2priority5.reset();
    comp3priority10.reset();

    mockDashboard.components = [ comp1priority5, comp2priority5, comp3priority10 ];

    var mockUpdateTiers = {  5:  [ comp1priority5 ], 10: [ comp3priority10 ] };

    var mockUpdateCurrent = { components: [ comp1priority5 ], priority: comp1priority5.priority };

    mockDashboard.updating = { tiers: mockUpdateTiers, current: mockUpdateCurrent, updatingInFlight:[] };

    spyOn(mockDashboard, 'othersAwaitExecution').and.callThrough();
    spyOn(mockDashboard, 'updateComponent').and.callThrough();

    spyOn(comp1priority5, 'preExecution').and.callThrough();
    spyOn(comp1priority5, 'update').and.callThrough();
    spyOn(comp1priority5, 'postExecution').and.callThrough();

    spyOn(comp2priority5, 'preExecution').and.callThrough();
    spyOn(comp2priority5, 'update').and.callThrough();
    spyOn(comp2priority5, 'postExecution').and.callThrough();

    spyOn(comp3priority10, 'preExecution').and.callThrough();
    spyOn(comp3priority10, 'update').and.callThrough();
    spyOn(comp3priority10, 'postExecution').and.callThrough();

    // call Dashboards.updateAll
    mockDashboard.updateAll( [ comp2priority5 ] );

    // although comp3priority10 has been triggered for updating, it *should* be discarded from this execution cycle due to lower priority rate
    // ( read: 1rst is comp2priority5, then is comp3priority10 )
    expect( mockDashboard.othersAwaitExecution ).toBeTruthy();

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

      // Dashboards.updateAll calls updateComponent (@see Dashboards.main:updateAll)
      expect( mockDashboard.updateComponent.calls.count() ).toEqual( 1 );

      // we need to do this by hand because we cannot mock this (Dashboards.Main:1107)
      /*
       * var current = this.updating.current;
       * current.components = _.without(current.components, component);
       * var tiers = this.updating.tiers;
       * tiers[current.priority] = _.without(tiers[current.priority], component);
       * this.updateAll();
       */

      var current = mockDashboard.updating.current;
      current.components = _.without(current.components, comp2priority5);
      var tiers = mockDashboard.updating.tiers;
      tiers[current.priority] = _.without(tiers[current.priority], comp2priority5);
      mockDashboard.updateAll();

    }

    var validateNextUpdateCycle = function(){

      // Dashboards.updateAll has updated comp3priority10
      expect( mockDashboard.updateComponent.calls.count() ).toEqual( 2 );

      expect( comp3priority10.preExecutionFlag ).toEqual( 1 );
      expect( comp3priority10.updateFlag ).toEqual( 1 );
      expect( comp3priority10.postExecutionFlag ).toEqual( 1 );

      done();
    }

    setTimeout( validateUpdateCycle, 100 );
    setTimeout( validateNextUpdateCycle, 200 );

  });

});
