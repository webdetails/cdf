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
  "cdf/Dashboard.Clean",
  "cdf/components/AnalyzerComponent"
], function(Dashboard, AnalyzerComponent) {

  /**
   * ## The Analyzer Component
   */
  describe("The Analyzer Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    dashboard.addParameter("current_date", "2016/10/18 17:55:00");

    var analyzerComponent = new AnalyzerComponent({
      name: "territorySales",
      type: "analyzer",
      solution: "public",
      path: "Steel Wheels/Widget Library/Analysis Views",
      action: "Territory Sales.xanalyzer",
      listeners: [],
      parameters: [["current_date","current_date"]],
      htmlObject: "sampleObject",
      label: "Analyzer",
      editMode: true,
      showRepositoryButtons: false,
      showFieldList: false,
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      dateFormats: {"current_date": "YYYY-MM-DD HH-mm-ss.0"}
    });

    dashboard.addComponent(analyzerComponent);

    /**
     * ## The Analyzer Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(analyzerComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      analyzerComponent.once("cdf:postExecution", function() {
        expect(analyzerComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(analyzerComponent);
    });

    describe("getOptions", function() {
      it("appends to the options object the parameter name and corresponding date format value", function() {
        expect(analyzerComponent.getOptions().current_date).toBe("2016-10-18 17-55-00.0");
      });

      it("does not change parameters that don't have a date format definition", function() {
        var _dateFormats = analyzerComponent.dateFormats;
        analyzerComponent.dateFormats = undefined;
        expect(analyzerComponent.getOptions()).toEqual(jasmine.objectContaining({
          current_date: "2016/10/18 17:55:00"
        }));
        analyzerComponent.dateFormats = _dateFormats;
      });

      it("should format the date parameter if the latter has a date format value defined", function() {
        expect(analyzerComponent.dateFormats).toEqual({current_date: "YYYY-MM-DD HH-mm-ss.0"});
        expect(analyzerComponent.getOptions()).toEqual(jasmine.objectContaining({
          current_date: "2016-10-18 17-55-00.0"
        }));
      });
    });
  });
});
