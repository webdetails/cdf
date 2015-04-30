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
 *  Localization of labellers.js
 *==================================================
 */

Timeline.GregorianDateLabeller.monthNames["cs"] = [
    "Leden", "�nor", "B�ezen", "Duben", "Kv�ten", "�erven", "�ervenec", "Srpen", "Z���", "��jen", "Listopad", "Prosinec"
];

Timeline.GregorianDateLabeller.dayNames["cs"] = [
    "Ne", "Po", "�t", "St", "�t", "P�", "So"
];

Timeline.GregorianDateLabeller.labelIntervalFunctions["cs"] = function(date, intervalUnit) {
    var text;
    var emphasized = false;

    var date2 = Timeline.DateTime.removeTimeZoneOffset(date, this._timeZone);
    
    switch(intervalUnit) {
    case Timeline.DateTime.DAY:
    case Timeline.DateTime.WEEK:
        text = date2.getUTCDate() + ". " + (date2.getUTCMonth() + 1) + ".";
        break;
    default:
        return this.defaultLabelInterval(date, intervalUnit);
    }
    
    return { text: text, emphasized: emphasized };
};
