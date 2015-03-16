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

define(["cdf/Dashboard.Clean"],
    function(Dashboard) {

  /*
   * ## The CDF framework
   */
  describe("The CDF framework #", function() {
    /*
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


    var myDashboard = new Dashboard();
    myDashboard.init();

    /**************************************
     * Test Parameter setting and syncing *
     **************************************/

    /*
     * ## The CDF framework # Adds parameters
     */
    /*
     * Auxiliary function to verify if a parameter has the expected value
     */
    var testSimpleParameter = function(paramName, value){
      expect(myDashboard.getParameterValue(paramName)).toEqual(value);
    };
    /*
     * Auxiliary function to verify if a parameter is a function, its return value and body are as expected
     */
    var testFunctionParameter = function(parameterName, func, funcToString, returnValue) {
      expect(myDashboard.getParameterValue(parameterName) instanceof Function).toBeTruthy();
      expect(myDashboard.getParameterValue(parameterName)()).toBe(returnValue);
      expect(myDashboard.getParameterValue(parameterName).toString()).toEqual(funcToString);
    };

    /*
     * ## The CDF framework # Gets parameters
     */
    it("Adds parameters", function() {
      /*
       * Tests the addParameter call. The second value will never be assigned because the parameter is already defined
       */
      var testSimpleAddParameter = function(paramName, firstValue, secondValue){
        myDashboard.addParameter(paramName,firstValue);
        testSimpleParameter(paramName, firstValue);
        myDashboard.addParameter(paramName,secondValue);
        testSimpleParameter(paramName, firstValue);
      };
      /*
       * Tests a function parameter, if its body and return value are the same
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

      expect(myDashboard.parameters.hasOwnProperty("numberParam")).toBeTruthy();
      expect(myDashboard.storage.hasOwnProperty("numberParam")).toBeFalsy();

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

      myDashboard.parameters = {};

      /*
       storage legacy params
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

      expect(myDashboard.parameters.hasOwnProperty("numberParam")).toBeFalsy();
      expect(myDashboard.storage.hasOwnProperty("numberParam")).toBeTruthy();

      //reset storage
      myDashboard.storage = {};

      /*
       storage params
       */
      testSimpleAddParameter("storage.numberParam", 1, 2);
      testSimpleAddParameter("storage.stringParam", "test", "testtest");
      testSimpleAddParameter("storage.booleanParam", true, false);
      testSimpleAddParameter("storage.nullParam", null, "test");
      testSimpleAddParameter("storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleAddParameter("storage.objectParam1", {a: 1, b: 2}, {});

      myDashboard.addParameter("storage.undefinedParam", undefined);
      expect(myDashboard.getParameterValue("storage.undefinedParam")).toEqual(undefined);
      myDashboard.addParameter("storage.undefinedParam", 123);
      expect(myDashboard.getParameterValue("storage.undefinedParam")).toEqual(123);

      expect(myDashboard.parameters.hasOwnProperty("numberParam")).toBeFalsy();
      expect(myDashboard.storage.hasOwnProperty("numberParam")).toBeTruthy();


    });

    /*
     * ## The CDF framework # Sets parameters
     */
    it("Sets parameters", function() {

      /*
       * Tests the addParameter call. The second value will never be assigned because the parameter is already defined
       */
      var testSimpleSetParameter = function(paramName, firstValue, secondValue){
        myDashboard.setParameter(paramName,firstValue);
        testSimpleParameter(paramName, firstValue);
        myDashboard.setParameter(paramName,secondValue);
        testSimpleParameter(paramName, secondValue);
      };
      /*
       * Tests a function parameter, if its body and return value are the same
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
      testSimpleSetParameter("Dashboards.storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleSetParameter("Dashboards.storage.objectParam1", {a: 1, b: 2}, {});

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

    });

    /*
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

    /*
     * ## The CDF framework # Gets parameters using an alias function getParam
     */
    it("Gets parameters using an alias function getParam", function() {
      myDashboard.addParameter("ping", "pong");
      expect(myDashboard.getParam("ping")).toEqual("pong");
    });
  });

});
