/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
   * @class cdf.dashboard.Dashboard.notifications
   * @amd cdf/dashboard/Dashboard.notifications
   * @classdesc A class representing an extension to the Dashboard class for notifications.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * Inits the notification.
     *
     * @private
     */
    _initNotifications: function() {

      /**
       * Property with the registered error codes. By default, the QUERY_TIMEOUT and COMPONENT_ERROR code
       * are registered and assigned a specific error message.
       *
       * @type {Object}
       * @name cdf.dashboard.Dashboard#ERROR_CODES
       */
      this.ERROR_CODES = {
        'QUERY_TIMEOUT': {
          msg: "Query timeout reached"
        },
        "COMPONENT_ERROR": {
          msg: "Error processing component"
        }
      };
    },

    /**
     * Sets additional {@link http://malsup.com/jquery/block/|jQuery.blockUI} options based on the defaults already set.
     *
     * @param {Object}  options             The options to configure.
     * @param {string}  options.message     The message or HTML to display in the UI overlay.
     * @param {Object}  options.css         A json that accepts valid css key/value pairs.
     * @param {Object}  options.overlayCSS  A json that accepts valid css key/value pairs for the UI overlay.
     * @param {boolean} options.showOverlay Allows you to show or hide the UI overlay.
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
     * Renders a blocking div that can be dragged.
     */
    blockUIwithDrag: function() {
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
     * Makes visible the progress indicator. By default, this is a draggable blocking div that shows a spinner.
     */
    showProgressIndicator: function() {
      $.blockUI && this.blockUIwithDrag();
    },

    /**
     * Hides the progress indicator. Optionally, resets the running calls counter.
     *
     * @param {boolean} force _true_ if the running calls counter should be reset, _false_ otherwise
     */
    hideProgressIndicator: function(force) {
      if(force) {
        this.resetRunningCalls();
      }
      $.unblockUI && $.unblockUI();
      this.showErrorTooltip();// Dashboard.legacy
    },

    /**
     * Given an error code, returns the registered error object associated with that code.
     *
     * @param {string} errorCode The error code.
     * @return {{msg: string}} error An object with a _msg_ property containing the error code message or
     *                               an empty object if the code is not registered.
     */
    getErrorObj: function(errorCode) {
      return this.ERROR_CODES[errorCode] || {};
    },

    /**
     * Parses a server error response and creates an error object.
     *
     * @private
     * @param {string} resp      Server response.
     * @param {string} txtStatus Response status.
     * @param {string} error     Error object to encapsulate.
     * @return {{msg: string, error: string, errorStatus: string}} An error object containing detailed error messages.
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
     * Handles a server error.
     */
    handleServerError: function() {
      this.errorNotification(this.parseServerError.apply(this, arguments));
      this.trigger('cdf cdf:serverError', this);
      this.resetRunningCalls();
    },

    /**
     * Displays an error notification.
     *
     * @param {Object} err An object containing a _msg_ property with the error message to display.
     * @param {*} [ph] A reference to the HTML element where to attach the error message.
     */
    errorNotification: function(err, ph) {
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
     * Default implementation for the login alert that pops up when we detect the user is no longer logged in.
     *
     * @param {Object} newOpts Options for the login popup.
     */
    loginAlert: function(newOpts) {
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
     * Check if we're able to connect to the server correctly, using post to avoid cache.
     *
     * @return {boolean} _true_ if able to connect, _false_ otherwise.
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
