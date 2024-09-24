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
