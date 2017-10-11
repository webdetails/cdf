/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  "cdf/components/TextareaInputComponent"
], function(Dashboard, TextareaInputComponent) {
  
  /**
   * ## The Textarea Input Component
   */
  describe("The Textarea Input Component #", function() {

    var dashboard = new Dashboard();
    
    dashboard.addParameter("input", "");

    dashboard.init();

    var textareaInputComponent = new TextareaInputComponent({
      name: "textareaInputComponent",
      type: "textareaInputComponent",
      parameters: [],
      parameter: "input",
      htmlObject: "sampleObjectTextareaInput",
      executeAtStart: true,
      postChange: function() {
        return "you typed: " + this.dashboard.getParameterValue(this.parameter);
      }
    });

    dashboard.addComponent(textareaInputComponent);

    /**
     * ## The Textarea Input Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(textareaInputComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      textareaInputComponent.once("cdf:postExecution", function() {
        expect(textareaInputComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(textareaInputComponent);
    });
  });
});
