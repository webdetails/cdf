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

/*==================================================
 *  Geochrono Extension
 *
 *  This file will load all the Javascript files
 *  necessary to make the extension work.
 *
 *==================================================
 */

(function() {
    var javascriptFiles = [
        "geochrono.js",
        "units.js",
        "ether-painters.js",
        "labellers.js"
    ];
    var cssFiles = [
    ];
    
    var localizedJavascriptFiles = [
        "labellers.js"
    ];
    var localizedCssFiles = [
    ];
    
    // ISO-639 language codes, ISO-3166 country codes (2 characters)
    var supportedLocales = [
        "en"        // English
    ];
    
    try {
        var includeJavascriptFile = function(filename) {
            document.write("<script src='" + Timeline.urlPrefix + "ext/geochrono/scripts/" + filename + "' type='text/javascript'></script>");
        };
        var includeCssFile = function(filename) {
            document.write("<link rel='stylesheet' href='" + Timeline.urlPrefix + "ext/geochrono/styles/" + filename + "' type='text/css'/>");
        }
        
        /*
         *  Include non-localized files
         */
        for (var i = 0; i < javascriptFiles.length; i++) {
            includeJavascriptFile(javascriptFiles[i]);
        }
        for (var i = 0; i < cssFiles.length; i++) {
            includeCssFile(cssFiles[i]);
        }
        
        /*
         *  Include localized files
         */
        var loadLocale = [];
        var tryExactLocale = function(locale) {
            for (var l = 0; l < supportedLocales.length; l++) {
                if (locale == supportedLocales[l]) {
                    loadLocale[locale] = true;
                    return true;
                }
            }
            return false;
        }
        var tryLocale = function(locale) {
            if (tryExactLocale(locale)) {
                return locale;
            }
            
            var dash = locale.indexOf("-");
            if (dash > 0 && tryExactLocale(locale.substr(0, dash))) {
                return locale.substr(0, dash);
            }
            
            return null;
        }
        
        tryLocale(Timeline.serverLocale);
        tryLocale(Timeline.clientLocale);
        
        for (var l = 0; l < supportedLocales.length; l++) {
            var locale = supportedLocales[l];
            if (loadLocale[locale]) {
                for (var i = 0; i < localizedJavascriptFiles.length; i++) {
                    includeJavascriptFile("l10n/" + locale + "/" + localizedJavascriptFiles[i]);
                }
                for (var i = 0; i < localizedCssFiles.length; i++) {
                    includeCssFile("l10n/" + locale + "/" + localizedCssFiles[i]);
                }
            }
        }
    } catch (e) {
        alert(e);
    }
})();
