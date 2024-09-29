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
  'cdf/Dashboard.Clean',
  'cdf/components/DateRangeInputComponent',
  'cdf/lib/jquery'
], function(Dashboard, DateRangeInputComponent, $) {

  /**
   * ## The Date Range Input Component
   */
  describe("The Date Range Input Component #", function() {

    var dashboard;
    var dateRangeInputComponent;

    beforeEach(function () {

      dashboard = new Dashboard();

      dashboard.addParameter("startDate", "2009-01-01");
      dashboard.addParameter("endDate", "2009-03-01");

      dashboard.init();

      dateRangeInputComponent = new DateRangeInputComponent({
        name: "dateRangeInputComponent",
        type: "dateRangeInputComponent",
        htmlObject: "sampleObjectDateRangeInput",
        parameter: ["startDate", "endDate"],
        singleInput: false,
        inputSeparator: "<br />",
        executeAtStart: true,
        tooltip: "Click me to select a date",
        postChange: function(date1, date2) {
          return "You chose from " + date1 + " to " + date2;
        }
      });

      elem = document.createElement("div");
      elem.id = "sampleObjectDateRangeInput";
      document.body.appendChild(elem);

      dashboard.addComponent(dateRangeInputComponent);
    });

    afterEach(function() {
      document.body.removeChild(elem);
      elem = null;
    });



    /**
     * ## The Date Range Input Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(dateRangeInputComponent, 'update').and.callThrough();

      dateRangeInputComponent.placeholder = function() {
        return {
          addClass: function() { return this; },
          html: function() { return this; },
          daterangepicker: function() { return this; },
          focus: function() {}
        };
      };

      // listen to cdf:postExecution event
      dateRangeInputComponent.once("cdf:postExecution", function() {
        expect(dateRangeInputComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(dateRangeInputComponent);
    });
  });
});
