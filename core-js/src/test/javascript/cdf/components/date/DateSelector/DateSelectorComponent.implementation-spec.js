/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define([
  "cdf/components/date/DateSelector/DateSelectorComponent.implementation",
  "cdf/components/date/lib/blocks/CustomDate/CustomDateBlock",
  "cdf/lib/jquery"
], function(DateSelectorComponentImpl, CustomDateBlock, $) {

  describe("The Date Selector Component implementation #", function() {
    var datCompImpl;

    beforeEach(function() {
      datCompImpl = new DateSelectorComponentImpl();
    });

    describe("update", function() {
      it("executes the synchronous function", function() {
        spyOn(datCompImpl, "synchronous");
        datCompImpl.update();
        expect(datCompImpl.synchronous).toHaveBeenCalled();
      });
    });

    describe("getParameter", function() {
      it("gets the parameter value from the dashboard", function() {
        spyOn(datCompImpl, "getParameter").and.callThrough();

        datCompImpl.dashboardParameterMap = {"aParamName": "aDashParamName"};
        datCompImpl.dashboard = {getParameterValue: function(paramName) { return; }};
        spyOn(datCompImpl.dashboard, "getParameterValue").and.callThrough();

        datCompImpl.getParameter("aParamName");
        
        expect(datCompImpl.dashboard.getParameterValue).toHaveBeenCalledWith("aDashParamName");
      });
    });

    describe("setParameter", function() {
      it("sets the parameter value in the dashboard when a valid parameter is mapped", function() {
        spyOn(datCompImpl, "setParameter").and.callThrough();

        datCompImpl.dashboardParameterMap = {"aParamName": "aDashParamName"};
        datCompImpl.dashboard = {
          fireChange: function(dashboardParamName , value) { return; },
          setParameter: function(dashboardParamName , value) { return; }
        };

        spyOn(datCompImpl.dashboard, "fireChange").and.callThrough();
        datCompImpl.setParameter("aParamName", "aValue", true);
        expect(datCompImpl.dashboard.fireChange).toHaveBeenCalledWith("aDashParamName", "aValue");

        spyOn(datCompImpl.dashboard, "setParameter").and.callThrough();
        datCompImpl.setParameter("aParamName", "aValue", false);
        expect(datCompImpl.dashboard.setParameter).toHaveBeenCalledWith("aDashParamName", "aValue");
      });

      it("doesn't set the parameter value in the dashboard when no valid parameter mapping exists", function() {
        spyOn(datCompImpl, "setParameter").and.callThrough();

        datCompImpl.dashboardParameterMap = {};
        datCompImpl.dashboard = {
          fireChange: function(dashboardParamName , value) { return; },
          setParameter: function(dashboardParamName , value) { return; }
        };

        spyOn(datCompImpl.dashboard, "fireChange").and.callThrough();
        datCompImpl.setParameter("aParamName", "aValue", true);
        expect(datCompImpl.dashboard.fireChange).not.toHaveBeenCalled();

        spyOn(datCompImpl.dashboard, "setParameter").and.callThrough();
        datCompImpl.setParameter("aParamName", "aValue", false);
        expect(datCompImpl.dashboard.setParameter).not.toHaveBeenCalled();
      });
    });

    describe("_getBlock", function() {
      it("gets the block if it exists", function() {
        spyOn(datCompImpl, "_getBlock").and.callThrough();
        expect(datCompImpl._getBlock.call({_componentBlock: "block"})).toEqual("block");
      });

      it("gets a new block if none exists", function() {
        spyOn(datCompImpl, "_getBlock").and.callThrough();
        var context = {listenTo: function() {}};
        spyOn(context, "listenTo").and.callThrough();
        datCompImpl._getBlock.call(context);
        expect(context.listenTo).toHaveBeenCalled();
      });
    });

    describe("_setBlock", function() {
      it("allows setting a blocks", function() {
        var block1 = new CustomDateBlock();
        var block2 = new CustomDateBlock();

        expect(block1).not.toEqual(block2);
        datCompImpl._setBlock(block1);
        expect(datCompImpl._getBlock()).toEqual(block1);
        datCompImpl._setBlock(block2);
        expect(datCompImpl._getBlock()).toEqual(block2);
      });

      it("stops listening to change events in the current block before listening to change events in the newly set block", function(done) {
        var newBlock = new CustomDateBlock();
        var oldBlock = new CustomDateBlock();
        var context = {
          stopListening: function() {},
          _componentBlock: oldBlock,
          listenTo: function() {}
        };
        spyOn(context, "stopListening").and.callThrough();
        spyOn(context, "listenTo").and.callFake(function() {
          expect(context.stopListening).toHaveBeenCalledWith(oldBlock);
          expect(arguments[0]).toEqual(newBlock);
          expect(arguments[1]).toEqual("change");
          expect(typeof arguments[2]).toEqual("function");
          done();
        });
        datCompImpl._setBlock.call(context, newBlock);
      });

      it("listens to change events on the newly set block", function(done) {
        var newBlock = new CustomDateBlock();
        var context = {
          stopListening: function() {},
          _componentBlock: new CustomDateBlock(),
          listenTo: datCompImpl.listenTo,
          placeholder: function() { return $("<div>"); },
          oneWayBinding: true,
          postChange: function() {}
        };
        spyOn(context, "postChange").and.callFake(function() {
          done();
        });

        datCompImpl._setBlock.call(context, newBlock);

        newBlock.trigger("change");
      });
    });

    describe("_setNewBlock", function() {
      it("allows setting a new blocks", function() {
        var oldBlock = datCompImpl._getBlock();
        datCompImpl._setNewBlock();
        expect(datCompImpl._getBlock()).not.toEqual(oldBlock);
      });
    });

    describe("processChange", function() {
      it("executes a preChange function if it is defined", function(done) {
        var newBlock = new CustomDateBlock();
        var context = {
          stopListening: function() {},
          _componentBlock: new CustomDateBlock(),
          listenTo: datCompImpl.listenTo,
          placeholder: function() {
            return [{getBoundingClientRect: function() {
              return {bottom: 311, height: 311, left: 10, right: 0, top: 0, width: 2};
            }}];
          },
          preChange: function() {},
          oneWayBinding: true
        };
        spyOn(context, "preChange").and.callFake(function(newDate) {
          expect(newDate.date).toEqual("2015-12-15");
          done();
        });

        datCompImpl._setBlock.call(context, newBlock);

        newBlock.trigger("change", "2015-12-15");
      });

      it("executes a postChange function if it is defined", function(done) {
        var newBlock = new CustomDateBlock();
        var context = {
          stopListening: function() {},
          _componentBlock: new CustomDateBlock(),
          listenTo: datCompImpl.listenTo,
          placeholder: function() { return $("<div>"); },
          postChange: function() {},
        };
        spyOn(context, "postChange").and.callFake(function(newDate) {
          expect(newDate.date).toEqual("2015-12-15");
          done();
        });

        datCompImpl._setBlock.call(context, newBlock);

        newBlock.trigger("change", "2015-12-15");
      });
    });

    describe("getInputParameters", function() {
      it("gets the current input parameters if it is a non-empty array", function() {
        var context = {_inputParameters: ["param"]};
        expect(datCompImpl.getInputParameters.call(context)).toEqual(context._inputParameters);
      });

      it("gets the default input parameters when the current parameters are invalid", function() {
        var context = {_inputParameters: undefined};
        expect(datCompImpl.getInputParameters.call(context)).toEqual(["date"]);
      });
    });

    describe("setInputParameters", function() {
      it("sets the input parameters if they are a valid non-empty array", function() {
        datCompImpl.setInputParameters(["test"])
        expect(datCompImpl.getInputParameters()).toEqual(["test"]);
      });

      it("doesn't set the input parameters if the ones propvided are not a valid non-empty array", function() {
        datCompImpl.setInputParameters([]);
        expect(datCompImpl.getInputParameters()).toEqual(["date"]);
        datCompImpl.setInputParameters(undefined);
        expect(datCompImpl.getInputParameters()).toEqual(["date"]);
      });
    });

    describe("getDefaults", function() {
      it("gets the default selector values", function() {
        expect(DateSelectorComponentImpl.getDefaults("inputFormat")).toEqual("YYYY-MM-DD");
        expect(DateSelectorComponentImpl.getDefaults("inputParameters")).toEqual([ "date" ]);
      });

      it("gets the default selector values from CustomDateBlock if none are available", function() {
        expect(DateSelectorComponentImpl.getDefaults("precision")).toEqual("day");
      });

      it("returns undefined if the default selector value is unavailable", function() {
        expect(DateSelectorComponentImpl.getDefaults("dummy")).toEqual(undefined);
      });
    });

    describe("setDefaults", function() {
      it("sets the default selector values", function() {
        expect(DateSelectorComponentImpl.setDefaults("inputFormat", "DD-MM-YYYY").attributes.inputFormat).toEqual("DD-MM-YYYY");
        expect(DateSelectorComponentImpl.setDefaults("inputParameters", [ "week" ]).attributes.inputParameters).toEqual([ "week" ]);
      });

      it("sets the default selector values for CustomDateBlock if the values are not part of the date selector defaults", function() {
        expect(DateSelectorComponentImpl.setDefaults("precision", "week").attributes.precision).toEqual("week");
      });
    });
  });
});
