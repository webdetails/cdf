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

define(['cdf/Dashboard', 'cdf/components/DateRangeInputComponent'], function(Dashboard, DateRangeInputComponent) {
  /**
   * ## The Date Range Input Component
   */
  describe("The Date Range Input Component #", function() {

    var myDashboard = new Dashboard();

    myDashboard.init();

    //myDashboard.addParameter("startDate", "2009-01-01");
    //myDashboard.addParameter("endDate", "2009-03-01");

    var dateRangeInputComponent = window.DateRangeInputComponent = new DateRangeInputComponent(myDashboard, {
      name: "dateRangeInputComponent",
      type: "dateRangeInputComponent",
      htmlObject: 'dateRangeInputComponent',
      parameter: ["startDate","endDate"],
      singleInput: false,
      inputSeparator: "<br />",
      executeAtStart: true,
      tooltip: "Click me to select a date",
      postChange: function(date1, date2){
        alert("You chose from " + date1 + " to " + date2 );
      }
    });

    myDashboard.addComponent(dateRangeInputComponent);

    /**
     * ## The Date Range Input Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(dateRangeInputComponent, 'update').and.callThrough();
      myDashboard.update(dateRangeInputComponent);
      setTimeout(function(){
        expect(dateRangeInputComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
