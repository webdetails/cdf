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
 *  Planning Labeller
 *==================================================
 */

Timeline.PlanningLabeller = function(locale) {
    this._locale = locale;
};

Timeline.PlanningLabeller.labels = [];

Timeline.PlanningLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = Timeline.PlanningUnit.toNumber(date);
    
    var prefix = "";
    var divider = 1;
    var divider2 = 7;
    var labels = Timeline.PlanningLabeller.labels[this._locale];
    
    switch (intervalUnit) {
    case Timeline.PlanningUnit.DAY:     prefix = labels.dayPrefix;      break;
    case Timeline.PlanningUnit.WEEK:    prefix = labels.weekPrefix;     divider = 7;        divider2 = divider * 4; break;
    case Timeline.PlanningUnit.MONTH:   prefix = labels.monthPrefix;    divider = 28;       divider2 = divider * 3; break;
    case Timeline.PlanningUnit.QUARTER: prefix = labels.quarterPrefix;  divider = 28 * 3;   divider2 = divider * 4; break;
    case Timeline.PlanningUnit.YEAR:    prefix = labels.yearPrefix;     divider = 28 * 12;  divider2 = divider * 5; break;
    }
    return { text: prefix + Math.floor(n / divider), emphasized: (n % divider2) == 0 };
};

Timeline.PlanningLabeller.prototype.labelPrecise = function(date) {
    return Timeline.PlanningLabeller.labels[this._locale].dayPrefix + 
        Timeline.PlanningUnit.toNumber(date);
};
