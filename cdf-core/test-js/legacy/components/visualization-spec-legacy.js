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

  /**
   * ## pentaho Object Mock
   */
  function DataTable(data) {
    this.data = data;
  }

  // -----

  function VisualWrapper(createOptions) {
    this.domElement = createOptions && createOptions.domElement;
  }

  VisualWrapper.prototype.update = function(drawOptions) {
    var _callback, done = false;

    setTimeout(function() {
      done = true;
      if(_callback) _callback();
    }, 0);

    return {
      then: function(callback) {
        _callback = callback;

        if(done && _callback) _callback();
      }
    }
  };

  // -----

  var sampleVisual = {id: "sampleVisual"};
  var visualTypeRegistry = {get: function() { return sampleVisual; }};

  // -----

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

  visualizationAPIComponent.__require = function(deps, callback) {
    var mods = deps.map(function(dep) {
      switch(dep) {
        case "pentaho/visual/data/DataTable": return DataTable;
        case "pentaho/visual/Wrapper": return VisualWrapper;
        case "pentaho/visual/type/registry": return visualTypeRegistry;
      }
    });

    setTimeout(function() { callback.apply(null, mods); }, 0);
  };

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
   * ## The VisualizationAPI Component # _requireFilesAndUpdate is called only in the first update
   */
  it("_requireFilesAndUpdate is called only in the first update", function(done) {
    spyOn(visualizationAPIComponent, 'update').and.callThrough();
    spyOn(visualizationAPIComponent, '_requireFilesAndUpdate').and.callThrough();

    myDashboard.update(visualizationAPIComponent);

    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent._requireFilesAndUpdate.calls.count()).toBe(1);

      myDashboard.update(visualizationAPIComponent);

      setTimeout(function() {
        expect(visualizationAPIComponent.update.calls.count()).toBe(2);
        expect(visualizationAPIComponent._requireFilesAndUpdate.calls.count()).toBe(1);
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
    spyOn(visualizationAPIComponent, 'getVisualSpec').and.callThrough();

    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.render).toHaveBeenCalledWith({ resultset : 'queryResults' });

      expect(visualizationAPIComponent.getVisualSpec).toHaveBeenCalled();
      done();
    }, 100);
  });

});
