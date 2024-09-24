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
