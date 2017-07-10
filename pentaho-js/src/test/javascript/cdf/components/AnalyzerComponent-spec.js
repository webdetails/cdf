/*!
 * Copyright 2002 - 2017 Webdetails, a Pentaho company. All rights reserved.
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
