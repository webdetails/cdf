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
  "cdf/components/TextComponent"
], function(Dashboard, TextComponent) {

  /**
   * ## The Text Component
   */
  describe("The Text Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var textComponent = new TextComponent({
      name: "textComponent",
      type: "textComponent",
      htmlObject: "sampleObjectText",
      listeners: [],
      expression: function() { return "My text generated in " + new Date(); },
      executeAtStart: true
    });

    dashboard.addComponent(textComponent);

    /**
     * ## The Text Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(textComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      textComponent.once("cdf:postExecution", function() {
        expect(textComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(textComponent);
    });

    /**
     * ## The Text Component # calls expression when update is called
     */
    it("calls expression when update is called", function(done) {
      spyOn(textComponent, 'update').and.callThrough();
      spyOn(textComponent, 'expression').and.callThrough();

      // listen to cdf:postExecution event
      textComponent.once("cdf:postExecution", function() {
        expect(textComponent.update).toHaveBeenCalled();
        expect(textComponent.expression).toHaveBeenCalled();
        done();
      });

      dashboard.update(textComponent);
    });
  });
});
