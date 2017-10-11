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
  '../lib/jquery',
  './Dashboard',
  './Dashboard.ext',
  './Dashboard.context.ext'
], function($, Dashboard, DashboardExt, DashboardContextExt) {

  /**
   * @class cdf.dashboard."Dashboard.context"
   * @amd cdf/dashboard/Dashboard.context
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for handling the context `object`.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for handling the context `object`.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{
    /**
     * @summary The dashboard context `object` used for holding user and server session data.
     * @description <p>The dashboard context is used for holding user and server session
     *              information, such as the current locale and session timeout settings.</p>
     *              <p>It can be initialized in two different ways. The main way is via
     *              the dashboard constructor. If not, it will be initialized via the
     *              {@link cdf.dashboard.Dashboard|Dashboard} AMD module configuration. If no context
     *              configuration is available, it will be initialized as an empty `object`.</p>
     * 
     * @type {Object}
     * @protected
     */
    context: undefined,

    /**
     * @description Method used by the {@link cdf.dashboard.Dashboard|Dashboard} constructor for
     *              initializing the context `object`. If the context hasn't been initialized,
     *              its value will be read from {@link cdf.dashboard.Dashboard#contextObj|contextObj}.
     * @summary Method used by the {@link cdf.dashboard.Dashboard|Dashboard} constructor to initialize
     *          the context `object`.
     *
     * @private
     * @see {@link cdf.dashboard.Dashboard#contextObj|contextObj}
     */
    _initContext: function() {
      if(!this.context) {
        this.context = {};
        $.extend(this.context, this.contextObj);
      }
    }
  });
});
