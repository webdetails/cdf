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
    postExecution: function(){},
    size: "1"
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
  /**
   * ## The CDF framework # getComponentName
   */
  describe("getComponentName", function(){
    /**
     * ## The CDF framework # getComponentName returns a string with the component's name when the component is provided
     */
    it("returns a string with the component's name when the component is provided",function(done) {
      expect(myDashboard.getComponentName(shouldUpdate)).toEqual("shouldUpdate");
      done();
    });
    /**
     * ## The CDF framework # getComponentName returns a string with the component's name when the name is provided
     */
    it("returns a string with the component's name when the name is provided",function(done) {
      expect(myDashboard.getComponentName(shouldUpdate.name)).toEqual("shouldUpdate");
      done();
    });
    /**
     * ## The CDF framework # getComponentName returns undefined when a component with no name property is provided
     */
    it("returns undefined when a component with no name property is provide",function(done) {
      var tmp = {};
      $.extend( tmp, shouldUpdate );
      tmp.name = null;
      expect(myDashboard.getComponentName(tmp)).toEqual(undefined);
      tmp.name = shouldUpdate.name;
      expect(myDashboard.getComponentName(tmp)).toEqual("shouldUpdate");
      done();
    });
  });
  /**
   * ## The CDF framework # getComponent
   */
  describe("getComponent", function(){
    /**
     * ## The CDF framework # getComponent returns undefined if no component is found
     */
    it("returns undefined if no component is found",function(done) {
      expect(myDashboard.getComponent("fake")).toEqual(undefined);
      done();
    });
    /**
     * ## The CDF framework # getComponent searches for a component when a string with the name is provided
     */
    it("searches for a component when a string with the name is provided",function(done) {
      expect(myDashboard.getComponent("shouldUpdate")).toEqual(shouldUpdate);
      done();
    });
    /**
     * ## The CDF framework # getComponent searches for a component when a component with string property name is provided
     */
    it("searches for a component when a component with string property name is provided",function(done) {
      expect(shouldUpdate.name).toEqual("shouldUpdate");
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(shouldUpdate);
      done();
    });
  });
  /**
   * ## The CDF framework # addComponent
   */
  describe("addComponent", function(){
    /**
     * ## The CDF framework # addComponent replaces components when adding components with duplicate names
     */
    it("replaces components when adding components with duplicate names",function(done) {
      expect(myDashboard.getComponent(shouldUpdate.name).size).toEqual("1");
      shouldUpdate.size = "2";
      myDashboard.addComponent(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name).size).toEqual("2");
      done();
    });
    /**
     * ## The CDF framework # addComponent also adds component to global object `window` when globalContext is true
     */
    it("also adds component to global object `window` when globalContext is true",function(done) {
      var tmp = myDashboard.globalContext;
      myDashboard.globalContext = true;
      myDashboard.addComponent(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name).size).toEqual("2");
      expect(myDashboard.components[myDashboard.getComponentIndex(shouldUpdate.name)]).toEqual(shouldUpdate);
      expect(window[shouldUpdate.name]).toEqual(shouldUpdate);
      myDashboard.globalContext = tmp;
      done();
    });
  });
  /**
   * ## The CDF framework # removeComponent
   */
  describe("removeComponent", function(){
    /**
     * ## The CDF framework # removeComponent removes components with the same name, if the component object or name is provided
     */
    it("removes components with the same name, if the component object or name is provided",function(done) {
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(shouldUpdate);
      expect(myDashboard.removeComponent(shouldUpdate)).toEqual(shouldUpdate);
      expect(myDashboard.getComponentIndex(shouldUpdate)).toEqual(-1);
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(undefined);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(undefined);
      myDashboard.addComponent(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(shouldUpdate);
      expect(myDashboard.removeComponent(shouldUpdate.name)).toEqual(shouldUpdate);
      expect(myDashboard.getComponentIndex(shouldUpdate)).toEqual(-1);
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(undefined);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(undefined);
      myDashboard.addComponent(shouldUpdate);
      done();
    });
    /**
     * ## The CDF framework # removeComponent also removes a component from the global object `window` when globalContext is true
     */
    it("also removes a component from the global object `window` when globalContext is true",function(done) {
      var tmp = myDashboard.globalContext;
      myDashboard.globalContext = true;
      myDashboard.addComponent(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name).size).toEqual("2");
      expect(window[shouldUpdate.name]).toEqual(shouldUpdate);
      myDashboard.removeComponent(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(undefined);
      expect(myDashboard.components[myDashboard.getComponentIndex(shouldUpdate.name)]).toEqual(undefined);
      expect(window[shouldUpdate.name]).toEqual((undefined));
      myDashboard.globalContext = tmp;
      done();
    });

  });
  /**************************************
   * Test Parameter setting and syncing *
   **************************************/
  /**
   * ## The CDF framework # Adds parameters
   */
  /**
   * Auxiliary function to verify if a parameter has the expected value
   *
   * @param paramName
   * @param value
   */
  var testSimpleParameter = function(paramName, value){
    expect(myDashboard.getParameterValue(paramName)).toEqual(value);
  };
  /**
   * Auxiliary function to verify if a parameter is a function, its return value and body are as expected
   *
   * @param parameterName
   * @param func
   * @param funcToString
   * @param returnValue
   */
  var testFunctionParameter = function(parameterName, func, funcToString, returnValue) {
    expect(myDashboard.getParameterValue(parameterName) instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue(parameterName)()).toBe(returnValue);
    expect(myDashboard.getParameterValue(parameterName).toString()).toEqual(funcToString);
  };

  it("Adds parameters", function() {
    /**
     * Tests the addParameter call. The second value will never be assigned because the parameter is already defined
     *
     * @param paramName
     * @param firstValue
     * @param secondValue
     */
    var testSimpleAddParameter = function(paramName, firstValue, secondValue){
      myDashboard.addParameter(paramName,firstValue);
      testSimpleParameter(paramName, firstValue);
      myDashboard.addParameter(paramName,secondValue);
      testSimpleParameter(paramName, firstValue);
    };
    /**
     * Tests a function parameter, if its body and return value are the same
     *
     * @param parameterName
     * @param func
     * @param funcToString
     * @param returnValue
     */
    var testFunctionAddParameter = function(parameterName, func, funcToString, returnValue){
      myDashboard.addParameter(parameterName, func);
      testFunctionParameter(parameterName, func, funcToString, returnValue);
    };

    testSimpleAddParameter("numberParam", 1, 2);
    testSimpleAddParameter("stringParam", "test", "testtest");
    testSimpleAddParameter("booleanParam", true, false);
    testSimpleAddParameter("nullParam", null, "test");
    testSimpleAddParameter("arrayParam", ["test1", "test2"], ["test3", "test4"]);
    testSimpleAddParameter("objectParam1", {a: 1, b: 2}, {});

    myDashboard.addParameter("undefinedParam", undefined);
    expect(myDashboard.getParameterValue("undefinedParam")).toEqual(undefined);
    myDashboard.addParameter("undefinedParam", 123);
    expect(myDashboard.getParameterValue("undefinedParam")).toEqual(123);

    var func1 = function(){var v=0;return v;};
    testFunctionAddParameter("functionParam", func1, func1.toString(), func1());

    myDashboard.addParameter("objectParam2", {
      testString: "testString",
      testNumber: 1,
      testBoolean: true,
      testUndefined: undefined,
      testNull: null,
      testArray: [ "firstEntry", "secondEntry", "thirdEntry" ],
      testObject: {}
    });
    expect(myDashboard.getParameterValue("objectParam2")).toEqual({
      testString: "testString",
      testNumber: 1,
      testBoolean: true,
      testUndefined: undefined,
      testNull: null,
      testArray: [ "firstEntry", "secondEntry", "thirdEntry" ],
      testObject: {}
    });
    expect(myDashboard.getParameterValue("objectParam2")).not.toEqual({});
    expect(typeof myDashboard.getParameterValue("objectParam2")).toEqual("object");

    myDashboard.addParameter("functionsObjectParam", {
      firstFunction: function(){
        return "firstFunction";
      },
      secondFunction: function(){
        return "secondFunction";
      },
      thirdFunction: function(){
        return "thirdFunction";
      }
    });
    expect(myDashboard.getParameterValue("functionsObjectParam").hasOwnProperty("firstFunction")).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").hasOwnProperty("secondFunction")).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").hasOwnProperty("thirdFunction")).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").firstFunction instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").secondFunction instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").thirdFunction instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").firstFunction()).toBe("firstFunction");
    expect(myDashboard.getParameterValue("functionsObjectParam").secondFunction()).toBe("secondFunction");
    expect(myDashboard.getParameterValue("functionsObjectParam").thirdFunction()).toBe("thirdFunction");

    /*
    storage params
     */
    testSimpleAddParameter("Dashboards.storage.numberParam", 1, 2);
    testSimpleAddParameter("Dashboards.storage.stringParam", "test", "testtest");
    testSimpleAddParameter("Dashboards.storage.booleanParam", true, false);
    testSimpleAddParameter("Dashboards.storage.nullParam", null, "test");
    testSimpleAddParameter("Dashboards.storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
    testSimpleAddParameter("Dashboards.storage.objectParam1", {a: 1, b: 2}, {});

    myDashboard.addParameter("Dashboards.storage.undefinedParam", undefined);
    expect(myDashboard.getParameterValue("Dashboards.storage.undefinedParam")).toEqual(undefined);
    myDashboard.addParameter("Dashboards.storage.undefinedParam", 123);
    expect(myDashboard.getParameterValue("Dashboards.storage.undefinedParam")).toEqual(123);

  });
  /**
   * ## The CDF framework # Sets parameters
   */
  it("Sets parameters", function() {
    /**
     * Tests the setParameter call. The second value, when not undefined, will override the previous one
     *
     * @param paramName
     * @param firstValue
     * @param secondValue
     */
    var testSimpleSetParameter = function(paramName, firstValue, secondValue){
      myDashboard.setParameter(paramName,firstValue);
      testSimpleParameter(paramName, firstValue);
      myDashboard.setParameter(paramName,secondValue);
      testSimpleParameter(paramName, secondValue);
    };
    /**
     * Tests a function parameter, if its body and return value are the same
     *
     * @param parameterName
     * @param func
     * @param funcToString
     * @param returnValue
     */
    var testFunctionSetParameter = function(parameterName, func, funcToString, returnValue){
      myDashboard.setParameter(parameterName, func);
      testFunctionParameter(parameterName, func, funcToString, returnValue);
    };

    testSimpleSetParameter("numberParam", 1, 2);
    testSimpleSetParameter("stringParam", "test", "testtest");
    testSimpleSetParameter("booleanParam", true, false);
    testSimpleSetParameter("arrayParam", ["test1", "test2"], ["test3", "test4"]);
    testSimpleSetParameter("objectParam1", {a: 1, b: 2}, {});

    testSimpleSetParameter("nullParam", null, "test");
    expect(myDashboard.parameterModel.get("nullParam")).toEqual("test");
    testSimpleSetParameter("nullParam", "test", null);
    expect(myDashboard.parameterModel.get("nullParam")).toEqual(null);

    myDashboard.setParameter("undefinedParam2", 123);
    expect(myDashboard.getParameterValue("undefinedParam2")).toEqual(123);
    expect(myDashboard.parameterModel.get("undefinedParam2")).toEqual(123);
    myDashboard.setParameter("undefinedParam2", undefined);
    expect(myDashboard.getParameterValue("undefinedParam2")).toEqual(123);
    expect(myDashboard.parameterModel.get("undefinedParam2")).toEqual(123);

    var func1 = function(){var v=0;return v;};
    testFunctionSetParameter("functionParam", func1, func1.toString(), func1());

    myDashboard.setParameter("objectParam2", {
      testString: "testString",
      testNumber: 1,
      testBoolean: true,
      testUndefined: undefined,
      testNull: null,
      testArray: [ "firstEntry", "secondEntry", "thirdEntry" ],
      testObject: {}
    });
    expect(myDashboard.getParameterValue("objectParam2")).toEqual({
      testString: "testString",
      testNumber: 1,
      testBoolean: true,
      testUndefined: undefined,
      testNull: null,
      testArray: [ "firstEntry", "secondEntry", "thirdEntry" ],
      testObject: {}
    });
    expect(myDashboard.getParameterValue("objectParam2")).not.toEqual({});
    expect(typeof myDashboard.getParameterValue("objectParam2")).toEqual("object");

    myDashboard.setParameter("functionsObjectParam", {
      firstFunction: function(){
        return "firstFunction";
      },
      secondFunction: function(){
        return "secondFunction";
      },
      thirdFunction: function(){
        return "thirdFunction";
      }
    });
    expect(myDashboard.getParameterValue("functionsObjectParam").hasOwnProperty("firstFunction")).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").hasOwnProperty("secondFunction")).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").hasOwnProperty("thirdFunction")).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").firstFunction instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").secondFunction instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").thirdFunction instanceof Function).toBeTruthy();
    expect(myDashboard.getParameterValue("functionsObjectParam").firstFunction()).toBe("firstFunction");
    expect(myDashboard.getParameterValue("functionsObjectParam").secondFunction()).toBe("secondFunction");
    expect(myDashboard.getParameterValue("functionsObjectParam").thirdFunction()).toBe("thirdFunction");

    /*
     storage params
     */
    testSimpleSetParameter("Dashboards.storage.numberParam", 1, 2);
    testSimpleSetParameter("Dashboards.storage.stringParam", "test", "testtest");
    testSimpleSetParameter("Dashboards.storage.booleanParam", true, false);
    testSimpleSetParameter("Dashboards.storage.nullParam", null, "test");
    testSimpleSetParameter("Dashboards.storage.nullParam", "test", null);
    testSimpleSetParameter("Dashboards.storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
    testSimpleSetParameter("Dashboards.storage.objectParam1", {a: 1, b: 2}, {});

    myDashboard.setParameter("Dashboards.storage.undefinedParam2", 123);
    expect(myDashboard.getParameterValue("Dashboards.storage.undefinedParam2")).toEqual(123);
    expect(myDashboard.parameterModel.get("Dashboards.storage.undefinedParam2")).toEqual(123);
    myDashboard.setParameter("Dashboards.storage.undefinedParam2", undefined);
    expect(myDashboard.getParameterValue("Dashboards.storage.undefinedParam2")).toEqual(123);
    expect(myDashboard.parameterModel.get("Dashboards.storage.undefinedParam2")).toEqual(123);

  });
  /**
   * ## The CDF framework # _isParameterInModel
   */
  describe("The CDF framework # _isParameterInModel", function() {
    /**
     * ## The CDF framework # Looks for parameters in the correct context, `window` when `Dashboards.globalContext` is true
     */
    it("Looks for parameters in the correct context, `window` when `Dashboards.globalContext` is true", function() {
      myDashboard.globalContext = true;
      expect(myDashboard._isParameterInModel("contextParam")).toEqual(false);
      myDashboard.setParameter("contextParam",1);
      expect(window["contextParam"]).toEqual(1);
      expect(myDashboard.parameters["contextParam"]).toEqual(undefined);
      expect(myDashboard.getParameterValue("contextParam")).toEqual(1);
      expect(myDashboard._isParameterInModel("contextParam")).toEqual(true);
    });
    /**
     * ## The CDF framework # Looks for parameters in the correct context, `Dashboards.parameters` when `Dashboards.globalContext` is false
     */
    it("Looks for parameters in the correct context, `Dashboards.parameters` when `Dashboards.globalContext` is false", function() {
      myDashboard.globalContext = false;
      expect(myDashboard._isParameterInModel("contextParam2")).toEqual(false);
      myDashboard.setParameter("contextParam2",2);
      expect(window["contextParam2"]).toEqual(undefined);
      expect(myDashboard.parameters["contextParam2"]).toEqual(2);
      expect(myDashboard.getParameterValue("contextParam2")).toEqual(2);
      expect(myDashboard._isParameterInModel("contextParam2")).toEqual(true);
      myDashboard.globalContext = true;
    });
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
