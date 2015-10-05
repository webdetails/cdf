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
  'cdf/Dashboard.Clean',
  'cdf/lib/jquery',
  'cdf/components/DateInputComponent'
], function(Dashboard, $, DateInputComponent) {

  /**
   * ## The Date Input Component
   */
  describe("The Date Input Component #", function() {

    var dashboard = new Dashboard();

    dashboard.addParameter("dateInputTestParameter", "2009-01-01");

    dashboard.init();

    var onOpen = false;
    var onClose = false;

    var dateInputComponent = new DateInputComponent({
      name: "dateInputComponent",
      type: "dateInputComponent",
      htmlObject: "sampleObjectDateInput",
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
     * ## The Date Input Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(dateInputComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      dateInputComponent.once("cdf:postExecution", function() {
        expect(dateInputComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(dateInputComponent);
    });

    /**
     * ## The Date Input Component # triggers onOpen:dateInput event
     */
    it("Trigger onOpenEvent and onCloseEvent called", function(done) {
      // listen to onOpen:dateInput event
      dateInputComponent.once("onOpen:dateInput", function() {
        expect(onOpen).toBeTruthy();
        done();
      });

      dateInputComponent.triggerOnOpen();
    });

    /**
     * ## The Date Input Component # triggers onClose:dateInput event
     */
    it("Trigger onOpenEvent and onCloseEvent called", function(done) {
      // listen to onClose:dateInput event
      dateInputComponent.once("onClose:dateInput", function() {
        expect(onClose).toBeTruthy();
        done();
      });

      dateInputComponent.triggerOnClose();
    });
  });
});
