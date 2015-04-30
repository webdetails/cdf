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
 *  Geochrono Labeller
 *==================================================
 */

Timeline.GeochronoLabeller = function(locale) {
    this._locale = locale;
};

Timeline.GeochronoLabeller.eonNames = [];
Timeline.GeochronoLabeller.eraNames = [];
Timeline.GeochronoLabeller.periodNames = [];
Timeline.GeochronoLabeller.epochNames = [];
Timeline.GeochronoLabeller.ageNames = [];

Timeline.GeochronoLabeller.prototype.labelInterval = function(date, intervalUnit) {
    var n = Timeline.GeochronoUnit.toNumber(date);
    var dates, names;
    switch (intervalUnit) {
    case Timeline.GeochronoUnit.AGE:
        dates = Timeline.Geochrono.ages;
        names = Timeline.GeochronoLabeller.ageNames; break;
    case Timeline.GeochronoUnit.EPOCH:
        dates = Timeline.Geochrono.epoches;
        names = Timeline.GeochronoLabeller.epochNames; break;
    case Timeline.GeochronoUnit.PERIOD:
        dates = Timeline.Geochrono.periods;
        names = Timeline.GeochronoLabeller.periodNames; break;
    case Timeline.GeochronoUnit.ERA:
        dates = Timeline.Geochrono.eras;
        names = Timeline.GeochronoLabeller.eraNames; break;
    case Timeline.GeochronoUnit.EON:
        dates = Timeline.Geochrono.eons;
        names = Timeline.GeochronoLabeller.eonNames; break;
    default:
        return { text: n, emphasized: false };
    }
    
    for (var i = dates.length - 1; i >= 0; i--) {
        if (n <= dates[i].start) {
            return { 
                text: names[this._locale][i].name, 
                emphasized: n == dates[i].start 
            }
        }
    }
    return { text: n, emphasized: false };
};

Timeline.GeochronoLabeller.prototype.labelPrecise = function(date) {
    return Timeline.GeochronoUnit.toNumber(date) + "ma";
};
