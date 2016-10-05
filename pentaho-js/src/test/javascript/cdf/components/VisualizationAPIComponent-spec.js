/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  'cdf/components/VisualizationAPIComponent'
], function(Dashboard, _, $, VisualizationAPIComponent) {

  /**
   * ## The VisualizationAPI Component
   */
  describe("The VisualizationAPI Component #", function() {
    var dashboard;
    var visualizationAPIComponent;

    beforeEach(function() {
      dashboard = new Dashboard();

      dashboard.addParameter("optionParam", "value");

      dashboard.addDataSource("vizQuery", {
        dataAccessId: "dataAccessTestId",
        path: "/test/path.cda"
      });

      dashboard.init();

      visualizationAPIComponent = new VisualizationAPIComponent({
        name: "visualizationAPIComponent",
        type: "visualizationAPIComponent",
        vizId: "sampleVisual",
        vizOptions: [["param1", "optionParam"]],
        htmlObject: "visualizationAPIComponent",
        queryDefinition: {
          dataSource: "vizQuery",
          showValue: true
        },
        executeAtStart: false,
        width: 100,
        height: 100
      });

      dashboard.addComponent(visualizationAPIComponent);
    });

    /**
     * ## The VisualizationAPI Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(visualizationAPIComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(visualizationAPIComponent);
    });

    /**
     * ## The VisualizationAPI Component # render called with CDA query data
     */
    it("render called with CDA query data", function(done) {
      spyOn(visualizationAPIComponent, 'update').and.callThrough();
      spyOn(visualizationAPIComponent, 'beginQuery').and.callThrough();
      spyOn(visualizationAPIComponent, 'endExec').and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success({resultset: "queryResults"});
      });
      spyOn(visualizationAPIComponent, 'render').and.callThrough();

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.update).toHaveBeenCalled();
        expect(visualizationAPIComponent.beginQuery).toHaveBeenCalled();
        expect(visualizationAPIComponent.render).toHaveBeenCalledWith({resultset: 'queryResults'});
        expect(visualizationAPIComponent.endExec).toHaveBeenCalled();
        done();
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # check all component functions
     */
    it("Check all component functions", function(done) {
      spyOn(visualizationAPIComponent, 'update').and.callThrough();
      spyOn(visualizationAPIComponent, 'beginQuery').and.callThrough();
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });
      spyOn(visualizationAPIComponent, 'render').and.callThrough();


      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.update).toHaveBeenCalled();
        expect(visualizationAPIComponent.beginQuery).toHaveBeenCalled();
        expect(visualizationAPIComponent.render).toHaveBeenCalledWith({resultset: 'queryResults'});

        done();
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # creates a visualization View on the first update.
     */
    it("should create a visualization View on the first update", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.vizView instanceof Object).toBe(true);

        done();
      });

      expect(visualizationAPIComponent.vizView).toBe(null);

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # reuses the View
     */
    it("should reuse the same View on subsequent updates", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var view = visualizationAPIComponent.vizView;

        setTimeout(function() {
          visualizationAPIComponent.once("cdf:postExecution", function() {

            expect(visualizationAPIComponent.vizView).toBe(view);
            done();
          });

          visualizationAPIComponent.update();
        }, 0);
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # updates the model with the values of parameters in vizOptions
     */
    it("should update the model with the values of parameters in vizOptions", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var view = visualizationAPIComponent.vizView;
        spyOn(view.model, "set").and.callThrough();

        setTimeout(function() {
          visualizationAPIComponent.once("cdf:postExecution", function () {
            expect(view.model.set).toHaveBeenCalledWith("param1", "value");
            done();
          });

          visualizationAPIComponent.update();
        }, 0);
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # updates the model with the width and height property
     */
    it("should update the model with the width and height property", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var view = visualizationAPIComponent.vizView;

        expect(view.model.width).toBe(200);
        expect(view.model.height).toBe(300);
        done();
      });

      visualizationAPIComponent.width = 200;
      visualizationAPIComponent.height = 300;

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # updates the view when the component updates
     */
    it("should update the model with the width and height property", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var view = visualizationAPIComponent.vizView;

        setTimeout(function() {
          spyOn(view, "update").and.callThrough();

          visualizationAPIComponent.once("cdf:postExecution", function() {
            expect(view.update).toHaveBeenCalled();

            done();
          });

          visualizationAPIComponent.update();
        }, 0);
      });

      visualizationAPIComponent.update();
    });
  });
});
