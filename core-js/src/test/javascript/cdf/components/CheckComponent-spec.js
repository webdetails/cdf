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
  "cdf/components/CheckComponent",
  "cdf/lib/jquery"
], function(Dashboard, CheckComponent, $) {
  
  /**
   * ## The Check Component
   */
  describe("The Check Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("input", "");

    dashboard.init();

    var checkComponent = new CheckComponent({
      name: "checkComponent",
      type: "checkComponent",
      parameters: [],
      path: "/fake/test.xaction",
      parameter: "input",
      separator: ",&nbsp;",
      valueAsId: true,
      htmlObject: "sampleObjectCheck",
      executeAtStart: true,
      postChange: function() { return; }
    });

    dashboard.addComponent(checkComponent);

    /**
     * ## The Check Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(checkComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      checkComponent.once("cdf:postExecution", function() {
        expect(checkComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(checkComponent);
    });

    /**
     * ## The Check Component # behaves correctly with parameter as null
     */
    it("behaves correctly with parameter as null", function(done) {
      dashboard.setParameter("input", null);
      spyOn(checkComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      checkComponent.once("cdf:postExecution", function() {
        expect(checkComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(checkComponent);
    });

    /**
     * ## The Check Component # behaves correctly with parameter as undefined
     */
    it("behaves correctly with parameter as undefined", function(done) {
      dashboard.setParameter("input", undefined);
      spyOn(checkComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      checkComponent.once("cdf:postExecution", function() {
        expect(checkComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(checkComponent);
    });
  });
});
