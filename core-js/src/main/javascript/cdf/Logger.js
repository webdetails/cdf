/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

/**
 * @class cdf.Logger
 * @amd cdf/Logger
 * @classdesc This is a static class used for logging messages in the console.
 * @static
 */
define(function() {

  return /** @lends cdf.Logger */ {
    /**
     * The different log levels supported.
     *
     * @type {string[]}
     * @default
     */
    loglevels: ['debug', 'log', 'info', 'warn', 'error', 'exception'],
    /**
     * Current log level. Assign a new value to this property to change the log level.
     *
     * @type {string}
     * @default
     */
    loglevel: 'debug',

    /**
     * Logs a message at the specified log level.
     *
     * @param {string|object} m           Message to log or an object containing information about an exception to log.
     * @param {string}        [m.stack]   Stack trace of the exception to log.
     * @param {string}        [type=info] Log level. One of debug, info, warn, error or exception.
     * @param {string}        [css]       CSS styling rules for the message to log.
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
     * Logs a message at debug level.
     * It calls the {@link cdf.Logger#log|log} method with the {@link cdf.Logger#loglevel|log level} debug.
     *
     * @param {string} m Message to log.
     */
    debug: function(m) {
      return this.log(m, "debug");
    },

    /**
     * Logs a message at info level.
     *
     * @param {string} m Message to log.
     */
    info: function(m) {
      return this.log(m, "info");
    },

    /**
     * Logs a message at warn level.
     *
     * @param {string} m Message to log.
     */
    warn: function(m) {
      return this.log(m, "warn");
    },

    /**
     * Logs a message at error level.
     *
     * @param {string} m Message to log.
     */
    error: function(m) {
      return this.log(m, "error");
    },

    /**
     * Logs a message at exception level.
     *
     * @param {string|object} m         Message to log or an object containing information about the exception to log.
     * @param {string} [m.stack] Stack trace of the exception to log.
     */
    exception: function(m) {
      return this.log(m, "exception");
    }                       
  };

});
