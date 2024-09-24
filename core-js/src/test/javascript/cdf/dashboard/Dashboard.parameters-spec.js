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

define(["cdf/Dashboard.Clean"], function(Dashboard) {

  /*
   * ## The CDF framework
   */
  describe("The CDF framework #", function() {

    var dashboard = new Dashboard();
    dashboard.init();

    /**************************************
     * Test Parameter setting and syncing *
     **************************************/

    /*
     * Auxiliary function to verify if a parameter has the expected value
     */
    var testSimpleParameter = function(paramName, value) {
      expect(dashboard.getParameterValue(paramName)).toEqual(value);
    };
    /*
     * Auxiliary function to verify if a parameter is a function, its return value and body are as expected
     */
    var testFunctionParameter = function(parameterName, func, funcToString, returnValue) {
      expect(dashboard.getParameterValue(parameterName) instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue(parameterName)()).toBe(returnValue);
      expect(dashboard.getParameterValue(parameterName).toString()).toEqual(funcToString);
    };

    /*
     * Auxiliary function to test adding/setting a function parameter value
     */
    var func1 = function() { return true; };

    /*
     * ## The CDF framework # adds parameters
     */
    it("adds parameters", function() {
      /*
       * Tests the addParameter call. The second value will never be assigned because the parameter is already defined
       */
      var testSimpleAddParameter = function(paramName, firstValue, secondValue) {
        dashboard.addParameter(paramName, firstValue);
        testSimpleParameter(paramName, firstValue);
        dashboard.addParameter(paramName, secondValue);
        testSimpleParameter(paramName, firstValue);
      };
      /*
       * Tests a function parameter, if its body and return value are the same
       */
      var testFunctionAddParameter = function(parameterName, func, funcToString, returnValue) {
        dashboard.addParameter(parameterName, func);
        testFunctionParameter(parameterName, func, funcToString, returnValue);
      };

      testSimpleAddParameter("numberParam", 1, 2);
      testSimpleAddParameter("stringParam", "test", "testtest");
      testSimpleAddParameter("booleanParam", true, false);
      testSimpleAddParameter("nullParam", null, "test");
      testSimpleAddParameter("arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleAddParameter("objectParam1", {a: 1, b: 2}, {});

      dashboard.addParameter("undefinedParam", undefined);
      expect(dashboard.getParameterValue("undefinedParam")).toEqual(undefined);
      dashboard.addParameter("undefinedParam", 123);
      expect(dashboard.getParameterValue("undefinedParam")).toEqual(123);

      expect(dashboard.parameters.hasOwnProperty("numberParam")).toBeTruthy();
      expect(dashboard.storage.hasOwnProperty("numberParam")).toBeFalsy();

      testFunctionAddParameter("functionParam", func1, func1.toString(), func1());

      dashboard.addParameter("objectParam2", {
        testString: "testString",
        testNumber: 1,
        testBoolean: true,
        testUndefined: undefined,
        testNull: null,
        testArray: ["firstEntry", "secondEntry", "thirdEntry"],
        testObject: {}
      });
      expect(dashboard.getParameterValue("objectParam2")).toEqual({
        testString: "testString",
        testNumber: 1,
        testBoolean: true,
        testUndefined: undefined,
        testNull: null,
        testArray: ["firstEntry", "secondEntry", "thirdEntry"],
        testObject: {}
      });
      expect(dashboard.getParameterValue("objectParam2")).not.toEqual({});
      expect(typeof dashboard.getParameterValue("objectParam2")).toEqual("object");

      dashboard.addParameter("functionsObjectParam", {
        firstFunction: function() { return "firstFunction"; },
        secondFunction: function() { return "secondFunction"; },
        thirdFunction: function() { return "thirdFunction"; }
      });
      expect(dashboard.getParameterValue("functionsObjectParam").hasOwnProperty("firstFunction")).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").hasOwnProperty("secondFunction")).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").hasOwnProperty("thirdFunction")).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").firstFunction instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").secondFunction instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").thirdFunction instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").firstFunction()).toBe("firstFunction");
      expect(dashboard.getParameterValue("functionsObjectParam").secondFunction()).toBe("secondFunction");
      expect(dashboard.getParameterValue("functionsObjectParam").thirdFunction()).toBe("thirdFunction");

      dashboard.parameters = {};

      /*
       * storage legacy params
       */
      testSimpleAddParameter("Dashboards.storage.numberParam", 1, 2);
      testSimpleAddParameter("Dashboards.storage.stringParam", "test", "testtest");
      testSimpleAddParameter("Dashboards.storage.booleanParam", true, false);
      testSimpleAddParameter("Dashboards.storage.nullParam", null, "test");
      testSimpleAddParameter("Dashboards.storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleAddParameter("Dashboards.storage.objectParam1", {a: 1, b: 2}, {});

      dashboard.addParameter("Dashboards.storage.undefinedParam", undefined);
      expect(dashboard.getParameterValue("Dashboards.storage.undefinedParam")).toEqual(undefined);
      dashboard.addParameter("Dashboards.storage.undefinedParam", 123);
      expect(dashboard.getParameterValue("Dashboards.storage.undefinedParam")).toEqual(123);

      expect(dashboard.parameters.hasOwnProperty("numberParam")).toBeFalsy();
      expect(dashboard.storage.hasOwnProperty("numberParam")).toBeTruthy();

      //reset storage
      dashboard.storage = {};

      /*
       * storage params
       */
      testSimpleAddParameter("storage.numberParam", 1, 2);
      testSimpleAddParameter("storage.stringParam", "test", "testtest");
      testSimpleAddParameter("storage.booleanParam", true, false);
      testSimpleAddParameter("storage.nullParam", null, "test");
      testSimpleAddParameter("storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleAddParameter("storage.objectParam1", {a: 1, b: 2}, {});

      dashboard.addParameter("storage.undefinedParam", undefined);
      expect(dashboard.getParameterValue("storage.undefinedParam")).toEqual(undefined);
      dashboard.addParameter("storage.undefinedParam", 123);
      expect(dashboard.getParameterValue("storage.undefinedParam")).toEqual(123);

      expect(dashboard.parameters.hasOwnProperty("numberParam")).toBeFalsy();
      expect(dashboard.storage.hasOwnProperty("numberParam")).toBeTruthy();
    });

    /*
     * ## The CDF framework # sets parameters
     */
    it("sets parameters", function() {
      /*
       * Tests the addParameter call. The second value will never be assigned because the parameter is already defined
       */
      var testSimpleSetParameter = function(paramName, firstValue, secondValue) {
        dashboard.setParameter(paramName,firstValue);
        testSimpleParameter(paramName, firstValue);
        dashboard.setParameter(paramName,secondValue);
        testSimpleParameter(paramName, secondValue);
      };
      /*
       * Tests a function parameter, if its body and return value are the same
       */
      var testFunctionSetParameter = function(parameterName, func, funcToString, returnValue) {
        dashboard.setParameter(parameterName, func);
        testFunctionParameter(parameterName, func, funcToString, returnValue);
      };

      testSimpleSetParameter("numberParam", 1, 2);
      testSimpleSetParameter("stringParam", "test", "testtest");
      testSimpleSetParameter("booleanParam", true, false);
      testSimpleSetParameter("arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleSetParameter("objectParam1", {a: 1, b: 2}, {});

      testFunctionSetParameter("functionParam", func1, func1.toString(), func1());

      dashboard.setParameter("objectParam2", {
        testString: "testString",
        testNumber: 1,
        testBoolean: true,
        testUndefined: undefined,
        testNull: null,
        testArray: ["firstEntry", "secondEntry", "thirdEntry"],
        testObject: {}
      });
      expect(dashboard.getParameterValue("objectParam2")).toEqual({
        testString: "testString",
        testNumber: 1,
        testBoolean: true,
        testUndefined: undefined,
        testNull: null,
        testArray: [ "firstEntry", "secondEntry", "thirdEntry" ],
        testObject: {}
      });
      expect(dashboard.getParameterValue("objectParam2")).not.toEqual({});
      expect(typeof dashboard.getParameterValue("objectParam2")).toEqual("object");

      dashboard.setParameter("functionsObjectParam", {
        firstFunction: function() {
          return "firstFunction";
        },
        secondFunction: function() {
          return "secondFunction";
        },
        thirdFunction: function() {
          return "thirdFunction";
        }
      });
      expect(dashboard.getParameterValue("functionsObjectParam").hasOwnProperty("firstFunction")).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").hasOwnProperty("secondFunction")).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").hasOwnProperty("thirdFunction")).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").firstFunction instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").secondFunction instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").thirdFunction instanceof Function).toBeTruthy();
      expect(dashboard.getParameterValue("functionsObjectParam").firstFunction()).toBe("firstFunction");
      expect(dashboard.getParameterValue("functionsObjectParam").secondFunction()).toBe("secondFunction");
      expect(dashboard.getParameterValue("functionsObjectParam").thirdFunction()).toBe("thirdFunction");

      /*
       * storage legacy params
       */
      testSimpleSetParameter("Dashboards.storage.numberParam", 1, 2);
      testSimpleSetParameter("Dashboards.storage.stringParam", "test", "testtest");
      testSimpleSetParameter("Dashboards.storage.booleanParam", true, false);
      testSimpleSetParameter("Dashboards.storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleSetParameter("Dashboards.storage.objectParam1", {a: 1, b: 2}, {});

      /*
       * storage params
       */
      testSimpleSetParameter("storage.numberParam", 1, 2);
      testSimpleSetParameter("storage.stringParam", "test", "testtest");
      testSimpleSetParameter("storage.booleanParam", true, false);
      testSimpleSetParameter("storage.arrayParam", ["test1", "test2"], ["test3", "test4"]);
      testSimpleSetParameter("storage.objectParam1", {a: 1, b: 2}, {});

      testSimpleSetParameter("nullParam", null, "test");
      expect(dashboard.parameterModel.get("nullParam")).toEqual("test");
      testSimpleSetParameter("nullParam", "test", null);
      expect(dashboard.parameterModel.get("nullParam")).toEqual(null);

      dashboard.setParameter("undefinedParam2", 123);
      expect(dashboard.getParameterValue("undefinedParam2")).toEqual(123);
      expect(dashboard.parameterModel.get("undefinedParam2")).toEqual(123);
      dashboard.setParameter("undefinedParam2", undefined);
      expect(dashboard.getParameterValue("undefinedParam2")).toEqual(123);
      expect(dashboard.parameterModel.get("undefinedParam2")).toEqual(123);
    });

    /*
     * ## The CDF framework # Syncs parameters
     */
    it("Syncs parameters", function() {
      dashboard.setParameter("parentParam", 1);
      dashboard.setParameter("childParam", 0);
      dashboard.syncParameters("parentParam", "childParam"); // Test initial syncing
      expect(dashboard.getParameterValue("childParam")).toEqual(1);

      dashboard.fireChange("parentParam", 2);// Test change propagation
      expect(dashboard.getParameterValue("childParam")).toEqual(2);
    });

    /*
     * ## The CDF framework # Gets parameters using an alias function getParam
     */
    it("Gets parameters using an alias function getParam", function() {
      dashboard.addParameter("ping", "pong");
      expect(dashboard.getParam("ping")).toEqual("pong");
    });


    /*
     * ## The CDF framework # If flatParameters is on composite params are stored as flatParameters, not objects
     */
    it("If flatParameters is on composite params are stored as flatParameters, not objects", function() {
      dashboard.setParameter("MyParam.Param1.Param", "testValue");
      dashboard.setParameter("MyParam", "testValue");
      expect(dashboard.getParameterValue("MyParam.Param1.Param")).toEqual(undefined);
      expect(dashboard.getParameterValue("MyParam")).toEqual("testValue");

      dashboard.flatParameters = true;
      dashboard.setParameter("MyParam.Param1.Param", "testValue");
      dashboard.setParameter("MyParam", "testValue");
      expect(dashboard.getParameterValue("MyParam.Param1.Param")).toEqual("testValue");
      expect(dashboard.getParameterValue("MyParam")).toEqual("testValue");
    });
  });
});
