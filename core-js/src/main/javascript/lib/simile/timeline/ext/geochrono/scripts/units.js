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
 *  Geochrono Unit
 *==================================================
 */

Timeline.GeochronoUnit = new Object();

Timeline.GeochronoUnit.MA     = 0;
Timeline.GeochronoUnit.AGE    = 1;
Timeline.GeochronoUnit.EPOCH  = 2;
Timeline.GeochronoUnit.PERIOD = 3;
Timeline.GeochronoUnit.ERA    = 4;
Timeline.GeochronoUnit.EON    = 5;

Timeline.GeochronoUnit.getParser = function(format) {
    return Timeline.GeochronoUnit.parseFromObject;
};

Timeline.GeochronoUnit.createLabeller = function(locale, timeZone) {
    return new Timeline.GeochronoLabeller(locale);
};

Timeline.GeochronoUnit.wrapMA = function (n) {
    return new Timeline.GeochronoUnit._MA(n);
};

Timeline.GeochronoUnit.makeDefaultValue = function () {
    return Timeline.GeochronoUnit.wrapMA(0);
};

Timeline.GeochronoUnit.cloneValue = function (v) {
    return new Timeline.GeochronoUnit._MA(v._n);
};

Timeline.GeochronoUnit.parseFromObject = function(o) {
    if (o instanceof Timeline.GeochronoUnit._MA) {
        return o;
    } else if (typeof o == "number") {
        return Timeline.GeochronoUnit.wrapMA(o);
    } else if (typeof o == "string" && o.length > 0) {
        return Timeline.GeochronoUnit.wrapMA(Number(o));
    } else {
        return null;
    }
};

Timeline.GeochronoUnit.toNumber = function(v) {
    return v._n;
};

Timeline.GeochronoUnit.fromNumber = function(n) {
    return new Timeline.GeochronoUnit._MA(n);
};

Timeline.GeochronoUnit.compare = function(v1, v2) {
    var n1, n2;
    if (typeof v1 == "object") {
        n1 = v1._n;
    } else {
        n1 = Number(v1);
    }
    if (typeof v2 == "object") {
        n2 = v2._n;
    } else {
        n2 = Number(v2);
    }
    
    return n2 - n1;
};

Timeline.GeochronoUnit.earlier = function(v1, v2) {
    return Timeline.GeochronoUnit.compare(v1, v2) < 0 ? v1 : v2;
};

Timeline.GeochronoUnit.later = function(v1, v2) {
    return Timeline.GeochronoUnit.compare(v1, v2) > 0 ? v1 : v2;
};

Timeline.GeochronoUnit.change = function(v, n) {
    return new Timeline.GeochronoUnit._MA(v._n - n);
};

Timeline.GeochronoUnit._MA = function(n) {
    this._n = n;
};

