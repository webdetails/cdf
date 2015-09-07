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

define(["../lib/jquery", "./BaseComponent"], function($, BaseComponent) {

  var MonthPickerComponent = BaseComponent.extend({
    update: function() {
      var myself = this;
      var selectHTML = myself.getMonthPicker(myself.name, myself.size, myself.initialDate, myself.minDate, myself.maxDate, myself.months);
      myself.placeholder().html(selectHTML);
      $("#" + myself.name).change(function() {
        myself.dashboard.processChange(myself.name);
      });
      myself._doAutoFocus();
    },
    getValue: function() {
      var myself = this;
      var value = $("#" + myself.name).val();

      var year = value.substring(0, 4);
      var month = parseInt(value.substring(5, 7) - 1);
      var d = new Date(year, month, 1);

      // rebuild picker
      var selectHTML = myself.getMonthPicker(myself.name, myself.size, d, myself.minDate, myself.maxDate, myself.months);
      myself.placeholder().html(selectHTML);
      
      $("#" + myself.name).change(function() {
        myself.dashboard.processChange(myself.name);
      });
      return value;
    },
    parseDate: function(aDateString) {
      //This works assuming the Date comes in this format -> yyyy-mm-dd or yyyy-mm
      //Date.UTC(year[year after 1900],month[0 to 11],day[1 to 31], hours[0 to 23], min[0 to 59], sec[0 to 59], ms[0 to 999])
      var parsedDate = null;
      var yearIndex = 0, monthIndex = 1, dayindex = 2;
      var split = aDateString.split("-");
      var year, month, day;

      if(split.length == 3) {
        year = parseInt(split[yearIndex]);
        month = parseInt(split[monthIndex]);
        day = parseInt(split[dayindex]);
        parsedDate = new Date(Date.UTC(year, (month - 1), day));
      } else if(split.length == 2) {
        year = parseInt(split[yearIndex]);
        month = parseInt(split[monthIndex]);
        parsedDate = new Date(Date.UTC(year, (month - 1)));
      }

      return parsedDate;
    },
    getMonthsAppart: function(aDateOne, aDateTwo) {
      var min, max;
      if(aDateOne < aDateTwo) {
        min = aDateOne;
        max = aDateTwo;
      } else {
        min = aDateTwo;
        max = aDateOne;
      }

      var yearsAppart = (max.getFullYear() - min.getFullYear());
      var monthsToAdd = yearsAppart * 12;
      var monthCount = (max.getMonth() - min.getMonth()) + monthsToAdd; //TODO verify this calculation
      
      return monthCount;
    },
    normalizeDateToCompare: function(dateObject) {
      var normalizedDate = dateObject;
      normalizedDate.setDate(1);
      normalizedDate.setHours(0);
      normalizedDate.setMinutes(0);
      normalizedDate.setSeconds(0);
      normalizedDate.setMilliseconds(0);

      return normalizedDate;

    },
    getMonthPicker: function(object_name, object_size, initialDate, minDate, maxDate, monthCount) {

      var selectHTML = "<select";
      selectHTML += " id='" + object_name + "'";

      if(initialDate == undefined || initialDate == null) {
        initialDate = new Date();
      }
      if(minDate == undefined || minDate == null) {
        minDate = new Date();
        minDate.setYear(1980);
      }
      if(maxDate == undefined || maxDate == null) {
        maxDate = new Date();
        maxDate.setYear(2060);
      }

      //if any of the dates comes in string format this will parse them
      if(typeof initialDate === "string") { initialDate = this.parseDate(initialDate); }
      if(typeof minDate === "string") { minDate = this.parseDate(minDate); }
      if(typeof maxDate === "string") { maxDate = this.parseDate(maxDate); }

      // if monthCount is not defined we'll use everything between max and mindate
      var monthCountUndefined = false;
      if(monthCount == undefined || monthCount == 0) {
        monthCount = this.getMonthsAppart(minDate, maxDate);
        monthCountUndefined = true;
      }

      //set size
      if(object_size != undefined) {
        selectHTML += " size='" + object_size + "'";
      }
      selectHTML += '>';

      var currentDate = new Date(+initialDate);

      /*
      * This block is to make sure the months are compared equally. A millisecond can ruin the comparison.
      */

      if(monthCountUndefined == true) {
        currentDate.setMonth(currentDate.getMonth() - (this.getMonthsAppart(minDate,currentDate)) - 1);
      } else {
        currentDate.setMonth(currentDate.getMonth() - (monthCount/2) - 1);
      }
      currentDate = this.normalizeDateToCompare(currentDate);
      var normalizedMinDate = this.normalizeDateToCompare(minDate);
      var normalizedMaxDate = this.normalizeDateToCompare(maxDate);

      for(var i = 0; i <= monthCount; i++) {

        currentDate.setMonth(currentDate.getMonth() + 1);

        if(currentDate >= normalizedMinDate && currentDate <= normalizedMaxDate) {

          selectHTML += "<option value = '" 
            + currentDate.getFullYear() + "-" 
            + this.zeroPad((currentDate.getMonth() + 1), 2) + "' ";

          if(currentDate.getFullYear() == initialDate.getFullYear() 
            && currentDate.getMonth() == initialDate.getMonth()) {

            selectHTML += "selected='selected'"
          }

          selectHTML += ">" + this.dashboard.monthNames[currentDate.getMonth()] + " "
            + currentDate.getFullYear() + "</option>";
        }
      }

      selectHTML += "</select>";

      return selectHTML;
    },
    zeroPad: function(num,size) {
      var n = "00000000000000" + num;
      return n.substring(n.length - size, n.length);
    }
  });

  return MonthPickerComponent;
  
});
