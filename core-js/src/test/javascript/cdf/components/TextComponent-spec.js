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
