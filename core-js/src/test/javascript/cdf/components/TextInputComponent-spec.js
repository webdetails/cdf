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
