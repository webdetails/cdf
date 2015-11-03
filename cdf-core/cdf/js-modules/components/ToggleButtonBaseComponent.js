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

define(['../lib/jquery', './InputBaseComponent'], function($, InputBaseComponent) {

  var ToggleButtonBaseComponent = InputBaseComponent.extend({
    draw: function(myArray) {
      var myself = this;
      //default
      var currentVal = myself.dashboard.getParameterValue(myself.parameter);
      currentVal = (typeof currentVal == 'function') ? currentVal() : currentVal;

      var isSelected = false;

      var currentValArray = [];
      if(currentVal == null || currentVal == undefined) {
        currentValArray = [];
      } else if(currentVal instanceof Array || (typeof currentVal == "object" && currentVal.join)) {
        currentValArray = currentVal;
      } else if(typeof currentVal == "string") {
        currentValArray = currentVal.split("|");
      }

      // check to see if current selected values are in the current values array. If not check to see if we should default to the first
      var vid = myself.valueAsId == false ? 0 : 1;
      var hasCurrentVal = false;
      outer:
      for(var i = 0; i < currentValArray.length; i++) {
        for(var y = 0; y < myArray.length; y++) {
          if(currentValArray[i] == myArray[y][vid]) {
            hasCurrentVal = true;
            break outer;
          }
        }
      }
      // if there will be no selected value, but we're to default if empty, select the first
      if(!hasCurrentVal && myself.defaultIfEmpty) {
        currentValArray = [myArray[0][vid]];

        myself.currentVal = currentValArray;
        myself.dashboard.setParameter(myself.parameter, currentValArray);
        myself.dashboard.processChange(myself.name);
      }
      // (currentValArray == null && myself.defaultIfEmpty)? firstVal : null

      var elClass = (myself.verticalOrientation) ? "toggleGroup vertical" : "toggleGroup horizontal";
      var selectHTML = $('<ul/>').attr({class: elClass});
      for(var i = 0, len = myArray.length; i < len; i++) {
        //TODO: review the callAjaxAfterRender call because it is calling the lifecycle and should not require the global Dashboards object
        var li = $('<li/>').attr({class: elClass});
        var input = $("<input/>").click(function() {
          myself.callAjaxAfterRender(myself, myself.name);
        });

        isSelected = false;
        for(var j = 0, valLength = currentValArray.length; j < valLength; j++) {
          isSelected = currentValArray[j] == myArray[i][vid];
          if(isSelected) {
            break;
          }
        }

        if(myself.type == 'radio' || myself.type == 'radioComponent') {
          if((i == 0 && !hasCurrentVal) || (hasCurrentVal && (myArray[i][vid] == currentVal))) {
            input.prop('checked', true);
          }
          input.attr({type: "radio"});
        } else {
          if((i == 0 && !hasCurrentVal && myself.defaultIfEmpty) || (hasCurrentVal && isSelected)) {
            input.prop('checked', true);
          }
          input.attr({type: "checkbox"});
        }
        input.attr({
          class: myself.name,
          name: myself.name,
          id: myself.name + i,
          value: myArray[i][vid]
        });
        input.appendTo(li);
        li.append($("<label/>")
          .attr({'for': myself.name + i})
          .text(myArray[i][1]));
        selectHTML
          .append(li)
          .append((myself.separator == undefined || myself.separator == null || myself.separator == "null") 
            ? "" : myself.separator);
      }
      // update the placeholder
      myself.placeholder().html(selectHTML);
      myself.currentVal = null;
      myself._doAutoFocus();
    },
    callAjaxAfterRender: function(m, name) {
      var myself = m;
      setTimeout(function() {
        myself.dashboard.processChange(name);
      }, 1);
    }
  });

  return ToggleButtonBaseComponent;

});
