/**
 * ## The CDF framework
 */
describe("The CDF framework #", function() {
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


  var myDashboard = _.extend({},Dashboards);

  /*
   * Our setup consists of adding a bunch of components to CDF.
   */
  myDashboard.init();
  var shouldUpdate =  {
    name: "shouldUpdate",
    type: "managedFreeform",
    preExecution: function() {},
    customfunction: function() {},
    postExecution: function(){}
  };
  var shouldNotUpdate =  {
    name: "shouldNotUpdate",
    type: "managedFreeform",
    preExecution: function() {return false;},
    customfunction: function() {},
    postExecution: function(){}
  };

  myDashboard.addComponents([shouldUpdate, shouldNotUpdate]);

  /************************
   * Test Core Lifecycle  *
   ************************/
  /**
   * ## The CDF framework # Updates Components
   */
  it("Updates Components",function(done) {
    spyOn(shouldUpdate,"preExecution").and.callThrough();
    spyOn(shouldUpdate,"customfunction").and.callThrough();
    spyOn(shouldUpdate,"postExecution").and.callThrough();

    //Update
    myDashboard.update(shouldUpdate);

    //Data to validate
    var dataToValidate = function(){
      expect(shouldUpdate.preExecution).toHaveBeenCalled();
      expect(shouldUpdate.postExecution).toHaveBeenCalled();
      expect(shouldUpdate.customfunction).toHaveBeenCalled();
      done();
    }

    setTimeout(dataToValidate, 100);
  });
  /**
   * ## The CDF framework # Lets preExecution cancel updates
   */
  it("Lets preExecution cancel updates",function(done) {
    spyOn(shouldNotUpdate,"preExecution").and.callThrough();
    spyOn(shouldNotUpdate,"customfunction").and.callThrough();
    spyOn(shouldNotUpdate,"postExecution").and.callThrough();

    //Update
    myDashboard.update(shouldNotUpdate);

    //Data to validate
    var dataToValidate = function(){
      expect(shouldNotUpdate.preExecution).toHaveBeenCalled();
      expect(shouldNotUpdate.postExecution).not.toHaveBeenCalled();
      expect(shouldNotUpdate.customfunction).not.toHaveBeenCalled();
      done();
    }

    setTimeout(dataToValidate, 100);
  });

  /**************************************
   * Test Parameter setting and syncing *
   **************************************/
  /**
   * ## The CDF framework # Adds parameters
   */
  it("Adds parameters", function() {
    myDashboard.addParameter("parentParam",1);
    expect(myDashboard.getParameterValue("parentParam")).toEqual(1);

    myDashboard.addParameter("parentParam",2);
    expect(myDashboard.getParameterValue("parentParam")).toEqual(1);
  });
  /**
   * ## The CDF framework # Sets parameters
   */
  it("Sets parameters", function() {
    myDashboard.setParameter("parentParam",1);
    expect(myDashboard.getParameterValue("parentParam")).toEqual(1);

    myDashboard.setParameter("parentParam",2);
    expect(myDashboard.getParameterValue("parentParam")).toEqual(2);
  });
  /**
   * ## The CDF framework # Syncs parameters
   */
  it("Syncs parameters", function() {
    myDashboard.setParameter("parentParam",1);
    myDashboard.setParameter("childParam",0);
    myDashboard.syncParameters("parentParam","childParam"); // Test initial syncing
    expect(myDashboard.getParameterValue("childParam")).toEqual(1);

    myDashboard.fireChange("parentParam",2);// Test change propagation
    expect(myDashboard.getParameterValue("childParam")).toEqual(2);
  });
  /**
   * ## The CDF framework # Triggers postInit when all components have finished rendering
   */
 it("Triggers postInit when all components have finished rendering", function(done) {
   spyOn(myDashboard, "handlePostInit");

   myDashboard.waitingForInit = null;
   myDashboard.finishedInit = false;
   myDashboard.init();

   //Data to validate
   var dataToValidate = function(){
     expect(myDashboard.handlePostInit).toHaveBeenCalled();
     done();
   };

   setTimeout(dataToValidate, 500);
  })
});
