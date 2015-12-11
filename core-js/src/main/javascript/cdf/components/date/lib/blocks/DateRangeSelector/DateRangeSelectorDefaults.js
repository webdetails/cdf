define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/moment',
  '../../../../../lib/mustache',
  '../../base/BaseModel'
], function ( _ , moment , Mustache , BaseModel ){
  'use strict';

  var defaults = {

    precisionPresets:{
      "day":     { label: "Day" , value: "day" },
      "week":    { label: "Week" , value: "week" },
      "isoWeek": { label: "Week" , value: "isoWeek" },
      "month":   { label: "Month" , value: "month" },
      "quarter": { label: "Quarter" , value: "quarter" },
      "year":    { label: "Year" , value: "year" }
    },

    precisions: [ 'day' , 'week' , 'month' , 'quarter' , 'year' ],

    selectorPresets: {
      'mtd': {
        value: 'mtd',
        type: 'predefined',
        label: 'Month to Date',
        getRange: function () {
          return {start: moment().startOf('month'), end: moment(), precision:'day' };
        }
      },
      'last7d': {
        value: 'last7d',
        type: 'predefined',
        label: 'Last 7 Days',
        getRange: function () {
          return {start: moment().add(-7, 'days'), end: moment(), precision:'day' };
        }
      },
      'ytd': {
        value: 'ytd',
        type: 'predefined',
        label: 'Year to Date',
        getRange: function () {
          return {start: moment().startOf('year'), end: moment(), precision:'day' };
        }
      },
      'custom': {
        type: 'custom',
        value: 'custom'
      }
    },

    selectors: [ 'mtd' , 'last7d' , 'custom' ],

    rangeFormat:{
      'day': 'MMM DD{, YYYY}',
      'week': '[Week] ww{, YYYY}',
      'isoWeek': '[Week] ww{, YYYY}',
      'month': 'MMM{, YYYY}',
      'quarter': '[Q]Q{, YYYY}',
      'year': 'YYYY'
    },

    granularityPresets: {
      "day":     {
        label: "Day" ,
        value: "day"
      },
      "week":    {
        label: "Week" ,
        value: "week"
      },
      "month":   {
        label: "Month" ,
        value: "month"
      },
      "quarter": {
        label: "Quarter" ,
        value: "quarter"
      },
      "year":    {
        label: "Year" ,
        value: "year"
      }
    },

    granularities: [ 'day' , 'week' , 'month' , 'quarter' , 'year' ],

    granularityValidator: 20,

    labels: {
      cancelButton: 'Cancel',
      applyButton: 'Apply',
      intervals: 'Intervals:',
      customRange: 'Custom Range',
      selectedPeriod: 'Selected Period:',
      startDate: 'Start Date:',
      endDate: 'End Date:',
      granularity: 'Granularity:'
    },

    dateFormat: {
      'day' : 'MMM DD, YYYY',
      'month': 'MMM [<span class="weak">](DD, YYYY)[</span>]',
      'week': '[Week] ww [<span class="weak">](MMM DD, YYYY)[</span>]',
      'isoWeek': '[Week] WW [<span class="weak">](MMM DD, YYYY)[</span>]',
      'quarter': '[Q]Q [<span class="weak">](MMM DD, YYYY)[</span>]',
      'year': 'YYYY [<span class="weak">](MMM DD)[</span>]'
    },

    calendarFormat: {
      'day' : 'DD',
      'month': 'MMM',
      'week': function ( date ){
        var startMonth = date.startOf('week').format('MMM'),
          endMonth = date.endOf('week').format('MMM'),
          model = {
            week: date.format('[W]w'),
            range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
          },
          template = '{{week}} <span class="weak">({{range}})</span>';
        return Mustache.render( template, model );
      },
      'isoWeek': function ( date ){
        var startMonth = date.startOf('isoWeek').format('MMM'),
          endMonth = date.endOf('isoWeek').format('MMM'),
          model = {
            week: date.format('[W]W'),
            range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
          },
          template = '{{week}} <span class="weak">({{range}})</span>';
        return Mustache.render( template, model );
      },
      'quarter': '[Q]Q',
      'year': 'YYYY',
      'dayOfWeek': 'ddd'
    },

    max: function (){
      return moment();
    },

    min: function(){
      return moment().add(-20,'year');
    }

  };

  return ( new BaseModel(defaults) );

});