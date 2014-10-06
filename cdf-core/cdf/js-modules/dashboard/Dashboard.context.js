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


define(['../lib/jquery', './Dashboard', './Dashboard.ext', './Dashboard.context.ext'],
  function($, Dashboard, DashboardExt, DashboardContextExt) {
  
  /**
   * A module representing a extension to Dashboard module for i18n.
   * @module Dashboard.i18n
   */
  Dashboard.implement({
    /**
     * Method used by the Dashboard constructor for context initialization
     *
     * @private
     */
    _initContext: function() {
      var myself = this;
      this.context = {};

      var args = {
        user: SESSION_NAME,
        path: DashboardExt.getFilePathFromUrl(),
        ts: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
      };

      $.getJSON(DashboardContextExt.getContext(), args, function(json) {
        $.extend(myself.context,json);
      });

    }
  });
});