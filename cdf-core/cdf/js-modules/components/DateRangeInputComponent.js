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
  '../lib/jquery',
  './BaseComponent',
  'amd!../lib/daterangepicker.jQuery',
  'css!./DateRangeInputComponent'
], function($, BaseComponent) {

  var DateRangeInputComponent = BaseComponent.extend({
    update: function() {
      var myself = this;
      var dr;
      var inputId = this.name;
      var startValue = this.getStartParamValue();
      var endValue = this.getEndParamValue();
      var inputSeparator = this.inputSeparator = this.inputSeparator || ">";

      if (this.singleInput == undefined || this.singleInput == true) {
        dr = $('<input class="date-range-single-input" id="' + inputId + '" value="' + startValue + ' ' + inputSeparator + ' ' + endValue + '"/>');
      } else {
        dr = $('<input class="date-range-multiple-input" id="' + inputId + '" value="' + startValue + '"/>' + inputSeparator +
        '<input class="date-range-multiple-input-2" id="' + inputId + '2" value="' + endValue + '"/>');
      }

      this.placeholder()
            .addClass('date-range-input-container')
            .html(dr);

      //onOpen and onClose events
      myself.on('onOpen:dateRangeInput', myself.onOpenEvent);
      myself.on('onClose:dateRangeInput', myself.onCloseEvent);

      var offset = dr.offset();
      var earliestDate = myself.earliestDate != undefined ? myself.earliestDate : Date.parse('-1years');
      var latestDate = myself.latestDate != undefined ? myself.latestDate : Date.parse('+1years');
      var leftOffset = myself.leftOffset != undefined ? myself.leftOffset : 0;
      var topOffset = myself.topOffset != undefined ? myself.topOffset : 15;

      var changed, closed;
      function triggerWhenDone() {
        if(changed && closed) {
          myself.fireInputChange(myself.startValue,myself.endValue);
          changed = closed = false;
        }
      }

      var format = (myself.dateFormat == undefined || myself.dateFormat == null) 
        ? 'yy-mm-dd'
        : myself.dateFormat;

      $(function() {
        myself.placeholder("input").daterangepicker({
          posX: offset.left + leftOffset,
          posY: offset.top + topOffset,
          earliestDate: earliestDate,
          latestDate: latestDate,
          dateFormat: format,
          rangeSplitter: inputSeparator,
          onOpen: function() {
            myself.triggerOnOpen();

            changed = closed = false;
            myself.startValue = null;
            myself.endValue = null;

            myself.addCancelButton();
          },
          onDateSelect: function(rangeA, rangeB) {
            changed = true;
            myself.storeChanges(rangeA, rangeB);
            triggerWhenDone();
          },
          onClose: function() {
            myself.triggerOnClose();

            closed = true;
            triggerWhenDone();
          }
        });
        myself._doAutoFocus();

        if(myself.canClickOutsidePopup) {
          $(document).off('click');
        }
      });
    },

    triggerOnOpen: function() {
      this.placeholder("input").toggleClass("driComponentExpanded", true);
      this.trigger('onOpen:dateRangeInput');
    },

    triggerOnClose: function() {
      this.placeholder("input").toggleClass("driComponentExpanded", false);
      this.trigger('onClose:dateRangeInput');
    },

    getStartParamValue: function() {
      return this.dashboard.getParameterValue(this.parameter[0]);
    },

    getEndParamValue: function() {
      return this.dashboard.getParameterValue(this.parameter[1]);
    },

    addCancelButton: function() {
      var myself = this;
      var start = myself.getStartParamValue();
      var end = myself.getEndParamValue();
      var rpPickers = $(".ui-daterangepickercontain .ranges");
      var cancelBtn = $('<button class="btnCancel ui-state-default ui-corner-all">Cancel</button>')
        .click(function() {
          var input = myself.placeholder("input");
          var rangePicker = $(".ui-daterangepickercontain .ui-daterangepicker");
          var rangeStart = $(".ui-daterangepickercontain .range-start");
          var rangeEnd = $(".ui-daterangepickercontain .range-end");

          //reset value on input
          if(myself.singleInput == undefined || myself.singleInput == true) {
            input.val(start + " " + myself.inputSeparator + " " + end);
          } else {
            input.eq(0).val(start);
            input.eq(1).val(end);
          }

          //set date to initial values
          rangeStart.data("saveDate", new Date(start)).restoreDateFromData();
          rangeEnd.data("saveDate", new Date(end)).restoreDateFromData();

          //close dateRangeInput Component
          myself.triggerOnClose();
          rangePicker.data('state', 'closed');
          rangePicker.fadeOut(300);})
        .hover(
          function() {
            $(this).addClass('ui-state-hover');
          },
          function() {
            $(this).removeClass('ui-state-hover');
          })
        .appendTo(rpPickers);

      //button animation when selecting other list element
      var ul = $('.ui-daterangepickercontain ul');
      ul.find("li").click(function() {
        cancelBtn.hide();
        setTimeout(function() { cancelBtn.fadeIn(); }, 400);
      });
    },

    fireInputChange: function(start, end) {
      //TODO: review this!
      if(this.preChange) {
        this.preChange(start, end);
      }

      if(this.parameter) {
        if(this.parameter.length == 2) {
          this.dashboard.setParameter(this.parameter[1], end);
        }
        if(this.parameter.length > 0) {
          this.dashboard.fireChange(this.parameter[0], start);
        }
      }

      if(this.postChange) {
        this.postChange(start, end);
      }
    },

    storeChanges: function(start, end) {
      this.startValue = start;
      this.endValue = end;
    }
  },
  {
    fireDateRangeInputChange: function(name, rangeA, rangeB) {
      // WPG: can we just use the parameter directly?
      var object = this.dashboard.getComponentByName(name);
      if(!(typeof(object.preChange) == 'undefined')) {
        object.preChange(rangeA, rangeB);
      }
      var parameters = eval(name + ".parameter");
      // set the second date and fireChange the first
      this.dashboard.setParameter(parameters[1], rangeB);
      this.dashboard.fireChange(parameters[0], rangeA);
      if(!(typeof(object.postChange) == 'undefined')) {
        object.postChange(rangeA, rangeB);
      }
    }
  });

  return DateRangeInputComponent;

});
