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

define(function() {

  /**
   * @class cdf.Logger
   * @amd cdf/Logger
   * @summary Allows logging messages in the console.
   * @classdesc This is a static class used for logging messages in the console.
   * @staticClass
   */
  return /** @lends cdf.Logger */ {
    /**
     * @summary The different log levels supported.
     * @description The different log levels supported.
     *              This array is ordered from the most verbose level to the less verbose.
     *
     * @type {string[]}
     * @const
     * @readonly
     * @private
     * @default
     */
    loglevels: ['debug', 'log', 'info', 'warn', 'error', 'exception'],

    /**
     * @summary The current log level.
     * @description The current log level.
     *
     * @type {string}
     * @default "debug"
     */
    loglevel: 'debug',

    /**
     * @summary Logs a message to the console.
     * @description Logs a message to the console using the specified `type` log level if it is allowed by the current log level.
     *
     * @param {string|{stack: string}} m             Message to log or an `object` containing information about an exception.
     * @param {string}                 [type="info"] The log level, one of the registered log {@link cdf.Logger.loglevels|levels}.
     * @param {string}                 [css]         CSS styling rules for the message.
     */
    log: function(m, type, css) {    
      type = type || "info";
      if(this.loglevels.indexOf(type) < this.loglevels.indexOf(this.loglevel)) {
        return;
      }
      if(typeof console !== "undefined") {

        if(!console[type]) {
          if(type === 'exception') {
            type = "error";
            m = m.stack || m;
          } else {
            type = "log";
          }
        }
        if(css) {
          try {
            console[type]("%c[" + type + "] WD: " + m, css);
            return;
          } catch(e) {
            // styling is not supported
          }
        }
        console[type]("[" + type + "] WD: " + m);
      }
    },

    /**
     * @summary Logs a message at {@link cdf.Logger.loglevels|debug} level.
     * @description Logs a message at {@link cdf.Logger.loglevels|debug} level.
     *
     * @param {string} m Message to log.
     */
    debug: function(m) {
      return this.log(m, "debug");
    },

    /**
     * @summary Logs a message at {@link cdf.Logger.loglevels|info} level.
     * @description Logs a message at {@link cdf.Logger.loglevels|info} level.
     *
     * @param {string} m Message to log.
     */
    info: function(m) {
      return this.log(m, "info");
    },

    /**
     * @summary Logs a message at {@link cdf.Logger.loglevels|warn} level.
     * @description Logs a message at {@link cdf.Logger.loglevels|warn} level.
     *
     * @param {string} m Message to log.
     */
    warn: function(m) {
      return this.log(m, "warn");
    },

    /**
     * @summary Logs a message at {@link cdf.Logger.loglevels|error} level.
     * @description Logs a message at {@link cdf.Logger.loglevels|error} level.
     *
     * @param {string} m Message to log.
     */
    error: function(m) {
      return this.log(m, "error");
    },

    /**
     * @summary Logs a message at {@link cdf.Logger.loglevels|exception} level.
     * @description Logs a message at {@link cdf.Logger.loglevels|exception} level.
     *
     * @param {string|{stack: string}} m  Message to log or an `object` containing information about the exception to log.
     */
    exception: function(m) {
      return this.log(m, "exception");
    }                       
  };

});
