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
  "cdf/components/MonthPickerComponent"
], function(Dashboard, MonthPickerComponent) {

  /**
   * ## The Month Picker Component
   */
  describe("The Month Picker Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("input", "2009-01-01");

    dashboard.init();

    var d = new Date();
    d.setYear(2006);

    var monthPickerComponent = new MonthPickerComponent({
      name: "monthPickerComponent",
      type: "monthPickerComponent",
      htmlObject: "sampleObjectMonthPicker",
      parameter: "input",
      months: 10,
      size: 1,
      initialDate: d,
      executeAtStart: true,
      tooltip: "Click me to select a month",
      postChange: function(date) { return "You chose: " + date; }
    });

    dashboard.addComponent(monthPickerComponent);

    /**
     * ## The Month Picker Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(monthPickerComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      monthPickerComponent.once("cdf:postExecution", function() {
        expect(monthPickerComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(monthPickerComponent);
    });
  });
});
