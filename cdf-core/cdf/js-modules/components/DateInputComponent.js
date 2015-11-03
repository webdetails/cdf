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
  'css!./DateInputComponent'
], function($, BaseComponent) {

  var DateInputComponent = BaseComponent.extend({
    update: function() {
      var myself = this;
      var format = (myself.dateFormat == undefined || myself.dateFormat == null)
        ? 'yy-mm-dd' : myself.dateFormat;
      var inputId = myself.name;
      var inputValue = myself.dashboard.getParameterValue(myself.parameter);
      var startDate, endDate;

      if(myself.startDate == 'TODAY') {
        startDate = new Date();
      } else if(myself.startDate) {
        startDate = $.datepicker.parseDate(format, myself.startDate);
      }

      if(myself.endDate == 'TODAY') {
        endDate = new Date();
      } else if(myself.endDate) {
        endDate = $.datepicker.parseDate(format, myself.endDate);
      }

      //onOpen and onClose events
      myself.on('onOpen:dateInput', myself.onOpenEvent);
      myself.on('onClose:dateInput', myself.onCloseEvent);

      //ToDo: stretch interval to catch defaultValue?..
      //Dashboards.getParameterValue(myself.parameter))

      myself.placeholder()
        .addClass('date-input-container')
        .html('<input class="date-input" id="' + inputId + '" value="' + inputValue + '"/>');

      $(function() {
        myself.placeholder("input").datepicker({
          beforeShow: function() {
            myself.triggerOnOpen();
          },
          onClose: function() {
            myself.triggerOnClose();
          },
          dateFormat: format,
          changeMonth: true,
          changeYear: true,
          minDate: startDate,
          maxDate: endDate,
          onSelect: function(date, input) {
            myself.dashboard.processChange(inputId);
          }
        });
        // Add JQuery DatePicker standard localization support only if the dashboard is localized
        if(typeof myself.dashboard.i18nSupport !== "undefined" && myself.dashboard.i18nSupport != null) {
          var $input = myself.placeholder("input");

          $input.datepicker('option', $.datepicker.regional[myself.dashboard.i18nCurrentLanguageCode]);

          //Setup alt field and format to keep iso format
          $input.parent().append($('<hidden>').attr("id", inputId + "_hidden"));
          $input.datepicker("option", "altField", "#" + inputId + "_hidden");
          $input.datepicker("option", "altFormat", format);
        }
        myself._doAutoFocus();
      });
    },

    triggerOnOpen: function() {
      this.placeholder("input").toggleClass("dInputComponentExpanded", true);
      this.trigger('onOpen:dateInput');
    },

    triggerOnClose: function() {
      this.placeholder("input").toggleClass("dInputComponentExpanded", false);
      this.trigger('onClose:dateInput');
    },

    getValue: function() {
      if(typeof this.dashboard.i18nSupport !== "undefined" && this.dashboard.i18nSupport != null) {
        return $("#" + this.name + "_hidden").val();
      } else {
        return $("#" + this.name).val();
      }
    }
  });

  return DateInputComponent;
  
});
