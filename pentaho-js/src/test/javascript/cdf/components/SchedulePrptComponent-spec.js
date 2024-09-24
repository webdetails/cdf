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
  "cdf/components/SchedulePrptComponent",
  "cdf/lib/jquery"
], function(Dashboard, SchedulePrptComponent, $) {

  /**
   * ## The Schedule Pentaho Reporting Component
   */
  describe("The Schedule Pentaho Reporting Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var schedulePrpt = new SchedulePrptComponent({
      name: "schedulePrpt",
      type: "schedulePrpt",
      htmlObject: "sampleObjectSchedulePrpt",
      executeAtStart: true,
      parameters: [["parameter", "parameter"], ["parameterArray", "parameterArray"]]
    });
    var dashboardSimpleParameter = "parameterValue";
    dashboard.addParameter("parameter", dashboardSimpleParameter);
    var dashboardParameterArray = ["paramVal1", "paramVal2"];
    dashboard.addParameter("parameterArray", dashboardParameterArray);
    dashboard.addComponent(schedulePrpt);

    /**
     * ## The Schedule Pentaho Reporting Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(schedulePrpt, 'update').and.callThrough();

      // listen to cdf:postExecution event
      schedulePrpt.once("cdf:postExecution", function() {
        expect(schedulePrpt.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(schedulePrpt);
    });

    /**
     * ## The Schedule Pentaho Reporting Component # properly creates job parameters
     */
    it("properly creates job parameters", function(done) {
      var createVal = function(val) {
        return new Array("" + val);
      };
      var testNames = ["output-target", "accepted-page", "showParameters", "renderMode", "htmlProportionalWidth",
      "parameter", "parameterArray"];
      var testValues = [createVal("table/html;page-mode=page"), createVal(-1), createVal(schedulePrpt.showParameters || false),
      createVal("REPORT"), createVal(false), createVal(dashboardSimpleParameter), dashboardParameterArray];
      var testTypes = ["string", "string", "string", "string", "string", "string", "string[]"];

      spyOn($, "ajax").and.callFake(function() {
        var jobParams = schedulePrpt.scheduleParameters.jobParameters;
        for(var i = 0; i < jobParams.length; i++) {
          expect(jobParams[i].name).toEqual(testNames[i]);
          expect(jobParams[i].stringValue).toEqual(testValues[i]);
          expect(jobParams[i].type).toEqual(testTypes[i]);
        }
        done();
        return false;
      });

      schedulePrpt.scheduleRequest();
    });
  });
});
