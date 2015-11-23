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
      type: "radioComponent",
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
