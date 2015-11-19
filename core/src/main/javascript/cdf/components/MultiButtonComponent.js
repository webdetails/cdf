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

define([
  './MultiButtonComponent.ext',
  '../lib/jquery',
  './ToggleButtonBaseComponent',
  '../dashboard/Utils'
], function(MultiButtonComponentExt, $, ToggleButtonBaseComponent, Utils) {

  var MultiButtonComponent = ToggleButtonBaseComponent.extend({
    indexes: [],//used as static
    draw: function(myArray) {
      this.cachedArray = myArray;
      var myself = this;
      var cssWrapperClass = MultiButtonComponentExt.getCssWrapperClass(myself.verticalOrientation);
      var selectHTML = "";
      var firstVal;

      var valIdx = myself.valueAsId ? 1 : 0;
      var lblIdx = 1;

      if(myself.isMultiple == undefined) { myself.isMultiple = false; }

      var ph = $("<div>");
      ph.appendTo(myself.placeholder().empty());

      for(var i = 0, len = myArray.length; i < len; i++) {
        var value = myArray[i][valIdx],
          label = myArray[i][lblIdx],
          classes = cssWrapperClass + MultiButtonComponentExt.getExtraCss(i, len, myself.verticalOrientation),
          selector;

        value = (value == null ? null : value.replace('"', '&quot;'));
        label = (label == null ? null : label.replace('"', '&quot;'));

        if(i == 0) { firstVal = value; }

        selectHTML = "<div class='" + classes +"'><button type='button' name='" + myself.name + "'>" 
          + label + "</button  >" + "</div>";
        selector = $(selectHTML);

        // We wrap the click handler in a self-executing function so that we can capture 'i'.
        (function(index) {
          selector.click(function() {
            myself.clickButton(myself.htmlObject, myself.name, index, myself.isMultiple, myself.verticalOrientation);
          });
        }(i));
        ph.append(selector);

        var separator = myself.separator;
        if(!(separator == undefined || separator == null || separator == "null")
          && i != myArray.length - 1) {

          ph.append(separator);
        }
      }


      //default
      var currentVal = Utils.ev(myself.dashboard.getParameterValue(myself.parameter));

      var isSelected = false;

      var currentValArray;
      if(currentVal == null || currentVal == undefined) {
        currentValArray = [];
      } else if(currentVal instanceof Array || (typeof(currentVal) == "object" && currentVal.join)) {
        currentValArray = currentVal;
      } else {
        currentValArray = currentVal.toString().split("|");
      }

      var foundDefault = false;
      myself.clearSelections(myself.htmlObject, myself.name, myself.verticalOrientation);
      for(var i = 0; i < myArray.length; i++) {

        isSelected = false;
        for(var j = 0, valLength = currentValArray.length; j < valLength; j++) {
          isSelected = currentValArray[j] == myArray[i][valIdx];

          if(isSelected) { break; }
        }


        if(($.isArray(currentVal) && isSelected || isSelected)
          || (myArray[i][valIdx] == currentVal || myArray[i][lblIdx] == currentVal)) {

          myself.clickButton(
            myself.htmlObject, 
            myself.name, 
            i, 
            myself.isMultiple, 
            myself.verticalOrientation, 
            true
          );

          foundDefault = true;
          if(!myself.isMultiple) { break; }
        }
      }
      if(((!foundDefault && !myself.isMultiple) || (!foundDefault && myself.isMultiple && myself.defaultIfEmpty))
        && myArray.length > 0) {

        //select first value
        if((currentVal == null || currentVal == "" || (typeof(currentVal) == "object" && currentVal.length == 0)) 
          && myself.parameter) {

          myself.dashboard.fireChange(myself.parameter, (myself.isMultiple) ? [firstVal] : firstVal);
        }

        myself.clickButton(
          myself.htmlObject, 
          myself.name, 0, 
          myself.isMultiple, 
          myself.verticalOrientation, 
          true
        );
      }

      // set up hovering
      $("." + MultiButtonComponentExt.getToggleButtonClass()).hover(function() {
        $(myself).addClass(MultiButtonComponentExt.getToggleButtonHoveringClass());
      }, function() {
        $(myself).removeClass(MultiButtonComponentExt.getToggleButtonHoveringClass());
      });
      // set up hovering when inner button is hovered
      $("." + MultiButtonComponentExt.getToggleButtonClass() + " button").hover(function() {
        $(myself).parent().addClass(MultiButtonComponentExt.getToggleButtonHoveringClass());
      }, function() {
        // don't remove it, since it's inside the outer div it will handle that
      });

      myself._doAutoFocus();
    },

    getValue: function() {
      var myself = this;
      if(myself.isMultiple) {
        var indexes = myself.getSelectedIndex(myself.name);
        var a = new Array();
        // if it is not an array, handle that too
        if(indexes.length == undefined) {
          a.push(myself.getValueByIdx(indexes));
        } else {
          for(var i = 0; i < indexes.length; i++) {
            a.push(myself.getValueByIdx(indexes[i]));
          }
        }
        return a;
      } else {
        return myself.getValueByIdx(myself.getSelectedIndex(myself.name));
      }
    },

    getValueByIdx: function(idx) {
      return this.cachedArray[idx][this.valueAsId ? 1 : 0];
    },

    //static MultiButtonComponent.prototype.clickButton
    // This method should be broken up so the UI state code is reusable outside of event processing
    clickButton: function(htmlObject, name, index, isMultiple, verticalOrientation, updateUIOnly) {

      var cssWrapperClass = MultiButtonComponentExt.getUnselectedCss(verticalOrientation);
      var cssWrapperClassSelected = MultiButtonComponentExt.getSelectedCss(verticalOrientation);

      var buttons = $("#" + htmlObject + " button");
      if(isMultiple) {//toggle button
        if(this.indexes[name] == undefined) {
          this.indexes[name] = [];
        } else if(!$.isArray(this.indexes[name])) {
          this.indexes[name] = [this.indexes[name]];//!isMultiple->isMultiple
        }

        var disable = false;
        for(var i = 0; i < this.indexes[name].length; ++i) {
          if(this.indexes[name][i] == index) {
            disable = true;
            this.indexes[name].splice(i, 1);
            break;
          }
        }
        if(disable) {
          buttons[index].parentNode.className = cssWrapperClass + MultiButtonComponentExt.getExtraCss(index, buttons.length, verticalOrientation);
        } else {
          buttons[index].parentNode.className = cssWrapperClassSelected + MultiButtonComponentExt.getExtraCss(index, buttons.length, verticalOrientation);
          this.indexes[name].push(index);
        }
      } else if (this.indexes[name] === index) {
        return false;
      } else {//de-select old, select new
        this.clearSelections(htmlObject, name, verticalOrientation);
        this.indexes[name] = index;
        buttons[index].parentNode.className = cssWrapperClassSelected + MultiButtonComponentExt.getExtraCss(index, buttons.length, verticalOrientation);
      }
      if(!updateUIOnly) {
        this.callAjaxAfterRender(this, name);
      }
    },

    clearSelections: function(htmlObject, name, verticalOrientation) {
      var buttons = $("#" + htmlObject + " button");
      var cssWrapperClass = MultiButtonComponentExt.getUnselectedCss(verticalOrientation);
      for(var i = 0; i < buttons.length; i++) {
        buttons[i].parentNode.className = cssWrapperClass + MultiButtonComponentExt.getExtraCss(i, buttons.length, verticalOrientation);
      }

      this.indexes[name] = [];
    },

    //static MultiButtonComponent.prototype.getSelectedIndex
    getSelectedIndex: function(name) {
      return this.indexes[name];
    }
  });

  return MultiButtonComponent;

});
