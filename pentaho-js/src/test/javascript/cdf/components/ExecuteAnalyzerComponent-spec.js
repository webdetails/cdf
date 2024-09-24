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
  "cdf/components/ExecuteAnalyzerComponent",
  "cdf/lib/jquery"
], function(Dashboard, ExecuteAnalyzerComponent, $) {

  /**
   * ## The Execute Analyzer Component
   */
  describe("The Execute Analyzer Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var executeAnalyzerComponent = new ExecuteAnalyzerComponent({
      name: "executeAnalyzerSpec",
      type: "executeAnalyzer",
      htmlObject: "sampleObjectEA",
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; }
    });

    dashboard.addComponent(executeAnalyzerComponent);

    var $htmlObject = $("<div />").attr("id", executeAnalyzerComponent.htmlObject);

    beforeEach(function() {
      $('body').append($htmlObject);
    });

    afterEach(function() {
      $htmlObject.remove();
    });

    /**
     * ## The Execute Analyzer Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(executeAnalyzerComponent, "update").and.callThrough();
      spyOn(executeAnalyzerComponent, "preChange").and.callThrough();
      spyOn(executeAnalyzerComponent, "postChange").and.callThrough();

      // listen to cdf:postExecution event
      executeAnalyzerComponent.once("cdf:postExecution", function() {
        expect(executeAnalyzerComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(executeAnalyzerComponent);
    });

    /**
     * ## The Execute Analyzer Component # executes the pre and post change functions if they are defined
     */
    it("executes the pre and post change functions if they are defined", function(done) {
      spyOn(executeAnalyzerComponent, "update").and.callThrough();
      spyOn(executeAnalyzerComponent, "executeAnalyzerComponent");
      spyOn(executeAnalyzerComponent, "preChange").and.callThrough();
      spyOn(executeAnalyzerComponent, "postChange").and.callThrough();

      // listen to cdf:postExecution event
      executeAnalyzerComponent.once("cdf:postExecution", function() {
        expect(executeAnalyzerComponent.update).toHaveBeenCalled();

        $htmlObject.find("button").one('click', function() {
          expect(executeAnalyzerComponent.preChange).toHaveBeenCalled();
          expect(executeAnalyzerComponent.executeAnalyzerComponent).toHaveBeenCalled();
          expect(executeAnalyzerComponent.postChange).toHaveBeenCalled();
          done();
        });

        expect(executeAnalyzerComponent.preChange).not.toHaveBeenCalled();
        expect(executeAnalyzerComponent.executeAnalyzerComponent).not.toHaveBeenCalled();
        expect(executeAnalyzerComponent.postChange).not.toHaveBeenCalled();
        $htmlObject.find("button").click();
      });

      dashboard.update(executeAnalyzerComponent);
    });

    /**
     * ## The Execute Analyzer Component # allows having the preChange and postChange functions undefined
     */
    it("allows having the preChange and postChange functions undefined", function(done) {
      var _preChange = executeAnalyzerComponent.preChange;
      var _postChange = executeAnalyzerComponent.postChange;
      executeAnalyzerComponent.preChange = undefined;
      executeAnalyzerComponent.postChange = undefined;
      spyOn(executeAnalyzerComponent, "update").and.callThrough();
      spyOn(executeAnalyzerComponent, "executeAnalyzerComponent");

      // listen to cdf:postExecution event
      executeAnalyzerComponent.once("cdf:postExecution", function() {
        expect(executeAnalyzerComponent.update).toHaveBeenCalled();

        $htmlObject.find("button").one('click', function() {
          expect(executeAnalyzerComponent.executeAnalyzerComponent).toHaveBeenCalled();
          executeAnalyzerComponent.preChange = _preChange;
          executeAnalyzerComponent.postChange = _postChange;
          done();
        });

        expect(executeAnalyzerComponent.executeAnalyzerComponent).not.toHaveBeenCalled();
        $htmlObject.find("button").click();
      });
      dashboard.update(executeAnalyzerComponent);
    });

    /**
     * ## The Execute Analyzer Component # doesn't execute the executeAnalyzerComponent function if preChange returns a falsy
     */
    it("doesn't execute the executeAnalyzerComponent function if preChange returns a falsy", function(done) {
      var _preChange = executeAnalyzerComponent.preChange;
      executeAnalyzerComponent.preChange = function() { return false; };
      spyOn(executeAnalyzerComponent, "update").and.callThrough();
      spyOn(executeAnalyzerComponent, "executeAnalyzerComponent");

      // listen to cdf:postExecution event
      executeAnalyzerComponent.once("cdf:postExecution", function() {
        expect(executeAnalyzerComponent.update).toHaveBeenCalled();

        $htmlObject.find("button").one('click', function() {
          expect(executeAnalyzerComponent.executeAnalyzerComponent).not.toHaveBeenCalled();
          executeAnalyzerComponent.preChange = _preChange;
          done();
        });

        expect(executeAnalyzerComponent.executeAnalyzerComponent).not.toHaveBeenCalled();
        $htmlObject.find("button").click();
      });
      dashboard.update(executeAnalyzerComponent);
    });
  });
});
