/**
 * ## Paralel query calls #
 */
describe("Component Samples with paralel Dashboards.updateComponent #", function() {

  TestQueryUnmanagedComponent = HelloQueryUnmanagedComponent.extend({

    // mock the query call: response is delayed for 1000 millis
    triggerQuery: function( queryDef, callback, userQueryOptions ) {
      myDashboard.runningCalls++;
     
      var mockTriggerQuery = function() {
         // query response has arrived, lets decrement the runningCalls and return a JSON result 
         myDashboard.runningCalls--;
         return JSON.parse('{"result":true,"count":0}');
      };

      setTimeout( mockTriggerQuery, 3000 /* 3000 millis delay for query response */ );
    }
  });
  
  var myDashboard = _.extend({},Dashboards);
  myDashboard.logLifecycle = true;

  var mainComponent = window.mhello = {
    name: "mainComponent",
    type: "HelloBase",
    testFlag: 0,
    silent: false,
    htmlObject: 'mhello',
    executeAtStart: false,
    clickAction: function(){
      Dashboards.fireChange( 'component1' );
      Dashboards.fireChange( 'component2' );
      Dashboards.fireChange( 'component3' );
    }
  };

  var component1 = window.uquery = {
    name: "component1",
    type: "TestQueryUnmanaged",
    silent: false,
    htmlObject: 'uquery', 
    priority: 5,
    listeners: ["component1"],
    parameters: [["component1","component1"]],
    executeAtStart: false,
    queryDefinition: { path: "", dataAccessId: "component1" },
    preExecution: function(){ 
      return true; 
    },
    postExecution: function(){}
  };

  var component2 = window.uquery = { 
    name: "component2",
    type: "TestQueryUnmanaged",
    silent: false,
    htmlObject: 'uquery',
    priority: 5,
    listeners: ["component2"],
    parameters: [["component2","component2"]],
    executeAtStart: false,
    queryDefinition: { path: "", dataAccessId: "component2" },
    preExecution: function(){ 
      return true; 
    },
    postExecution: function(){}
  };

  var component3 = window.uquery = {
    name: "component3",
    type: "TestQueryUnmanaged",
    silent: false,
    htmlObject: 'uquery',
    priority: 5,
    listeners: ["component3"],
    parameters: [["component3","component3"]],
    executeAtStart: false,
    queryDefinition: { path: "", dataAccessId: "component3" },
    preExecution: function(){ 
      return true; 
    },
    postExecution: function(){}
  };

  var componentList = [ mainComponent, component1, component2, component3 ];
  myDashboard.addComponents( componentList );

  describe("Paralel query calls", function(){
    /**
     * ## Paralel query calls
     */
    it("Should trigger all component query calls immediatelly and *not* have to wait for the previous component to end", function(done){

      //update all components of this test

      spyOn(component1, 'update').and.callThrough();
      spyOn(component1, 'triggerQuery').and.callThrough();
      spyOn(component1, 'postExecution').and.callThrough();

      spyOn(component2, 'update').and.callThrough();
      spyOn(component2, 'triggerQuery').and.callThrough();
      spyOn(component2, 'postExecution').and.callThrough();

      spyOn(component3, 'update').and.callThrough();
      spyOn(component3, 'triggerQuery').and.callThrough();
      spyOn(component3, 'postExecution').and.callThrough(); 
      debugger;
      myDashboard.finishedInit = false;
      myDashboard.init(); 
      myDashboard.components[ myDashboard.components.indexOf( mainComponent ) ].clickAction();

      //Data To Validate 
      var dataToValidate = function() { 

        expect(component1.update.calls.count()).toEqual(1); // component1's update was triggered   
        expect(component1.triggerQuery.calls.count()).toEqual(1); // component1's query was triggered

        expect(component2.update.calls.count()).toEqual(1); // component1's update was triggered
        expect(component2.triggerQuery.calls.count()).toEqual(1); // component2's query was triggered 

        expect(component3.update.calls.count()).toEqual(1); // component1's update was triggered
        expect(component3.triggerQuery.calls.count()).toEqual(1); // component3's query was triggered 
 
        // so, by this point, all components of equal priority have 
        // been triggered, and their respective query calls have been made   

        expect(myDashboard.runningCalls).toEqual(3); // how many running calls do we have (should be 3)
        
      }
      setTimeout(dataToValidate, 1000);


      var dataToValidate2 = function() { 

        // let's wait 3 seconds (should be enough for all query call to have returned),
        // and let's check how many runningCalls we have (should be zero)

        expect(myDashboard.runningCalls).toEqual(0);
        
        done();
      }
      setTimeout(dataToValidate2, 3000);

    });    
  });
});
