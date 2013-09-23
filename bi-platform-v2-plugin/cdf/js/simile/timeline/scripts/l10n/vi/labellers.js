/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

/*==================================================
 *  Localization of labellers.js
 *==================================================
 */

Timeline.GregorianDateLabeller.monthNames["vi"] = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

Timeline.GregorianDateLabeller.labelIntervalFunctions["vi"] = function(date, intervalUnit) {
    var text;
    var emphasized = false;
    
    var date2 = Timeline.DateTime.removeTimeZoneOffset(date, this._timeZone);
    
    switch(intervalUnit) {
    case Timeline.DateTime.DAY:
    case Timeline.DateTime.WEEK:
        text = date2.getUTCDate() + "/" + (date2.getUTCMonth() + 1);
        break;
    default:
        return this.defaultLabelInterval(date, intervalUnit);
    }
    
    return { text: text, emphasized: emphasized };
};
