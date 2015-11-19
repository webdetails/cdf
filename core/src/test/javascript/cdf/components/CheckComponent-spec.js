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
