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
  "cdf/components/DateSelectorComponent",
  "cdf/lib/jquery"
], function(Dashboard, DateSelectorComponent, $) {

  /**
   * ## The Date Selector Component
   */
  describe("The Date Selector Component #", function() {

    var dashboard,
        dateSelectorComponent,
        htmlObject = "dateSelectorObj",
        $htmlObject = $('<div />').attr('id', htmlObject);

    beforeEach(function() {
      $('body').html($htmlObject);
      dashboard = new Dashboard();
      dashboard.addParameter("start", "2015-10-30");
      dashboard.addParameter("end", "2015-11-30");
      dashboard.addParameter("precision", "day");
      dashboard.setParameterViewMode("precision", "unused");
      dashboard.addParameter("granularity", "year");
      dashboard.setParameterViewMode("granularity", "unused");

      dateSelectorComponent = new DateSelectorComponent({
        type: "DateSelectorComponent",
        name: "render_dateSelector",
        priority: 5,
        executeAtStart: true,
        htmlObject: htmlObject,
        listeners: ['start', 'end', 'precision'],
        dashboardParameterMap: {
          date: "start"
        },
        componentDefinition: {
          inputFormat: "YYYY-MM-DD"
        }
      });
    });

    afterEach(function() {
      $htmlObject.remove();
    });

    /**
     * ## The Date Selector Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      dashboard.addComponent(dateSelectorComponent);
      dashboard.init();

      spyOn(dateSelectorComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      dateSelectorComponent.once("cdf:postExecution", function() {
        expect(dateSelectorComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(dateSelectorComponent);
    });
  });
});
