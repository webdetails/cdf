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

define(["../lib/jquery", "./BaseComponent"], function ($, BaseComponent) {

  var DateInputComponent = BaseComponent.extend({
    update: function(){
      var format = (this.dateFormat == undefined || this.dateFormat == null)? 'yy-mm-dd' : this.dateFormat;
      var myself = this;

      var startDate, endDate;

      if(this.startDate == 'TODAY') startDate = new Date();
      else if(this.startDate) startDate = $.datepicker.parseDate( format, this.startDate);

      if(this.endDate == 'TODAY') endDate = new Date();
      else if(this.endDate) endDate = $.datepicker.parseDate( format, this.endDate);

      //onOpen and onClose events
      this.on('onOpen:dateInput', this.onOpenEvent );
      this.on('onClose:dateInput', this.onCloseEvent );

      //ToDo: stretch interval to catch defaultValue?..
      //Dashboards.getParameterValue(this.parameter))

      this.placeholder().html($("<input/>").attr("id", this.name).attr("value", this.dashboard.getParameterValue(this.parameter)).css("width", "80px"));
      $(function(){
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
          onSelect: function(date, input){
            myself.dashboard.processChange(myself.name);
          }
        });
        // Add JQuery DatePicker standard localization support only if the dashboard is localized
        if (typeof myself.dashboard.i18nSupport !== "undefined" && myself.dashboard.i18nSupport != null) {
          var $input = myself.placeholder("input");

          $input.datepicker('option', $.datepicker.regional[myself.dashboard.i18nCurrentLanguageCode]);


          //Setup alt field and format to keep iso format
          $input.parent().append($('<hidden>').attr("id", myself.name + "_hidden"));
          $input.datepicker("option", "altField", "#" + myself.name + "_hidden" );
          $input.datepicker("option", "altFormat", format );
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

    getValue : function() {
      if (typeof this.dashboard.i18nSupport !== "undefined" && this.dashboard.i18nSupport != null)
        return $("#" + this.name + "_hidden").val();
      else
        return $("#"+this.name).val();
    }
  });

  return DateInputComponent;
});