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
