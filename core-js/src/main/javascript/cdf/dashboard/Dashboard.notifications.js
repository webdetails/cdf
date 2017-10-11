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
  './Dashboard',
  './Dashboard.notifications.ext',
  './Popups',
  '../Logger',
  'amd!../lib/underscore',
  '../lib/jquery',
  'amd!../lib/jquery.blockUI',
  'css!./Dashboard.notifications.css'
], function(Dashboard, DashboardNotificationsExt, Popups, Logger, _, $) {

  /**
   * @class cdf.dashboard."Dashboard.notifications"
   * @amd cdf/dashboard/Dashboard.notifications
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for notifications.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for notifications.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @summary Dashboard error codes.
     * @description Contains the default dashboard error codes.
     *
     * @type {Object}
     * @property {string} QUERY_TIMEOUT="Query timeout reached" - Query timeout error message.
     * @property {string} COMPONENT_ERROR="Error processing component" - Error processing component error message.
     * @constant
     * @protected
     */
    ERROR_CODES: {
      "QUERY_TIMEOUT": {msg: "Query timeout reached"},
      "COMPONENT_ERROR": {msg: "Error processing component"}
    },

    /**
     * @summary Initializes the dashboard notifications.
     * @description Initializes the dashboard notifications.
     *
     * @private
     */
    _initNotifications: function() {},

    /**
     * @summary Holds the dashboard {@link http://malsup.com/jquery/block/|jQuery.blockUI} options.
     * @description Holds the dashboard {@link http://malsup.com/jquery/block/|jQuery.blockUI} options.
     *
     * @type {Object}
     * @protected
     */
    blockUiOptions: undefined,

    /**
     * @summary Stores the {@link http://malsup.com/jquery/block/|jQuery.blockUI} options in
     *          {@link cdf.dashboard.Dashboard#blockUiOptions|blockUiOptions}.
     * @description Sets the {@link http://malsup.com/jquery/block/|jQuery.blockUI} options.
     *              It stores the default {@link http://malsup.com/jquery/block/|jQuery.blockUI}
     *              options in {@link cdf.dashboard.Dashboard#blockUiOptions|blockUiOptions} and
     *              the options provided through the `options` parameter, the latter have priority
     *              over the default options.
     *
     * @param {Object}  [options]             The options to configure {@link http://malsup.com/jquery/block/|jQuery.blockUI}.
     * @param {string}  [options.message]     The message or HTML to display in the UI overlay.
     * @param {Object}  [options.css]         A json that accepts valid css key/value pairs.
     * @param {Object}  [options.overlayCSS]  A json that accepts valid css key/value pairs for the UI overlay.
     * @param {boolean} [options.showOverlay] Allows you to show or hide the UI overlay.
     * @private
     * @see {@link http://malsup.com/jquery/block/|jQuery.blockUI}
     */
    _setBlockUiOptions: function(options) {
      if(typeof $.blockUI == 'function') {
        this.blockUiOptions = $.extend({}, $.blockUI.defaults); // Clone block ui defaults

        for (var key in options) {
          this.blockUiOptions[key] = options[key];
        }
      }
    },

    /**
     * @summary Renders a blocking div which can be dragged.
     * @description Renders a blocking div which can be dragged.
     */
    blockUIwithDrag: function() {
      if(this.isSilent) {
        return;
      }
      if(typeof this.i18nSupport !== "undefined" && this.i18nSupport != null) {
        // If i18n support is enabled process the message accordingly
        // but we're just setting the same img
        $.blockUI.defaults.message = '<div class="img blockUIDefaultImg" style="padding: 0px;"></div>';
      }

      $.blockUI(this.blockUiOptions);
      var handle = $('<div id="blockUIDragHandle"></div>');
      $("div.blockUI.blockMsg").prepend(handle);
      $("div.blockUI.blockMsg").draggable({
        handle: "#blockUIDragHandle"
      });
    },

    /**
     * @summary Makes the progress indicator visible if the dashboard is not in silent mode.
     * @description Makes the progress indicator visible if the dashboard is not in silent mode.
     *              By default this is a draggable blocking div which shows a spinner.
     */
    showProgressIndicator: function() {
      if(this.isSilent) {
        return;
      }
      $.blockUI && this.blockUIwithDrag();
    },

    /**
     * @summary Hides the progress indicator if the dashboard is not in silent mode.
     * @description Hides the progress indicator if the dashboard is not in silent mode.
     *              Optionally, resets the running calls counter.
     *
     * @param {boolean} force `true` if the running calls counter should be reset, `false` otherwise
     */
    hideProgressIndicator: function(force) {
      if(this.isSilent) {
        return;
      }
      if(force) {
        this.resetRunningCalls();
      }
      $.unblockUI && $.unblockUI();
      this.showErrorTooltip();// Dashboard.legacy
    },

    /**
     * @summary Gets an error code message.
     * @description Given an error code, returns the registered error object associated with that code.
     *
     * @param {string} errorCode The error code.
     * @return {{msg: string}} An object with a `msg` property containing the error code message or
     *                               an empty object if the code is not registered.
     */
    getErrorObj: function(errorCode) {
      return this.ERROR_CODES[errorCode] || {};
    },

    /**
     * @summary Parses a server error response and creates an error object.
     * @description Parses a server error response and creates an error object.
     *
     * @private
     * @param {string} resp      Server response.
     * @param {string} txtStatus Response status.
     * @param {string} error     Error object to encapsulate.
     * @return {{msg: string, error: string, errorStatus: string}} An error `object` containing detailed error messages.
     *
     * @deprecated
     */
    parseServerError: function(resp, txtStatus, error) {
      // NOTE: this method's signature matches the error callback of $.ajax({error: . }).
      var regexs = [
        {match: /Query timeout/, msg: this.getErrorObj('QUERY_TIMEOUT').msg}
      ];

      var out = {
        msg: this.getErrorObj('COMPONENT_ERROR').msg,
        error: error,
        errorStatus: txtStatus
      };

      var str = $('<div/>').html(resp.responseText).find('h1').text();
      _.find(regexs, function(el) {
        if(str.match(el.match)) {
          out.msg = el.msg;
          return true;
        }
        return false;
      });

      return out;
    },

    /**
     * @summary Handles a server error.
     * @description Handles a server error.
     *
     * @fires cdf.event:cdf
     * @fires cdf.dashboard.Dashboard#event:"cdf:serverError"
     */
    handleServerError: function() {
      this.errorNotification(this.parseServerError.apply(this, arguments));
      this.trigger('cdf cdf:serverError', this);
      this.resetRunningCalls();
    },

    /**
     * @summary Displays an error notification if the dashboard is not in silent mode.
     * @description Displays an error notification if the dashboard is not in silent mode.
     *
     * @param {Object} err An object containing a `msg` property with the error message to display.
     * @param {Object} [ph] A reference to the HTML element to attach the error message.
     */
    errorNotification: function(err, ph) {
      if(this.isSilent) {
        return;
      }
      if(ph) {
        Popups.notificationsComponent.render($(ph), {title: err.msg, desc: ""});
      } else {
        Popups.notificationsGrowl.render({
          title: err.msg,
          desc: ''
        });
      }
    },

    /**
     * @summary Shows a login error notification if the dashboard is not in silent mode.
     * @description Shows a login error notification if the dashboard is not in silent mode.
     *              Provides a default implementation for the login alert which pops up when the login session expires.
     *
     * @param {Object} newOpts Options for the login pop-up.
     * @fires cdf.event:cdf
     * @fires cdf.dashboard.Dashboard#event:"cdf:loginError"
     */
    loginAlert: function(newOpts) {
      if(this.isSilent) {
        return;
      }
      var opts = {
        header: "Warning",
        desc: "You are no longer logged in or the connection to the server timed out",
        button: "Click to reload this page",
        callback: function() {
          window.location.reload(true);
        }
      };
      opts = _.extend({}, opts, newOpts);

      Popups.okPopup.show(opts);
      this.trigger('cdf cdf:loginError', this);
    },

    /**
     * @summary Executes a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax}
     *          to test the connection to the server.
     * @description Executes a {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax}
     *              to test the connection to the server. Uses HTTP POST to avoid cache.
     *
     * @return {boolean} `true` if able to connect, `false` otherwise.
     */
    checkServer: function() {
      $.ajax({
        type: 'POST',
        async: false,
        dataType: 'json',
        url: DashboardNotificationsExt.getPing(),
        success: function(result) {
          return result && result.ping == 'ok';
        },
        error: function() {
          return false;
        }
      });
    }
  });
});
