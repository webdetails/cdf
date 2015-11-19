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
