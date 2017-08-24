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
  "cdf/components/TextInputComponent",
  "cdf/lib/jquery"
], function(Dashboard, TextInputComponent, $) {

  /**
   * ## The Text Input Component
   */
  describe("The Text Input Component #", function() {
    var dashboard;

    var textInputComponent = new TextInputComponent({
      name: "textInputComponent",
      type: "textInputComponent",
      parameters: [],
      parameter: "input",
      htmlObject: "sampleObjectTextInput",
      executeAtStart: true,
      postChange: function() {
        return "you typed: " + this.dashboard.getParameterValue(this.parameter);
      }
    });

    var $htmlContainer = $("<div>");
    var $htmlObject = $("<div />").attr("id", textInputComponent.htmlObject);

    beforeEach(function() {
      dashboard = new Dashboard();

      dashboard.addParameter("input", "");

      dashboard.init();
      // add an element where the button will be inserted
      $htmlContainer.append($htmlObject);
      $("body").append($htmlContainer);

      dashboard.addComponent(textInputComponent);
    });

    afterEach(function() {
      $htmlContainer.remove();
    });

    /**
     * ## The Text Input Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(textInputComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      textInputComponent.once("cdf:postExecution", function() {
        expect(textInputComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(textInputComponent);
    });

    /**
     * Checks if process event is triggered on every key press if the property refreshOnEveryKeyUp is true
     */
    it("process change on each key up event", function(done) {
      textInputComponent.refreshOnEveryKeyUp = true;

      spyOn(textInputComponent.dashboard, "processChange").and.callFake(function(name) {
        expect(name).toBe(textInputComponent.name);
        delete textInputComponent.refreshOnEveryKeyUp;
        done();
      });

      spyOn(textInputComponent, "_doAutoFocus").and.callFake(function() {
        var $el = textInputComponent.placeholder().find("#" + textInputComponent.name);

        // Change the value, so the new can be processed
        $el.val("test");
        // Creates and triggers a keyup event on the input
        $el.trigger($.Event("keyup", {keyCode: 64}));
      });

      dashboard.update(textInputComponent);
    });
  });
});
