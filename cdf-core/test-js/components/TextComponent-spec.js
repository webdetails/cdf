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

define(["cdf/Dashboard", "cdf/components/TextComponent"], function(Dashboard, TextComponent) {
  /**
   * ## The Text Component
   */
  describe("The Text Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    var textComponent = window.TextComponent = new TextComponent(myDashboard, {
      name: "textComponent",
      type: "textComponent",
      htmlObject: 'textComponent',
      listeners:[],
      expression: function(){
        return "My text generated in " + new Date()
      },
      executeAtStart: true
    });

    myDashboard.addComponent(textComponent);

    /**
     * ## The Text Component # Update Called
     */
    it("Update Called", function(done){
      spyOn(textComponent, 'update').and.callThrough();
      myDashboard.update(textComponent);
      setTimeout(function(){
        expect(textComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });

    /**
     * ## The Text Component # Calls expression when update is called
     */
    it("Calls expression when update is called", function(done){
      spyOn(textComponent, 'expression');
      myDashboard.update(textComponent);
      setTimeout(function(){
        expect(textComponent.expression).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
