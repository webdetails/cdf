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
      spyOn(visualizationAPIComponent, '__render').and.callThrough();

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.update).toHaveBeenCalled();
        expect(visualizationAPIComponent.beginQuery).toHaveBeenCalled();
        expect(visualizationAPIComponent.__render).toHaveBeenCalledWith({resultset: 'queryResults'});
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
      spyOn(visualizationAPIComponent, '__render').and.callThrough();


      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.update).toHaveBeenCalled();
        expect(visualizationAPIComponent.beginQuery).toHaveBeenCalled();
        expect(visualizationAPIComponent.__render).toHaveBeenCalledWith({resultset: 'queryResults'});

        done();
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # creates a visualization on the first update.
     */
    it("should create a visualization on the first update", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        expect(visualizationAPIComponent.viz instanceof Object).toBe(true);
        expect(visualizationAPIComponent.__vizView instanceof Object).toBe(true);

        done();
      });

      expect(visualizationAPIComponent.viz).toBe(null);

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # reuses the visualization
     */
    it("should reuse the same viz on subsequent updates", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var viz = visualizationAPIComponent.viz;

        setTimeout(function() {
          visualizationAPIComponent.once("cdf:postExecution", function() {

            expect(visualizationAPIComponent.viz).toBe(viz);
            done();
          });

          visualizationAPIComponent.update();
        }, 0);
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # updates the viz with the values of parameters in vizOptions
     */
    it("should update the viz with the values of parameters in vizOptions", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var viz = visualizationAPIComponent.viz;
        spyOn(viz, "configure").and.callThrough();

        setTimeout(function() {
          visualizationAPIComponent.once("cdf:postExecution", function () {
            expect(viz.configure).toHaveBeenCalledWith(jasmine.objectContaining({
              "param1": "value"
            }));

            done();
          });

          visualizationAPIComponent.update();
        }, 0);
      });

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # updates the viz with the width and height property
     */
    it("should update the viz with the width and height property", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var viz = visualizationAPIComponent.viz;

        expect(viz.width).toBe(200);
        expect(viz.height).toBe(300);
        done();
      });

      visualizationAPIComponent.width = 200;
      visualizationAPIComponent.height = 300;

      visualizationAPIComponent.update();
    });

    /**
     * ## The VisualizationAPI Component # updates the viz when the component updates
     */
    it("should update the view when the component updates", function(done) {
      spyOn($, "ajax").and.callFake(function(options) {
        options.success({resultset: "queryResults"});
      });

      // listen to cdf:postExecution event
      visualizationAPIComponent.once("cdf:postExecution", function() {
        var viz = visualizationAPIComponent.viz;

        setTimeout(function() {
          spyOn(viz, "update").and.callThrough();

          visualizationAPIComponent.once("cdf:postExecution", function() {
            expect(viz.update).toHaveBeenCalled();

            done();
          });

          visualizationAPIComponent.update();
        }, 0);
      });

      visualizationAPIComponent.update();
    });
  });
});
