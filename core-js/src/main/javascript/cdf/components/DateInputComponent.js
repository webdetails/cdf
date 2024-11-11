/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  '../lib/jquery',
  './BaseComponent',
  'css!./theme/DateInputComponent'
], function($, BaseComponent) {

  return BaseComponent.extend({
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

      var $el = $('<input class="date-input" id="' + inputId + '"/>');
      $el.val(inputValue);

      myself.placeholder()
        .addClass('date-input-container')
        .html($el);

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
  
});
