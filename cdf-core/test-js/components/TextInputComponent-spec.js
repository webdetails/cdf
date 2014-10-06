/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(["cdf/Dashboard", "cdf/components/TextInputComponent"],
  function(Dashboard, TextInputComponent) {

  /**
   * ## The Text Input Component
   */
  describe("The Text Input Component #", function() {

    var dashboard = new Dashboard();
    
    dashboard.addParameter("input", "");

    dashboard.init();

    var textInputComponent = new TextInputComponent(dashboard, {
      name: "textInputComponent",
      type: "textInputComponent",
      parameters:[],
      parameter: "input",
      htmlObject: "sampleObject",
      executeAtStart: true,
      postChange: function() {
        alert("you typed: " + this.dashboard.getParameterValue(this.parameter));
      }
    });

    dashboard.addComponent(textInputComponent);

    /**
     * ## The Text Input Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(textInputComponent, 'update').and.callThrough();
      dashboard.update(textInputComponent);
      setTimeout(function() {
        expect(textInputComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
