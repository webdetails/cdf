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
  "cdf/components/ContentListComponent"
], function(Dashboard, ContentListComponent) {

  /**
   * ## The Content List Component
   */
  describe("The Content List Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var contentListComponent = new ContentListComponent({
      name: "folderContentComponent",
      type: "contentList",
      listeners: [],
      htmlObject: "sampleObjectContentList",
      executeAtStart: true,
      mode: "3"
    });

    dashboard.addComponent(contentListComponent);

    /**
     * ## The Content List Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(contentListComponent, 'update').and.callThrough();

      // listen to cdf:postExecution event
      contentListComponent.once("cdf:postExecution", function() {
        expect(contentListComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(contentListComponent);
    });
  });
});
