define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/moment',
  '../../../../../lib/mustache',
  '../../base/BaseModel'
], function ( _ , moment , Mustache , BaseModel ){
  'use strict';

  var defaults = {

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
    },

    edge: 'start',

    precision: 'day'

  };

  return ( new BaseModel(defaults) );
});