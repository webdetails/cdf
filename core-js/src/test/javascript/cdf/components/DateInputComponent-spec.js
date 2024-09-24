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
