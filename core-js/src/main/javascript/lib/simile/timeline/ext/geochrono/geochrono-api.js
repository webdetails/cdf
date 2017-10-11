/*
 *  (c) Copyright The SIMILE Project 2006. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Note: JQuery, www.jquery.com is included in the Ajax section of this
 *       distribution. It is covered by its own license:
 *
 *       Copyright (c) 2008 John Resig (jquery.com)
 *       Dual licensed under the MIT (MIT-LICENSE.txt)
 *       and GPL (GPL-LICENSE.txt) licenses.
 */

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
