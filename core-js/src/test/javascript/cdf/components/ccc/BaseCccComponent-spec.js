/*!
 * Copyright 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  'cdf/Dashboard.Clean',
  'amd!cdf/lib/underscore',
  'cdf/lib/jquery',
  'cdf/lib/CCC/pvc',
  'cdf/components/ccc/CccBarChartComponent' // using bar chart as example, because the base cant be rendered
], function(Dashboard, _, $, pvc, CccBarChartComponent) {

  /**
   * ## The Base Ccc Component
   */
  describe("The Base Ccc Component #", function() {
    var dashboard;
    var cccBarChartComponent;

    beforeEach(function() {
      dashboard = new Dashboard();

      dashboard.addParameter("optionParam", "value");

      dashboard.addDataSource("vizQuery", {
        dataAccessId: "dataAccessTestId",
        path: "/test/path.cda"
      });

      dashboard.init();

      cccBarChartComponent = new CccBarChartComponent({
        name: "BaseCccComponent",
        type: "CccBarChartComponent",
        htmlObject: "baseCccComponent",
        executeAtStart: false,
        chartDefinition: {
          width: 100,
          height: 100,
          dataSource: "vizQuery",
          showValue: true
        }
      });

      dashboard.addComponent(cccBarChartComponent);
    });

    /**
     * ## The Base Ccc Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(cccBarChartComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      cccBarChartComponent.once("cdf:postExecution", function() {
        expect(cccBarChartComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(cccBarChartComponent);
    });

    /**
     * ## The Base Ccc Component # render called with CDA query data
     */
    it("render called with CDA query data", function(done) {
      spyOn(cccBarChartComponent, 'update').and.callThrough();
      spyOn(cccBarChartComponent, 'beginQuery').and.callThrough();
      spyOn(cccBarChartComponent, 'endExec').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success({resultset: "queryResults"});
      });
      spyOn(cccBarChartComponent, 'render').and.callThrough();

      // listen to cdf:postExecution event
      cccBarChartComponent.once("cdf:postExecution", function() {
        expect(cccBarChartComponent.update).toHaveBeenCalled();
        expect(cccBarChartComponent.beginQuery).toHaveBeenCalled();
        expect(cccBarChartComponent.render).toHaveBeenCalledWith({resultset: 'queryResults'});
        expect(cccBarChartComponent.endExec).toHaveBeenCalled();
        done();
      });

      cccBarChartComponent.update();
    });

    /**
     * ## The Base Ccc Component # render called with execute when query is not available
     */
    it("render called with execute when query is not available", function(done) {
      var cccBarChartComponentQueryless = new CccBarChartComponent({
        name: "baseCccComponent2",
        type: "CccBarChartComponent",
        htmlObject: "baseCccComponent2",
        executeAtStart: false,
        valuesArray: {},
        chartDefinition: {
          width: 100,
          height: 100
        }
      });

      dashboard.addComponent(cccBarChartComponentQueryless);

      
      spyOn(cccBarChartComponentQueryless, 'update').and.callThrough();
      spyOn(cccBarChartComponentQueryless, 'execute').and.callThrough();
      spyOn(cccBarChartComponentQueryless, 'endExec').and.callThrough();
      spyOn(cccBarChartComponentQueryless, 'render').and.callThrough();

      // listen to cdf:postExecution event
      cccBarChartComponentQueryless.once("cdf:postExecution", function() {
        expect(cccBarChartComponentQueryless.update).toHaveBeenCalled();
        expect(cccBarChartComponentQueryless.execute).toHaveBeenCalled();
        expect(cccBarChartComponentQueryless.render).toHaveBeenCalledWith({});
        expect(cccBarChartComponentQueryless.endExec).toHaveBeenCalled();
        done();
      });

      cccBarChartComponentQueryless.update();
    });

    /**
     * ## The Base Ccc Component # render called with execute when no data is available
     */
    it("render called with execute when no data is available", function(done) {
      var cccBarChartComponentNoData = new CccBarChartComponent({
        name: "baseCccComponent2",
        type: "CccBarChartComponent",
        htmlObject: "baseCccComponent2",
        executeAtStart: false,
        chartDefinition: {
          width: 100,
          height: 100
        }
      });

      dashboard.addComponent(cccBarChartComponentNoData);


      spyOn(cccBarChartComponentNoData, 'update').and.callThrough();
      spyOn(cccBarChartComponentNoData, 'execute').and.callThrough();
      spyOn(cccBarChartComponentNoData, 'endExec').and.callThrough();
      spyOn(cccBarChartComponentNoData, 'render').and.callThrough();

      // listen to cdf:postExecution event
      cccBarChartComponentNoData.once("cdf:postExecution", function() {
        expect(cccBarChartComponentNoData.update).toHaveBeenCalled();      
        expect(cccBarChartComponentNoData.execute).toHaveBeenCalled();
        expect(cccBarChartComponentNoData.render).toHaveBeenCalled();
        expect(cccBarChartComponentNoData.endExec).toHaveBeenCalled();
        done();
      });

      cccBarChartComponentNoData.update();
    });

    /**
     * ## The Base Ccc Component # check all component functions
     */
    it("Check all component functions", function(done) {
      spyOn(cccBarChartComponent, 'update').and.callThrough();
      spyOn(cccBarChartComponent, 'beginQuery').and.callThrough();
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });
      spyOn(cccBarChartComponent, 'render').and.callThrough();


      // listen to cdf:postExecution event
      cccBarChartComponent.once("cdf:postExecution", function() {
        expect(cccBarChartComponent.update).toHaveBeenCalled();
        expect(cccBarChartComponent.beginQuery).toHaveBeenCalled();
        expect(cccBarChartComponent.render).toHaveBeenCalledWith({resultset: 'queryResults'});

        done();
      });

      cccBarChartComponent.update();
    });

    it("Gets the correct Ccc Visualization Name", function () {
      expect(cccBarChartComponent._cccVizName).toBeNull();
      cccBarChartComponent.getCccVisualizationName();
      expect(cccBarChartComponent._cccVizName).not.toBeNull();
    })

    it("Gets the correct default ccc compat version and marks the viz api definitions to be applied", function () {
      expect(cccBarChartComponent._vizApiStyles).toBeUndefined();
      cccBarChartComponent._preProcessChartDefinition();
      expect(cccBarChartComponent._vizApiStyles).toBeTruthy();

      cccBarChartComponent.chartDefinition.compatVersion = 2;
      cccBarChartComponent._preProcessChartDefinition();
      expect(cccBarChartComponent._vizApiStyles).toBeTruthy();
    });

    it("Gets the correct ccc compat version and marks the viz api definitions to be applied", function () {
      expect(cccBarChartComponent._vizApiStyles).toBeUndefined();
      cccBarChartComponent.chartDefinition.compatVersion = 3;
      cccBarChartComponent._preProcessChartDefinition();
      expect(cccBarChartComponent._vizApiStyles).toBeTruthy();
    });

    it("Gets the correct ccc compat version and marks the viz api definitions to be applied", function () {
      expect(cccBarChartComponent._vizApiStyles).toBeUndefined();
      cccBarChartComponent.chartDefinition.compatVersion = 2;
      cccBarChartComponent._preProcessChartDefinition();
      expect(cccBarChartComponent._vizApiStyles).toBeUndefined();
    });

    it("Internal Render Assigns Colors if that is intended", function () {
      cccBarChartComponent._vizApiStyles = true;
      cccBarChartComponent.chartDefinition.colors = ['test'];
      cccBarChartComponent._renderInner({}, {});
      expect(cccBarChartComponent.chartDefinition.colors[0]).toBe('test');

      cccBarChartComponent._vizApiStyles = false;
      cccBarChartComponent.chartDefinition.colors = ['test'];
      cccBarChartComponent._renderInner({}, {});
      expect(cccBarChartComponent.chartDefinition.colors[0]).toBe('test');

      cccBarChartComponent._vizApiStyles = false;
      cccBarChartComponent.chartDefinition.colors = undefined;
      cccBarChartComponent._renderInner({}, {});
      expect(cccBarChartComponent.chartDefinition.colors).toBeUndefined();
    });
  });

});
