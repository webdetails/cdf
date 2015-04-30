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
