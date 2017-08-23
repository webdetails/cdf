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
  "cdf/components/TextInputComponent",
  "cdf/lib/jquery"
], function(Dashboard, TextInputComponent, $) {

  /**
   * ## The Text Input Component
   */
  describe("The Text Input Component #", function() {
    var dashboard = new Dashboard();
    var htmlObject = "sampleObjectTextInput";
    dashboard.addParameter("input", "");

    var textInputComponent = new TextInputComponent({
      name: "textInputComponent",
      type: "textInputComponent",
      parameters: [],
      parameter: "input",
      htmlObject: htmlObject,
      executeAtStart: true,
      postChange: function() {
        return "you typed: " + this.dashboard.getParameterValue(this.parameter);
      }
    });

    dashboard.addComponent(textInputComponent);
    dashboard.init();

    var $htmlObject = $("<div />").attr("id", htmlObject);

    beforeEach(function() {
      $("body").append($htmlObject);
    });
    afterEach(function() {
      $htmlObject.remove();
    });

    /**
     * ## The Text Input Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update with empty value", function(done) {
      spyOn(textInputComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      textInputComponent.once("cdf:postExecution", function() {
        expect(textInputComponent.update).toHaveBeenCalled();
        expect(textInputComponent.getValue()).toEqual("");
        done();
      });

      dashboard.update(textInputComponent);
    });

    it("allows a dashboard to execute update with html specific value", function(done) {
      dashboard.setParameter("input", "'<>'");
      spyOn(textInputComponent, 'update').and.callThrough();

      textInputComponent.once("cdf:postExecution", function() {
        expect(textInputComponent.update).toHaveBeenCalled();
        expect(textInputComponent.getValue()).toEqual("'<>'");
        done();
      });

      dashboard.update(textInputComponent);
    });
  });
});
