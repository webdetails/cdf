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

/**
 * ## The VisualizationAPI Component
 */
describe("The VisualizationAPI Component #", function() {

  var myDashboard = _.extend({}, Dashboards);
  myDashboard.init();

  myDashboard.addParameter('optionParameter', "value");

  var visualizationAPIComponent = window.VisualizationAPIComponent = new VisualizationAPIComponent();
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
    spyOn(visualizationAPIComponent, 'render');
    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.render).toHaveBeenCalledWith({resultset: 'queryResults'});
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
    spyOn(visualizationAPIComponent, 'render').and.callThrough();

    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.render).toHaveBeenCalledWith({ resultset : 'queryResults' });

      done();
    }, 100);
  });
});
