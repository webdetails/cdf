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

define(function () {

    var logger = {
        loglevels: ['debug', 'info', 'warn', 'error', 'exception'],
        loglevel: 'debug',
        log: function (m, type){    
                type = type || "info";
                if (this.loglevels.indexOf(type) < this.loglevels.indexOf(this.loglevel)) {
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
            },
        debug: function(m){
                return this.log(m, "debug");
            },
        info: function(m){
                return this.log(m, "info");
            },
        warn: function(m){
                return this.log(m, "warn");
            },
        error: function(m){
                return this.log(m, "error");
            },
        exception: function(m){
                return this.log(m, "exception");
            }                       
    };
    
    
    return logger;

});