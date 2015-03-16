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

define(["cdf/Dashboard.Clean", "cdf/components/MonthPickerComponent"],
  function(Dashboard, MonthPickerComponent) {

  /**
   * ## The Month Picker Component
   */
  describe("The Month Picker Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("input", "2009-01-01");

    dashboard.init();

    var d = new Date();
    d.setYear(2006);

    var monthPickerComponent = new MonthPickerComponent(dashboard, {
      name: "monthPickerComponent",
      type: "monthPickerComponent",
      htmlObject: 'monthPickerComponent',
      parameter: "input",
      months: 10,
      size: 1,
      initialDate: d,
      executeAtStart: true,
      tooltip: "Click me to select a month",
      postChange: function(date) {
        alert("You chose: " + date);
      }
    });

    dashboard.addComponent(monthPickerComponent);

    /**
     * ## The Month Picker Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(monthPickerComponent, 'update').and.callThrough();
      dashboard.update(monthPickerComponent);
      setTimeout(function() {
        expect(monthPickerComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
