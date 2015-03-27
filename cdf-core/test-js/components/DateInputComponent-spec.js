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

define(['cdf/Dashboard.Clean', 'cdf/lib/jquery', 'cdf/components/DateInputComponent'],
  function(Dashboard, $, DateInputComponent) {

  /**
   * ## The Date Input Component
   */
  describe("The Date Input Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter('dateInputTestParameter', "2009-01-01");

    dashboard.init();

    var onOpen = false;
    var onClose = false;

    var dateInputComponent = new DateInputComponent({
      name: "dateInputComponent",
      type: "dateInputComponent",
      htmlObject: 'dateInputComponent',
      parameter: "dateInputTestParameter",
      dateFormat: "yy-mm-dd",
      startDate: "2006-05-31",
      endDate: "TODAY",
      onOpenEvent: function() { onOpen = true; },
      onCloseEvent: function() { onClose = true; },
      executeAtStart: true
    });

    dashboard.addComponent(dateInputComponent);

    /**
     * ## The Date Input Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(dateInputComponent, 'update').and.callThrough();
      dashboard.update(dateInputComponent);
      setTimeout(function() {
        expect(dateInputComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });

    /**
     * ## The Date Input Component # Trigger onOpenEvent and onCloseEvent called
     */
    it("Trigger onOpenEvent and onCloseEvent called", function(done) {
      spyOn(dateInputComponent, 'update').and.callThrough();
      dashboard.update(dateInputComponent);
      dateInputComponent.triggerOnOpen();
      dateInputComponent.triggerOnClose();

      setTimeout(function() {
        expect(dateInputComponent.update).toHaveBeenCalled();
        expect(onOpen).toBeTruthy();
        expect(onClose).toBeTruthy();
        done();
      }, 100);
    });
  });
});
