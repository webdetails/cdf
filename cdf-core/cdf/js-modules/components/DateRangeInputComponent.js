/*!
* Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
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

define(["../lib/jquery", "./BaseComponent", "../lib/daterangepicker.jQuery"], function ($, BaseComponent) {

  var DateRangeInputComponent = BaseComponent.extend({
    update : function() {
      var dr;
      if (this.singleInput == undefined || this.singleInput == true){
        dr = $("<input/>").attr("id",this.name).attr("value",this.dashboard.getParameterValue(this.parameter[0]) + " > " + this.dashboard.getParameterValue(this.parameter[1]) ).css("width","170px");
        this.placeholder().html(dr);
      } else {
        dr = $("<input/>").attr("id",this.name).attr("value",this.dashboard.getParameterValue(this.parameter[0])).css("width","80px");
        this.placeholder().html(dr);
        dr.after($("<input/>").attr("id",this.name + "2").attr("value",this.dashboard.getParameterValue(this.parameter[1])).css("width","80px"));
        if(this.inputSeparator != undefined){
          dr.after(this.inputSeparator);
        }
      }
      var offset = dr.offset();
      var myself = this;
      var earliestDate = this.earliestDate != undefined  ?  this.earliestDate : Date.parse('-1years');
      var latestDate = this.latestDate != undefined  ?  this.latestDate : Date.parse('+1years');
      var leftOffset = this.leftOffset != undefined ?  this.leftOffset : 0;
      var topOffset = this.topOffset != undefined ?  this.topOffset : 15;

      var changed, closed;
      function triggerWhenDone() {
        if(changed && closed) {
          myself.fireInputChange(myself.startValue,myself.endValue);
          changed = closed = false;
        }
      };

      var format = (myself.dateFormat == undefined || myself.dateFormat == null)? 'yy-mm-dd' : myself.dateFormat;

      $(function(){
        myself.placeholder("input").daterangepicker({
          posX: offset.left + leftOffset,
          posY: offset.top + topOffset,
          earliestDate: earliestDate,
          latestDate: latestDate,
          dateFormat: format,
          onOpen: function() {
            changed = closed = false;
            myself.startValue = null;
            myself.endValue = null;
          },
          onDateSelect: function(rangeA, rangeB) {
            changed = true;
            myself.storeChanges(rangeA, rangeB);
            triggerWhenDone();
          },
          onClose: function() {
            closed = true;
            triggerWhenDone();
          }
        });
        myself._doAutoFocus();
      });
    },

    fireInputChange : function(start, end){
      //TODO: review this!
      if(this.preChange){
        this.preChange(start, end);
      }

      if(this.parameter) {
        if( this.parameter.length == 2) this.dashboard.setParameter(this.parameter[1], end);
        if( this.parameter.length > 0) this.dashboard.fireChange(this.parameter[0], start);
      }

      if(this.postChange){
        this.postChange(start, end);
      }
    },

    storeChanges : function(start,end){
      this.startValue = start;
      this.endValue = end;
    }
  },
  {
    fireDateRangeInputChange : function(name, rangeA, rangeB){
      // WPG: can we just use the parameter directly?
      var object = this.dashboard.getComponentByName(name);
      if(!(typeof(object.preChange)=='undefined')){
        object.preChange(rangeA, rangeB);
      }
      var parameters = eval(name + ".parameter");
      // set the second date and fireChange the first
      this.dashboard.setParameter(parameters[1], rangeB);
      this.dashboard.fireChange(parameters[0],rangeA);
      if(!(typeof(object.postChange)=='undefined')){
        object.postChange(rangeA, rangeB);
      }
    }
  });

  return DateRangeInputComponent;
});