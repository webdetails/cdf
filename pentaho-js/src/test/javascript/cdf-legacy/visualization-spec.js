/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2025 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


/**
 * ## The VisualizationAPI Component
 */
describe("The VisualizationAPI Component #", function() {

  var myDashboard = _.extend({}, Dashboards);
  myDashboard.init();

  myDashboard.addParameter('optionParameter', "value");

  var visualizationAPIComponent = new VisualizationAPIComponent();
  $.extend(visualizationAPIComponent, {
    name: "visualizationAPIComponent",
    type: "visualizationAPI",
    vizId: "sampleVisual",
    vizOptions: [["param1", "optionParameter"]],
    htmlObject: 'visualizationAPIComponent',
    queryDefinition: {
      dataAccessId: "dataAccessTestId",
      path: "/test/path",
      showValue: true
    },
    executeAtStart: true
  });

  myDashboard.addComponent(visualizationAPIComponent);

  beforeEach(function() {
    visualizationAPIComponent.__reset();
  });

  /**
   * ## The VisualizationAPI Component # Update Called
   */
  it("Update Called", function(done) {
    spyOn(visualizationAPIComponent, 'update').and.callThrough();

    myDashboard.update(visualizationAPIComponent);

    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      done();
    }, 100);
  });

  /**
   * ## The VisualizationAPI Component # __requireFilesAndUpdate is called only in the first update
   */
  it("_requireFilesAndUpdate is called only in the first update", function(done) {

    spyOn(visualizationAPIComponent, 'update').and.callThrough();
    spyOn(visualizationAPIComponent, '__requireFilesAndUpdate').and.callThrough();

    myDashboard.update(visualizationAPIComponent);

    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.__requireFilesAndUpdate.calls.count()).toBe(1);

      myDashboard.update(visualizationAPIComponent);

      setTimeout(function() {
        expect(visualizationAPIComponent.update.calls.count()).toBe(2);
        expect(visualizationAPIComponent.__requireFilesAndUpdate.calls.count()).toBe(1);
        done();
      }, 100);

    }, 100);
  });

  /**
   * ## The VisualizationAPI Component # Render Called With Cda Query Data
   */
  it("Render Called With Cda Query Data", function(done) {
    spyOn(visualizationAPIComponent, 'update').and.callThrough();
    spyOn(visualizationAPIComponent, 'triggerQuery').and.callThrough();
    spyOn(jQuery, "ajax").and.callFake(function(options) {
      options.success({resultset: "queryResults"});
    });
    spyOn(visualizationAPIComponent, '__render');
    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.__render).toHaveBeenCalledWith({resultset: 'queryResults'});
      done();
    }, 100);
  });

  /**
   * ## The VisualizationAPI Component # Check all component functions
   */
  it("Check all component functions", function(done) {
    spyOn(visualizationAPIComponent, 'update').and.callThrough();
    spyOn(visualizationAPIComponent, 'triggerQuery').and.callThrough();
    spyOn(jQuery, "ajax").and.callFake(function(options) {
      options.success({resultset: "queryResults"});
    });
    spyOn(visualizationAPIComponent, '__render').and.callThrough();

    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.__render).toHaveBeenCalledWith({ resultset : 'queryResults' });

      done();
    }, 100);
  });
});
