/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
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
  beforeEach(function(){
    var a = 0;
    setTimeout(function(){
      a = 1;
    }, 50);
  });

  afterEach(function(){
    var a = 0;
    setTimeout(function(){
      a = 1;
    }, 50);
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
  /**
   * ## The CDF framework # getComponentName
   */
  describe("getComponentName", function(){
    /**
     * ## The CDF framework # getComponentName returns a string with the component's name when the component is provided
     */
    it("returns a string with the component's name when the component is provided",function() {
      expect(myDashboard.getComponentName(shouldUpdate)).toEqual("shouldUpdate");
    });
    /**
     * ## The CDF framework # getComponentName returns a string with the component's name when the name is provided
     */
    it("returns a string with the component's name when the name is provided",function() {
      expect(myDashboard.getComponentName(shouldUpdate.name)).toEqual("shouldUpdate");
    });
    /**
     * ## The CDF framework # getComponentName returns undefined when a component with no name property is provided
     */
    it("returns undefined when a component with no name property is provided",function() {
      var tmp = $.extend( {}, shouldUpdate );
      tmp.name = null;
      expect(myDashboard.getComponentName(tmp)).toEqual(undefined);
      tmp.name = shouldUpdate.name;
      expect(myDashboard.getComponentName(tmp)).toEqual(shouldUpdate.name);
    });
    /**
     * ## The CDF framework # getComponentName returns undefined when an empty string is provided
     */
    it("returns undefined when an empty string is provided",function() {
      expect(myDashboard.getComponentName("")).toEqual(undefined);
    });
    /**
     * ## The CDF framework # getComponentName returns undefined when a component has an empty string in property name
     */
    it("returns undefined when a component has an empty string in property name",function() {
      var tmp = $.extend( {}, shouldUpdate );
      tmp.name = "";
      expect(myDashboard.getComponentName(tmp)).toEqual(undefined);
    });
  });
  /**
   * ## The CDF framework # getComponent
   */
  describe("getComponent", function(){
    /**
     * ## The CDF framework # getComponent returns undefined if no component is found
     */
    it("returns undefined if no component is found",function() {
      expect(myDashboard.getComponent("fake")).toEqual(undefined);
    });
    /**
     * ## The CDF framework # getComponent searches for a component when a string with the name is provided
     */
    it("searches for a component when a string with the name is provided",function() {
      expect(myDashboard.getComponent("shouldUpdate")).toEqual(shouldUpdate);
    });
    /**
     * ## The CDF framework # getComponent searches for a component when a component with string property name is provided
     */
    it("searches for a component when a component with string property name is provided",function() {
      expect(shouldUpdate.name).toEqual("shouldUpdate");
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(shouldUpdate);
    });
    /**
     * ## The CDF framework # getComponent returns undefined when an empty string is provided
     */
    it("returns undefined when an empty string is provided",function() {
      expect(myDashboard.getComponent("")).toEqual(undefined);
    });
    /**
     * ## The CDF framework # getComponent returns undefined when a component has an empty string in property name
     */
    it("returns undefined when a component has an empty string in property name",function() {
      var tmp = $.extend( {}, shouldUpdate );
      tmp.name = "";
      expect(myDashboard.getComponent(tmp)).toEqual(undefined);
    });
  });
  /**
   * ## The CDF framework # getComponentIndex
   */
  describe("getComponentIndex", function(){
    /**
     * ## The CDF framework # getComponentIndex returns -1 if a string is provided with a name of an unexisting component
     */
    it("returns -1 if a string is provided with a name of an unexisting component",function() {
      expect(myDashboard.getComponentIndex("unexistingComponent")).toEqual(-1);
    });
    /**
     * ## The CDF framework # getComponentIndex returns the number itself when a number is provided
     */
    it("returns the number itself when a number is provided",function() {
      expect(myDashboard.getComponentIndex(0)).toEqual(0);
      expect(myDashboard.getComponentIndex(1)).toEqual(1);
    });
    /**
     * ## The CDF framework # getComponentIndex returns the index of a component in the components array if the component is provided
     */
    it("returns the index of a component in the components array if the component is provided",function() {
      var tmp = myDashboard.components[0];
      expect(myDashboard.getComponentIndex(tmp)).toEqual(0);
    });
    /**
     * ## The CDF framework # getComponentIndex returns the index of a component in the components array when the component's name is provided
     */
    it("returns the index of a component in the components array when the component's name is provided",function() {
      var tmp = myDashboard.components[1];
      expect(myDashboard.getComponentIndex(tmp.name)).toEqual(1);
    });
  });
  /**
   * ## The CDF framework # getComponentByName
   */
  describe("getComponentByName", function(){
    /**
     * ## The CDF framework # getComponentByName returns undefined if null is provided
     */
    it("returns undefined if null is provided",function() {
      expect(myDashboard.getComponentByName(null)).toEqual(undefined);
    });
    /**
     * ## The CDF framework # getComponentByName returns undefined if undefined is provided
     */
    it("returns undefined if undefined is provided",function() {
      expect(myDashboard.getComponentByName(undefined)).toEqual(undefined);
    });
    /**
     * ## The CDF framework # getComponentByName returns undefined when an empty string is provided
     */
    it("returns undefined when an empty string is provided",function() {
      expect(myDashboard.getComponentByName("")).toEqual(undefined);
    });
    /**
     * ## The CDF framework # getComponentByName returns the component when the component's name is provided
     */
    it("returns the component when the component's name is provided",function() {
      $.extend( {}, shouldUpdate );
      expect(myDashboard.getComponentByName(shouldUpdate.name)).toEqual(shouldUpdate);
    });
    /**
     * ## The CDF framework # getComponentByName returns the component from the global object window when the component's name is provided and globalContext is true
     */
    it("returns the component from the global object window when the component's name is provided and globalContext is true",function() {
      var tmp = $.extend( {}, shouldUpdate );
      tmp.type = "dummy";
      var globalContext_ = myDashboard.globalContext;
      myDashboard.globalContext = true;
      var tmp2 = window[shouldUpdate.name];
      window[shouldUpdate.name] = tmp;
      expect(myDashboard.getComponentByName(shouldUpdate.name)).toEqual(tmp);
      expect(shouldUpdate.type).toEqual("managedFreeform");
      expect(myDashboard.getComponentByName(shouldUpdate.name)).not.toEqual(shouldUpdate);
      myDashboard.globalContext = globalContext_;
      window[shouldUpdate.name] = tmp2;
    });
  });
  /**
   * ## The CDF framework # addComponent
   */
  describe("addComponent", function(){
    /**
     * ## The CDF framework # addComponent replaces components when adding components with duplicate names
     */
    it("replaces components when adding components with duplicate names",function() {
      var tmp = $.extend( {}, shouldUpdate );
      tmp.type="dummy";
      expect(myDashboard.getComponent(shouldUpdate.name).type).toEqual("managedFreeform");
      myDashboard.addComponent(tmp);
      expect(myDashboard.getComponent(shouldUpdate.name).type).toEqual("dummy");
    });
    /**
     * ## The CDF framework # addComponent also adds component to global object window when globalContext is true
     */
    it("also adds component to global object window when globalContext is true",function() {
      var tmp = $.extend( {}, shouldUpdate );
      
      tmp.type="dummy";
      var globalContext_ = myDashboard.globalContext;
      myDashboard.globalContext = true;
      myDashboard.addComponent(tmp);
      expect(myDashboard.getComponent(shouldUpdate.name).type).toEqual(tmp.type);
      expect(myDashboard.getComponent(shouldUpdate.name).type).not.toEqual(shouldUpdate.type);
      expect(myDashboard.components[myDashboard.getComponentIndex(shouldUpdate.name)]).toEqual(tmp);
      expect(myDashboard.components[myDashboard.getComponentIndex(shouldUpdate.name)]).not.toEqual(shouldUpdate);
      expect(window[shouldUpdate.name]).toEqual(tmp);
      expect(window[shouldUpdate.name]).not.toEqual(shouldUpdate);
      myDashboard.globalContext = globalContext_;
      //remove tmp and add shouldUpdate
      myDashboard.addComponent(shouldUpdate);
    });
  });
  /**
   * ## The CDF framework # removeComponent
   */
  describe("removeComponent", function(){
    /**
     * ## The CDF framework # removeComponent returns undefined when removing a component that doesn't exist
     */
    it("returns undefined when removing a component that doesn't exist",function() {
      expect(myDashboard.removeComponent("fakeComponent")).toEqual(undefined);
    });
    /**
     * ## The CDF framework # removeComponent returns undefined when removing a component at an invalid index of Dashboards.components
     */
    it("returns undefined when removing a component at an invalid index of Dashboards.components",function() {
      var invalidIndex = Dashboards.components.length;
      expect(myDashboard.removeComponent(invalidIndex)).toEqual(undefined);
    });
    /**
     * ## The CDF framework # removeComponent returns undefined when removing a component that doesn't exist in Dashboards.components
     */
    it("returns undefined when removing a component that doesn't exist in Dashboards.components",function() {
      var tmp = $.extend( {}, shouldUpdate );
      tmp.name="unexistingComponent";
      expect(myDashboard.removeComponent(tmp)).toEqual(undefined);
    });
    /**
     * ## The CDF framework # removeComponent removes components with the same name, if the component object with property name is provided
     */
    it("removes a component with the same name as the component object with property name provided",function() {
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(shouldUpdate);
      expect(myDashboard.removeComponent(shouldUpdate)).toEqual(shouldUpdate);
      expect(myDashboard.getComponentIndex(shouldUpdate)).toEqual(-1);
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(undefined);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(undefined);
      myDashboard.addComponent(shouldUpdate);
    });
    /**
     * ## The CDF framework # removeComponent removes a component with the same name as the name provided
     */
    it("removes a component with the same name as the name provided",function() {
      expect(myDashboard.getComponentIndex(shouldUpdate)).not.toEqual(-1);
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(shouldUpdate);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(shouldUpdate);
      expect(myDashboard.removeComponent(shouldUpdate.name)).toEqual(shouldUpdate);
      expect(myDashboard.getComponentIndex(shouldUpdate)).toEqual(-1);
      expect(myDashboard.getComponent(shouldUpdate)).toEqual(undefined);
      expect(myDashboard.getComponent(shouldUpdate.name)).toEqual(undefined);
      myDashboard.addComponent(shouldUpdate);
    });
    /**
     * ## The CDF framework # removeComponent also removes a component from the global object window when globalContext is true
     */
    it("removes a component from the global object window when globalContext is true",function() {
      var globalContext_ = myDashboard.globalContext;
      myDashboard.globalContext = true;
      myDashboard.addComponent(shouldUpdate);
      expect(window[shouldUpdate.name]).toEqual(shouldUpdate);
      expect(myDashboard.components[myDashboard.getComponentIndex(shouldUpdate.name)]).toEqual(shouldUpdate);
      myDashboard.removeComponent(shouldUpdate);
      expect(window[shouldUpdate.name]).toEqual((undefined));
      expect(myDashboard.components[myDashboard.getComponentIndex(shouldUpdate.name)]).toEqual(undefined);
      myDashboard.globalContext = globalContext_;
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

    /*
     flat parameters
     */

    myDashboard._setFlatParameters(true);
    testSimpleAddParameter("mystorage.numberParam", 1, 2);
    testSimpleAddParameter("mystorage.stringParam", "test", "testtest");
    testSimpleAddParameter("mystorage.booleanParam", true, false);
    testSimpleAddParameter("mystorage.nullParam", null, "test");
    testSimpleAddParameter("mystorage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
    testSimpleAddParameter("mystorage.objectParam1", {a: 1, b: 2}, {});

    myDashboard.addParameter("mystorage.undefinedParam", undefined);
    expect(myDashboard.getParameterValue("mystorage.undefinedParam")).toEqual(undefined);
    myDashboard.addParameter("mystorage.undefinedParam", 123);
    expect(myDashboard.getParameterValue("mystorage.undefinedParam")).toEqual(123);
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


    /*
     flat params
     */

    myDashboard._setFlatParameters(true);
    testSimpleSetParameter("mystorage.numberParam", 1, 2);
    testSimpleSetParameter("mystorage.stringParam", "test", "testtest");
    testSimpleSetParameter("mystorage.booleanParam", true, false);
    testSimpleSetParameter("mystorage.nullParam", null, "test");
    testSimpleSetParameter("mystorage.nullParam", "test", null);
    testSimpleSetParameter("mystorage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
    testSimpleSetParameter("mystorage.objectParam1", {a: 1, b: 2}, {});

    myDashboard.setParameter("mystorage.undefinedParam2", 123);
    expect(myDashboard.getParameterValue("mystorage.undefinedParam2")).toEqual(123);
    expect(myDashboard.parameterModel.get("mystorage.undefinedParam2")).toEqual(123);
    myDashboard.setParameter("mystorage.undefinedParam2", undefined);
    expect(myDashboard.getParameterValue("mystorage.undefinedParam2")).toEqual(123);
    expect(myDashboard.parameterModel.get("mystorage.undefinedParam2")).toEqual(123);

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
  });

  /**
   * ## The CDF framework # Get Query Parameter
   */
  it("Get Query Parameter", function() {
    spyOn(myDashboard, "getLocationSearchString")
        .and.returnValue("?debug=true&randomName&noValue=&bug=false");

    expect(myDashboard.getQueryParameter("debug")).toBe("true");
    expect(myDashboard.getQueryParameter("bug")).toBe("false");
    expect(myDashboard.getQueryParameter("randomName")).toBe("");
    expect(myDashboard.getQueryParameter("noValue")).toBe("");
    expect(myDashboard.getQueryParameter("notThere")).toBe("");

  });

  /**
   * ## The CDF framework # Number Format
   */
  //TODO: Uncomment this test when CDF-544 is resolved
  /*it("Number Format", function() {
    var defaultMask = cdo.format.language().number().mask();
    var defaultMask_en_us = cdo.format.language('en-us').number().mask();
    var defaultMask_en_gb = cdo.format.language('en-gb').number().mask();
    var defaultMask_pt_pt = cdo.format.language('pt-pt').number().mask();

    expect(Dashboards.numberFormat(123456, "#AC")).toEqual("123k$");
    expect(Dashboards.numberFormat(123456, "#AC", 'en-us')).toEqual("123k$");
    expect(Dashboards.numberFormat(123456, "#AC", 'en-gb')).toEqual("123k£");
    expect(Dashboards.numberFormat(123456, "#AC", 'pt-pt')).toEqual("123k€");

    //check if default mask values were not changed by numberFormat
    expect(cdo.format.language().number().mask()).toEqual(defaultMask);
    expect(cdo.format.language('en-us').number().mask()).toEqual(defaultMask_en_us);
    expect(cdo.format.language('en-gb').number().mask()).toEqual(defaultMask_en_gb);
    expect(cdo.format.language('pt-pt').number().mask()).toEqual(defaultMask_pt_pt);
  });*/

  /**
   * ## The CDF framework # Date Parse
   */
  it("Date Parse", function() {
    function expectDateParse(date, mask, expectedResult) {
      var result = myDashboard.dateParse(date, mask).toString();
      expect(result.indexOf(expectedResult) > -1).toBe(true);
    }

    expectDateParse(null, 'DD-MM-YY', 'Invalid Date');
    expectDateParse('13-08-1983', 'DD-MM-YYYY', 'Sat Aug 13 1983');
    expectDateParse('Wednesday, February 18, 2015 12:00 AM', 'LLLL', 'Wed Feb 18 2015');
  });

  /**
   * ## The CDF framework # Dashboards.log
   */
  describe("Dashboards.log", function() {

    var consoleOriginal = window.console;

    // make sure console.exception is defined
    if(!window.console.exception) {
      window.console.exception = function() {};
    }

    /**
     * ## The CDF framework # Dashboards.log # logs messages of supported type
     */
    it("logs messages of supported types", function() {
      spyOn(window.console, "debug");
      Dashboards.log("foo", "debug");
      expect(console.debug).toHaveBeenCalledWith("CDF: foo");

      spyOn(window.console, "log");
      Dashboards.log("foo", "log");
      expect(console.log).toHaveBeenCalledWith("CDF: foo");

      spyOn(window.console, "info");
      Dashboards.log("foo", "info");
      expect(console.info).toHaveBeenCalledWith("CDF: foo");

      spyOn(window.console, "warn");
      Dashboards.log("foo", "warn");
      expect(console.warn).toHaveBeenCalledWith("CDF: foo");

      spyOn(window.console, "error");
      Dashboards.log("foo", "error");
      expect(console.error).toHaveBeenCalledWith("CDF: foo");

      spyOn(window.console, "exception");
      Dashboards.log("foo", "exception");
      expect(console.exception).toHaveBeenCalledWith("CDF: foo");
    });

    /**
     * ## The CDF framework # Dashboards.log # defaults to type 'log'
     */
    it("defaults to type 'log'", function() {
      spyOn(window.console, "log");
      Dashboards.log("foo");
      expect(console.log).toHaveBeenCalledWith("CDF: foo");
    });

    /**
     * ## The CDF framework # Dashboards.log # logs type 'error' if 'exception' is unsupported
     */
    it("logs type 'error' if 'exception' is unsupported", function() {
      window.console["exception"] = undefined;

      spyOn(window.console, "error");
      Dashboards.log({stack: "foo"}, "exception");
      expect(console.error).toHaveBeenCalledWith("CDF: foo");

      window.console["exception"] = function() {};
    });

    /**
     * ## The CDF framework # Dashboards.log # logs exception objects
     */
    it("logs exception objects", function() {
      spyOn(window.console, "exception");
      Dashboards.log({stack: "foo"}, "exception");
      expect(console.exception).toHaveBeenCalledWith("CDF: [object Object]");
    });

    /**
     * ## The CDF framework # Dashboards.log # logs messages with css styling rules
     */
    it("logs type 'log' messages", function() {
      spyOn(window.console, "info");
      Dashboards.log("foo", "info", "color: blue");
      expect(console.info).toHaveBeenCalledWith("%cCDF: foo", "color: blue");
    });

    // restore window.console
    window.console = consoleOriginal;
  });
});
