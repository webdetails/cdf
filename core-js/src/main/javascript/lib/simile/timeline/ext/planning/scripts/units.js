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
 *  Planning Unit
 *==================================================
 */

Timeline.PlanningUnit = new Object();

Timeline.PlanningUnit.DAY     = 0;
Timeline.PlanningUnit.WEEK    = 1;
Timeline.PlanningUnit.MONTH   = 2;
Timeline.PlanningUnit.QUARTER = 3;
Timeline.PlanningUnit.YEAR    = 4;

Timeline.PlanningUnit.getParser = function(format) {
    return Timeline.PlanningUnit.parseFromObject;
};

Timeline.PlanningUnit.createLabeller = function(locale, timeZone) {
    return new Timeline.PlanningLabeller(locale);
};

Timeline.PlanningUnit.makeDefaultValue = function () {
    return 0;
};

Timeline.PlanningUnit.cloneValue = function (v) {
    return v;
};

Timeline.PlanningUnit.parseFromObject = function(o) {
    if (o == null) {
        return null;
    } else if (typeof o == "number") {
        return o;
    } else {
        try {
            return parseInt(o);
        } catch (e) {
            return null;
        }
    }
};

Timeline.PlanningUnit.toNumber = function(v) {
    return v
};

Timeline.PlanningUnit.fromNumber = function(n) {
    return n;
};

Timeline.PlanningUnit.compare = function(v1, v2) {
    return v1 - v2;
};

Timeline.PlanningUnit.earlier = function(v1, v2) {
    return Timeline.PlanningUnit.compare(v1, v2) < 0 ? v1 : v2;
};

Timeline.PlanningUnit.later = function(v1, v2) {
    return Timeline.PlanningUnit.compare(v1, v2) > 0 ? v1 : v2;
};

Timeline.PlanningUnit.change = function(v, n) {
    return v + n;
};
