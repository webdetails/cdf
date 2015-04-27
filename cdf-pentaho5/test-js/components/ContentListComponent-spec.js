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

define(["cdf/Dashboard.Clean", "cdf/components/ContentListComponent"],
  function(Dashboard, ContentListComponent) {

  /**
   * ## The Content List Component
   */
  describe("The Content List Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var contentListComponent = new ContentListComponent({
      name: "folderContentComponent",
      type: "contentList",
      listeners:[],
      htmlObject: "sampleObject",
      executeAtStart: true,
      mode: "3"
    });

    dashboard.addComponent(contentListComponent);

    /**
     * ## The Content List Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(contentListComponent, 'update').and.callThrough();
      dashboard.update(contentListComponent);
      setTimeout(function() {
        expect(contentListComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
