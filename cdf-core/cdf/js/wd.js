/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. 
 * 
 */


/**
 * Webdetails namespace
 * @namespace
 */
var wd = wd || {};


/**
 * The logging priority order
 * @const
 * @type Array
 */

wd.loglevels = ['debug', 'info', 'warn', 'error', 'exception'];

/**
 * Defines the threshold level for logging.
 * @member
 */

wd.loglevel = 'debug';

/**
 * 
 * Logging function. Use this to append messages to the console with the appropriate
 * log level. Logging will only occur if the log level is above the defined threshold
 * Should be used instead of console.log
 * @param {string} m - message
 * @param {string} type - Log type: 'info','debug', 'log', 'warn', 'error', 'exception'
 * @see wd.loglevel
 */

wd.log = function (m, type){
    
    type = type || "info";
    if (wd.loglevels.indexOf(type) < wd.loglevels.indexOf(wd.loglevel)) {
        return;
    }
    if (typeof console !== "undefined" ){
        
        if (type && console[type]) {
            console[type]("["+ type +"] WD: " + m);
        }else if (type === 'exception' &&
            !console.exception) {
            console.error("["+ type +"] WD: "  + (m.stack || m));
        }
        else {
            console.log("WD: " + m);
        }
    }
   
}


/**
 * Shortcut to wd.log(m,"warn");
 * @param {string} m - message
 */

wd.warn = function(m){
    return wd.log(m, "warn");
}


/**
 * Shortcut to wd.log(m,"error");
 * @param {string} m - message
 */
wd.error = function(m){
    return wd.log(m, "error");
}


/**
 * Shortcut to wd.log(m,"info");
 * @param {string} m - message
 */
wd.info = function(m){
    return wd.log(m, "info");
}



/**
 * Shortcut to wd.log(m,"debug");
 * @param {string} m - message
 */

wd.debug = function(m){
    return wd.log(m, "debug");
}