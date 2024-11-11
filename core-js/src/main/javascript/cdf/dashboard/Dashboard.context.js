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
