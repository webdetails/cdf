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
  './Dashboard',
  '../Logger',
  '../lib/jquery',
  './Dashboard.storage.ext'
], function(Dashboard, Logger, $, DashboardStorageExt) {

  /**
   * @class cdf.dashboard."Dashboard.storage"
   * @amd cdf/dashboard/Dashboard.storage
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for handling the storage `object`.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for handling the storage `object`.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{
    /**
     * @summary Allows a user to persist parameters server-side to be used across different dashboards.
     * @description <p>The dashboard storage is used for persisting parameters on the server and making them
     *              available to other dashboards. It is sometimes referred to as a user parameter store.</p>
     *              <p>It can be initialized in two different ways. The main way is via
     *              the dashboard constructor. Otherwise, it will be initialized via the
     *              {@link cdf.dashboard.Dashboard|Dashboard} AMD module configuration. If no
     *              configuration is available, it will be initialized as an empty `object`.</p>
     * 
     * @type {Object}
     * @protected
     */
    storage: undefined,

    /**
     * @summary Holds the dashboard {@link cdf.dashboard.Dashboard#storage|storage}
     *          value available during the dashboard initialization.
     * @description Holds the dashboard {@link cdf.dashboard.Dashboard#storage|storage}
     *              value available during the dashboard initialization.
     * 
     * @type {Object}
     * @protected
     */
    initialStorage: undefined,

    /**
     * @description <p>Method used by the {@link cdf.dashboard.Dashboard|Dashboard} constructor
     *              for initializing the {@link cdf.dashboard.Dashboard#storage|storage} and
     *              {@link cdf.dashboard.Dashboard#initialStorage|initialStorage}.</p>
     *              <p>If the context hasn't been initialized, its value will be read from
     *              {@link cdf.dashboard.Dashboard#storageObj|storageObj}.</p>
     * @summary Method used by the {@link cdf.dashboard.Dashboard|Dashboard} constructor
     *          to initialize the {@link cdf.dashboard.Dashboard#storage|storage} and
     *          {@link cdf.dashboard.Dashboard#initialStorage|initialStorage}.
     *
     * @private
     * @see {@link cdf.dashboard.Dashboard#storageObj|storageObj}
     */
    _initStorage: function() {
      if(!this.storage) {
        this.storage = {};
        $.extend(this.storage, this.storageObj);
      }
      this.initialStorage = this.storage;
    },

    /**
     * @summary Clears resources associated with the dashboard storage.
     * @description  Dispose resources that the dashboard storage may have, and that are no longer needed.
     *
     * @protected
     */
    _disposeStorage: function() {
      this.storage = {};
      this.initialStorage = {};
    },

    /**
     * @description Retrieves the {@link cdf.dashboard.Dashboard#storage|storage} value from the server using a
     *              {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} request and saves
     *              it in the dashboard {@link cdf.dashboard.Dashboard#storage|storage} property.
     * @summary Loads the {@link cdf.dashboard.Dashboard#storage|storage} value from the server.
     */
    loadStorage: function() {
      var myself = this;
      // Don't do anything for anonymousUser.
      if(this.context && this.context.user === "anonymousUser") {
        return;
      }

      var args = {
        user: this.context.user,
        action: "read",
        ts: Date.now ? Date.now() : new Date().getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
      };

      $.ajax({
        type: 'GET',
        dataType: "json",
        url: DashboardStorageExt.getStorage(args.action),
        data: args,
        async: true,
        xhrFields: {
          withCredentials: true
        },
        success: function(json) {
          $.extend(myself.storage, json);
        }
      });
    },

    /**
     * @description Saves the {@link cdf.dashboard.Dashboard#storage|storage} value in the server
     *              using a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} request.
     * @summary Saves the {@link cdf.dashboard.Dashboard#storage|storage} value in the server.
     */
    saveStorage: function() {
      // Don't do anything for anonymousUser
      if(this.context && this.context.user === "anonymousUser") {
        return;
      }

      var args = {
        user: this.context.user,
        action: "store",
        storageValue: JSON.stringify(this.storage),
        ts: Date.now ? Date.now() : new Date().getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
      };

      $.ajax({
        type: 'GET',
        dataType: "json",
        url: DashboardStorageExt.getStorage(args.action),
        data: args,
        async: true,
        xhrFields: {
          withCredentials: true
        }
      }).done(function(json) {
        if(json.result != true) {
          Logger.log("Error saving storage", 'error');
        }
      });
    },

    /**
     * @description Resets the {@link cdf.dashboard.Dashboard#storage|storage} value to an empty `object`
     *              and deletes the value stored in the server.
     * @summary Resets the {@link cdf.dashboard.Dashboard#storage|storage} value to an empty `object`
     *          and issues a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} request to
     *          delete the value stored in the server.
     */
    cleanStorage: function() {
      this.storage = {};

      // Don't do noting for anonymousUser
      if(this.context && this.context.user === "anonymousUser") {
        return;
      }

      var args = {
        user: this.context.user,
        action: "delete"
      };

      $.ajax({
        type: 'GET',
        dataType: "json",
        url: DashboardStorageExt.getStorage(args.action),
        data: args,
        async: true,
        xhrFields: {
          withCredentials: true
        }
      }).done(function(json) {
        if(json.result != true) {
          Logger.log("Error deleting storage", 'error');
        }
      });
    }
  });
});
