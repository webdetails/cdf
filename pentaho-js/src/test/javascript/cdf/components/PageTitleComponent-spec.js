/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  "cdf/components/PageTitleComponent"
], function(Dashboard, PageTitleComponent) {

  /**
   * ## The Page Title Component
   */
  describe("The Pentaho Reporting Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var pageTitleComponent = new PageTitleComponent({
      name: "pageTitle",
      type: "pageTitle",
      listeners: [],
      htmlObject: "sampleObjectPageTitle",
      executeAtStart: true
    });

    dashboard.addComponent(pageTitleComponent);

    /**
     * ## The Page Title Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(pageTitleComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      pageTitleComponent.once("cdf:postExecution", function() {
        expect(pageTitleComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(pageTitleComponent);
    });
  });
});
