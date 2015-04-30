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
 *  String Utility Functions and Constants
 *==================================================
 */

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.startsWith = function(prefix) {
    return this.length >= prefix.length && this.substr(0, prefix.length) == prefix;
};

String.prototype.endsWith = function(suffix) {
    return this.length >= suffix.length && this.substr(this.length - suffix.length) == suffix;
};

String.substitute = function(s, objects) {
    var result = "";
    var start = 0;
    while (start < s.length - 1) {
        var percent = s.indexOf("%", start);
        if (percent < 0 || percent == s.length - 1) {
            break;
        } else if (percent > start && s.charAt(percent - 1) == "\\") {
            result += s.substring(start, percent - 1) + "%";
            start = percent + 1;
        } else {
            var n = parseInt(s.charAt(percent + 1));
            if (isNaN(n) || n >= objects.length) {
                result += s.substring(start, percent + 2);
            } else {
                result += s.substring(start, percent) + objects[n].toString();
            }
            start = percent + 2;
        }
    }
    
    if (start < s.length) {
        result += s.substring(start);
    }
    return result;
};
