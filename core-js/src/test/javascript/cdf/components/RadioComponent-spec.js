/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  "cdf/Dashboard.Clean",
  "cdf/components/RadioComponent",
  "cdf/lib/jquery"
], function(Dashboard, RadioComponent, $) {

  /**
   * ## The Radio Component
   */
  describe("The Radio Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("region", "");

    dashboard.init();

    var radioComponent = new RadioComponent({
      name: "radioComponent",
      type: "RadioComponent",
      parameters:[],
      path: "/fake/regions.xaction",
      parameter: "region",
      separator: ",&nbsp;",
      valueAsId: true,
      htmlObject: "sampleObjectRadio",
      executeAtStart: true,
      postChange: function() {
        return "you chose: " + this.dashboard.getParameterValue(this.parameter);
      }
    });

    dashboard.addComponent(radioComponent);

    /**
     * ## The Radio Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(radioComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      radioComponent.once("cdf:postExecution", function() {
        expect(radioComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(radioComponent);
    });

    /**
     * ## The Radio Component # behaves correctly with parameter as null
     */
    it("behaves correctly with parameter as null", function(done) {
      dashboard.setParameter("region", null);
      spyOn(radioComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      radioComponent.once("cdf:postExecution", function() {
        expect(radioComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(radioComponent);
    });

    /**
     * ## The Radio Component # behaves correctly with parameter as undefined
     */
    it("behaves correctly with parameter as undefined", function(done) {
      dashboard.setParameter("region", undefined);
      spyOn(radioComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      radioComponent.once("cdf:postExecution", function() {
        expect(radioComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(radioComponent);
    });
  });
});
