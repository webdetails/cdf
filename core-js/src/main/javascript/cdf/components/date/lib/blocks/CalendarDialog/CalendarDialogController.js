define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/moment',
  '../../../../../lib/mustache',
  '../../base/BlockController',
  '../../utils/DateFormatter'
], function ( _ , moment , Mustache , BlockController , DateFormatter ){
  'use strict';

  var defaultFormats =  {
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
    'year': 'YYYY'
  };
  function getDefaultFormats (){
    return defaultFormats;
  }
  function setDefaultFormats ( formats ){
    if (_.isObject(formats)){
      defaultFormats = formats;
    }
  }


  // Private
  function getAllPrecisions( precision ){
    var precisionsMap = {
      day: [ 'year', 'month' , 'day' ],
      week: [ 'year' , 'week' ],
      isoWeek: [ 'year' , 'isoWeek' ],
      month: [ 'year' , 'month' ],
      quarter: [ 'year' , 'quarter' ],
      year: [ 'year' ]
    };

    return precisionsMap[precision];
  }

  function getPrimaryPrecision ( precision ){
    return _.last( getAllPrecisions( precision ) );
  }

  function getPrecisionsTooltip( precision ){
    var tooltipMap = {
      'day': 'Click to select day',
      'week': 'Click to select week',
      'isoWeek': 'Click to select week',
      'month': 'Click to select month',
      'quarter': 'Click to select quarter',
      'year': 'Click to select year'
    };
    return tooltipMap[precision];
  }

  function getPrecisionsModel ( date , precision , dateFormatter ){
    var precisions = {},
      precisionsList = _.without( getAllPrecisions( precision ) , getPrimaryPrecision( precision ) );
    _.forEach( precisionsList , function ( newPrecision ) {
      precisions[newPrecision] = {
        label: dateFormatter( date , newPrecision ) ,
        tooltip: getPrecisionsTooltip( newPrecision )
      }
    });
    return precisions;
  }

  function resetPrecision (  ){
    this.setState( 'precision' , getPrimaryPrecision( this.getProp('precision') ) );
  }

  function isPrimaryPrecision( precision , newPrecision ){
    return ( newPrecision == getPrimaryPrecision ( precision ) );
  }
  function getNextPrecision( precision , newPrecision ){
    var allGrains = getAllPrecisions(precision),
      idx = Math.min( _.indexOf( allGrains , newPrecision) + 1 , allGrains.length );
    return ( idx == 0 ) ? getPrimaryPrecision( precision ) : allGrains[idx];
  }

  function change ( newDate ){
    var statePrecision = this.getState('precision'),
      precision = this.getProp('precision'),
      op = ( this.getProp('edge') == 'end' ) ? 'endOf' : 'startOf';
    if (isPrimaryPrecision( precision , statePrecision) ){
      this.trigger( 'change' , newDate[op]( statePrecision ) );
    }
    this.setState( 'date', newDate[op]( statePrecision ) );
    this.setState('precision' , getNextPrecision( precision , statePrecision ) );
  }

  // Constructor
  function CalendarDialogController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    this.watchView( 'selectDate' , _.bind( change, this ) );
    this.watchView( 'selectPrecision' , _.partial( this.setState , 'precision' ) );
    this.watchProp( 'date' , _.partial( this.setState, 'date' ) );
    this.watchProp( 'precision' , _.bind( resetPrecision, this ) );
    this.watchProp( 'isActive' , _.bind( resetPrecision , this ) );

  }


  // Public
  function model2viewModel ( state ,  props ){
    var formatterOpts = _.isFunction( props.calendarFormat ) ? props.calendarFormat :
        _.extend( {} , getDefaultFormats() , props.calendarFormat ),
      dateFormatter = new DateFormatter( formatterOpts );

    return {
      precision: state.precision,
      date: state.date,
      selectedDate: props.date,
      precisions: getPrecisionsModel( state.date , props.precision , _.bind( dateFormatter.format , dateFormatter ) ),
      max: props.max,
      min: props.min,
      calendarStart: props.calendarStart,
      calendarEnd: props.calendarEnd,
      calendarFormat: formatterOpts
    }
  }


  // Exports
  return BlockController.extend({
    constructor: CalendarDialogController ,
    model2viewModel: model2viewModel
  });

});