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
