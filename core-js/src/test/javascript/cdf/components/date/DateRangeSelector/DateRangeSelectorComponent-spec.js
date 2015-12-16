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
  "cdf/Dashboard.Clean",
  "cdf/components/DateRangeSelectorComponent",
  "cdf/lib/jquery",
  "cdf/components/date/lib/blocks/DateRangeSelector/DateRangeSelectorBlock"
], function(Dashboard, DateRangeSelectorComponent, $, DateRangeSelectorBlock) {
 
  /**
   * ## The Date Range Selector Component
   */
  describe("The Date Range Selector Component #", function() {
 
    var dashboard, dateRangeSelectorComponent, htmlObject = "dateRangeSelectorObj";
 
    var $htmlObject = $('<div />').attr('id', htmlObject);
 
    beforeEach(function() {
      $('body').html($htmlObject);
      dashboard = new Dashboard();
      dashboard.addParameter("start", "2015-10-30");
      dashboard.addParameter("end", "2015-11-30");
      dashboard.addParameter("precision", "day");
      dashboard.setParameterViewMode("precision", "unused");
      dashboard.addParameter("granularity", "year");
      dashboard.setParameterViewMode("granularity", "unused");
      dateRangeSelectorComponent = new DateRangeSelectorComponent({
        type: "DateRangeSelectorComponent",
        name: "render_dateRangeSelector",
        priority: 5,
        executeAtStart: true,
        htmlObject: "dateRangeSelectorObj",
        listeners: ['start', 'end', 'precision', 'granularity'],
        dashboardParameterMap: {
          start: "start",
          end: "end",
          granularity: "granularity",
          precision: "precision"
        },
        componentDefinition: {
          actionsPosition: "top",
          inputFormat: "YYYY-MM-DD"
        },
        getParameterValue: function() { return "value" },
        change: function() {}
      });
      dateRangeSelectorComponent.dashboard = dashboard;
    });
 
    afterEach(function() {
      $htmlObject.remove();
    });
 
    /**
     * ## The Date Range Selector Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(dateRangeSelectorComponent);
 
      spyOn(dateRangeSelectorComponent, 'update').and.callThrough();
 
      // listen to cdf:postExecution event
      dateRangeSelectorComponent.once("cdf:postExecution", function() {
        expect(dateRangeSelectorComponent.update).toHaveBeenCalled();
        done();
      });
 
      dashboard.update(dateRangeSelectorComponent);
    });

    describe("parameters", function() {
      it("should set the input parameters", function() {
        var params = [ "value1", "value2" ];
        dateRangeSelectorComponent.setInputParameters(params);
        expect(dateRangeSelectorComponent.getInputParameters()).toBe(params);

        dateRangeSelectorComponent.setInputParameters(undefined);
        expect(dateRangeSelectorComponent.getInputParameters()).toBe(params);
      });

      it("should set a parameter", function() {
        dateRangeSelectorComponent.setParameter("inexistentParam", "value", false);
        expect(dateRangeSelectorComponent.getParameter("inexistentParam")).toBe(undefined);

        dateRangeSelectorComponent.setParameter("start", "value", false);
        expect(dateRangeSelectorComponent.getParameter("start")).toBe("value");
      });
    });

    describe("blocks", function() {
      it("should set block", function() {      
        var block = { on: function() {}, listenTo: function() {} };
        spyOn(dateRangeSelectorComponent, 'listenTo').and.callFake(function() {});
        dateRangeSelectorComponent._setBlock(block);
        expect(dateRangeSelectorComponent._getBlock()).toBe(block);
        expect(dateRangeSelectorComponent.listenTo).toHaveBeenCalled();

        // check that it will stop listening to the previous block
        block = { on: function() {}, stopListening: function() {} };
        spyOn(dateRangeSelectorComponent, 'stopListening').and.callFake(function() {});
        dateRangeSelectorComponent._setBlock(block);
        expect(dateRangeSelectorComponent._getBlock()).toBe(block);
        expect(dateRangeSelectorComponent.stopListening).toHaveBeenCalled();
      });

      it("should set new block", function() {
        var oldBlock = dateRangeSelectorComponent._getBlock();
        dateRangeSelectorComponent._setNewBlock();
        expect(dateRangeSelectorComponent._getBlock()).not.toEqual(oldBlock);
      });
    });

    describe("processChange", function() {
      it("executes preChange if it's defined", function(done) {
        var newBlock = new DateRangeSelectorBlock();
          var context = {
            stopListening: function() {},
            _componentBlock: new DateRangeSelectorBlock(),
            listenTo: dateRangeSelectorComponent.listenTo,
            placeholder: function() {
              return [{getBoundingClientRect: function() {
                return {bottom: 311, height: 311, left: 0, right: 912, top: 0, width: 912};
              }}];
            },            
            preChange: function() {},
            oneWayBinding: true
          };

          spyOn(context, "oneWayBinding").and.callThrough();
          spyOn(context, "listenTo").and.callThrough();
         
          spyOn(context, "preChange").and.callFake(function() {
            done();
          });
 
          dateRangeSelectorComponent._setBlock.call(context, newBlock);
          // trigger change event TODO
          newBlock.trigger("change");

      });

      it("executes postChange if it's defined", function(done) {
        var newBlock = new DateRangeSelectorBlock();
          var context = {
            stopListening: function() {},
            _componentBlock: new DateRangeSelectorBlock(),
            listenTo: dateRangeSelectorComponent.listenTo,
            placeholder: function() { return $("<div>"); },
            postChange: function() {}
          };
        
          spyOn(context, "postChange").and.callFake(function() {
            done();
          });
 
          dateRangeSelectorComponent._setBlock.call(context, newBlock);
          // trigger change event TODO
          newBlock.trigger("change");

      });
    });

    describe("setInputParameters", function() {
      it("sets the input parameters if they are a valid non-empty array", function() {
        dateRangeSelectorComponent.setInputParameters(["test"])
        expect(dateRangeSelectorComponent.getInputParameters()).toEqual(["test"]);
      });

      it("doesn't set the input parameters if the ones propvided are not a valid non-empty array", function() {
        var granularities = [ 'granularity', 'precision', 'start', 'end' ];
        dateRangeSelectorComponent.setInputParameters([]);
        expect(dateRangeSelectorComponent.getInputParameters()).toEqual(granularities);
        dateRangeSelectorComponent.setInputParameters(undefined);
        expect(dateRangeSelectorComponent.getInputParameters()).toEqual(granularities);
      });
    });

    describe("get defaults", function() {
      it("should get the defaults values", function() {       
        expect(DateRangeSelectorComponent.getDefaults('inputFormat')).toEqual("YYYY-MM-DD");
        var granularities = [ 'granularity', 'precision', 'start', 'end' ];
        expect(DateRangeSelectorComponent.getDefaults('inputParameters')).toEqual(granularities);
      });

      it("should return default value for other input", function() {
        var granularities = [ 'day', 'week', 'month', 'quarter', 'year' ];
        expect(DateRangeSelectorComponent.getDefaults('granularities')).toEqual(granularities);
      });

      it("returns undefined if the default selector value is unavailable", function() {
        expect(DateRangeSelectorComponent.getDefaults("dummy")).toEqual(undefined);
      });
    });

    describe("set defaults", function() {
      it("should set defaults", function() {
        expect(DateRangeSelectorComponent.setDefaults('inputFormat', 'YYYY-MM-DD').attributes.inputFormat).toEqual('YYYY-MM-DD');
        expect(DateRangeSelectorComponent.setDefaults('inputParameters', [ 'week' ]).attributes.inputParameters).toEqual([ 'week' ]);
      });

      it("should return default value for other input", function() {
        var granularities = [ 'day', 'week', 'month', 'quarter', 'year' ];
        expect(DateRangeSelectorComponent.setDefaults('granularities', granularities).attributes.granularities).toEqual(granularities);
      });
    });
  });
});
