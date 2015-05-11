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

define([
  'cdf/Dashboard.Clean', 
  'amd!cdf/lib/underscore', 
  'cdf/lib/jquery', 
  'cdf/components/VisualizationAPIComponent',
  'common-ui/vizapi/vizTypeRegistry'
], function(Dashboard, _, $, VisualizationAPIComponent, vizTypeRegistryMock) {

  /**
   * ## The VisualizationAPI Component
   */
  describe("The VisualizationAPI Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter( "optionParam", "value");

    dashboard.init();

    var visualizationAPIComponent = new VisualizationAPIComponent({
      name: "visualizationAPIComponent",
      type: "visualizationAPIComponent",
      vizId: "sampleViz",
      vizOptions: [["param1", "optionParam"]],
      htmlObject: 'visualizationAPIComponent',
      queryDefinition: {
        dataAccessId: "dataAccessTestId",
        path: "/test/path",
        showValue: true
      },
      executeAtStart: true
    });

    dashboard.addComponent(visualizationAPIComponent);

    /**
     * ## The VisualizationAPI Component # Update Called
     */
    it("Update Called", function(done){
      spyOn(visualizationAPIComponent, 'update').and.callThrough();
      dashboard.update(visualizationAPIComponent);
      setTimeout(function(){
        expect(visualizationAPIComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });

    /**
     * ## The VisualizationAPI Component # Render Called With Cda Query Data
     */
    it("Render Called With Cda Query Data", function(done) {
      spyOn(visualizationAPIComponent, 'update'    ).and.callThrough();
      spyOn(visualizationAPIComponent, 'beginQuery').and.callThrough();
      spyOn(visualizationAPIComponent, 'endExec'   ).and.callThrough();
      var ajax = spyOn($, "ajax").and.callFake(function(options) {
        options.success({
          resultset: "queryResults"
        });
      });
      spyOn(visualizationAPIComponent, 'render').and.callThrough();
      
      visualizationAPIComponent.update();
      
      setTimeout(function() {
        expect(visualizationAPIComponent.update    ).toHaveBeenCalled();
        expect(visualizationAPIComponent.beginQuery).toHaveBeenCalled();
        expect(visualizationAPIComponent.render    ).toHaveBeenCalledWith({resultset : 'queryResults'});
        expect(visualizationAPIComponent.endExec   ).toHaveBeenCalled();
        done();
      }, 100);
    });

    /**
     * ## The VisualizationAPI Component # Check all component functions
     */
    it("Check all component functions", function(done) {
      spyOn(visualizationAPIComponent, 'update'      ).and.callThrough();
      spyOn(visualizationAPIComponent, 'beginQuery'  ).and.callThrough();
      var ajax = spyOn($, "ajax").and.callFake(function(options) {
        options.success({
          resultset: "queryResults"
        });
      });
      spyOn(visualizationAPIComponent, 'render'    ).and.callThrough();
      spyOn(visualizationAPIComponent, 'getVizType').and.callThrough();
      
      spyOn(vizTypeRegistryMock,       'get').and.callThrough();
      spyOn(visualizationAPIComponent, 'getVizOptions' );
      spyOn(visualizationAPIComponent, 'createGoogleDataTable' );

      visualizationAPIComponent.update();
      
      setTimeout(function() {
        expect(visualizationAPIComponent.update       ).toHaveBeenCalled();
        expect(visualizationAPIComponent.beginQuery   ).toHaveBeenCalled();
        expect(visualizationAPIComponent.render       ).toHaveBeenCalledWith({resultset : 'queryResults'});
        expect(visualizationAPIComponent.getVizType   ).toHaveBeenCalled();
        expect(vizTypeRegistryMock.get                ).toHaveBeenCalledWith("sampleViz");
        expect(visualizationAPIComponent.getVizOptions).toHaveBeenCalled();
        expect(visualizationAPIComponent.createGoogleDataTable)
          .toHaveBeenCalledWith({resultset: 'queryResults'});
        done();
      }, 100);
    });
  });
});
