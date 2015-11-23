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
 *  Default Unit
 *==================================================
 */

SimileAjax.NativeDateUnit = new Object();

SimileAjax.NativeDateUnit.makeDefaultValue = function() {
    return new Date();
};

SimileAjax.NativeDateUnit.cloneValue = function(v) {
    return new Date(v.getTime());
};

SimileAjax.NativeDateUnit.getParser = function(format) {
    if (typeof format == "string") {
        format = format.toLowerCase();
    }
    return (format == "iso8601" || format == "iso 8601") ?
        SimileAjax.DateTime.parseIso8601DateTime : 
        SimileAjax.DateTime.parseGregorianDateTime;
};

SimileAjax.NativeDateUnit.parseFromObject = function(o) {
    return SimileAjax.DateTime.parseGregorianDateTime(o);
};

SimileAjax.NativeDateUnit.toNumber = function(v) {
    return v.getTime();
};

SimileAjax.NativeDateUnit.fromNumber = function(n) {
    return new Date(n);
};

SimileAjax.NativeDateUnit.compare = function(v1, v2) {
    var n1, n2;
    if (typeof v1 == "object") {
        n1 = v1.getTime();
    } else {
        n1 = Number(v1);
    }
    if (typeof v2 == "object") {
        n2 = v2.getTime();
    } else {
        n2 = Number(v2);
    }
    
    return n1 - n2;
};

SimileAjax.NativeDateUnit.earlier = function(v1, v2) {
    return SimileAjax.NativeDateUnit.compare(v1, v2) < 0 ? v1 : v2;
};

SimileAjax.NativeDateUnit.later = function(v1, v2) {
    return SimileAjax.NativeDateUnit.compare(v1, v2) > 0 ? v1 : v2;
};

SimileAjax.NativeDateUnit.change = function(v, n) {
    return new Date(v.getTime() + n);
};

