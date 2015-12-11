define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/mustache',
  '../../../../../lib/moment',
  '../../base/BlockController',
  '../../utils/DateFormatter'
], function ( _ , Mustache , moment , BlockController , DateFormatter ){
  'use strict';

  // Static
  var defaultFormats = {
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
  function change ( newDate ){
    this.trigger( 'change' , newDate );
  }

  function generateRange ( date , selectedDate , min , max , start , end , precision , itemFormatter ){
    var current   = start.clone(),
      dates = [];

    while ( precision && current.isBefore( end ) ){
      dates.push( {
        date: current,
        label: itemFormatter( current , precision ),
        isSelected: current.isSame( selectedDate , precision ),
        isDisabled:
        ( min && current.isBefore( min , precision ) ) ||
        ( max && current.isAfter ( max , precision ) ),
        isCurrentPeriod: ( precision != 'day' ) || current.isSame( date , 'month' )
      } );

      current = current.clone();
      current.add( 1, precision );
    }

    return dates;
  }

  function getFormatterOpts( props ){
    return _.isFunction( props.calendarFormat ) ? props.calendarFormat :
      _.extend( {} , getDefaultFormats() , props.calendarFormat );
  }

  function getHeaderRange ( props ){
    var limits = getLimits( props ),
        formatter = new DateFormatter( getFormatterOpts( props ) ),
        rowSize = getRowSize( props ),
        start = limits.calendarStart,
        range = [];
    formatter = _.bind( formatter.format , formatter );

    if ( props.precision == 'day' ){
      range = _.map( _.range( rowSize ) , function( offset ){
        return {
          label: formatter( start.clone().add( offset , 'day' ) , 'dayOfWeek' )
        };
      });
    }

    return range;
  }

  function getRange( props ){
    var formatter = new DateFormatter( getFormatterOpts( props ) ),
        limits = getLimits( props );
    formatter = _.bind( formatter.format , formatter );

    return generateRange( props.date , props.selectedDate , props.min , props.max , limits.calendarStart , limits.calendarEnd , props.precision , formatter );
  }
  function getRowSize ( props ){
    var rowSizeMap = {
      'day': 7,
      'week': 2,
      'isoWeek': 2,
      'month': 3,
      'quarter': 2,
      'year': 3
    };
    return rowSizeMap[props.precision] || 7;
  }
  function getLimits( props ){
    var precisionsMap = {
        'day': [ 'month' , 'week' ],
        'week': ['year' , 'week' ],
        'isoWeek': ['year' , 'isoWeek' ],
        'month': ['year' , 'month' ], // month is a bit redundant here
        'quarter': ['year' , 'quarter' ],
        'year': ['year']
      },
      precisions = precisionsMap[props.precision] || precisionsMap['day'],
      limits = {};
    _.each( ['calendarStart' , 'calendarEnd' ] , function ( limit ){
      var defaultLimit = ( limit == 'calendarEnd' ) ? 'max' : 'min',
          reference = ( props.precision == 'year' ) ? ( props[limit] || props[defaultLimit]) : props.date;
      limits[limit] = ( _.partial( goToLimit  , limit , reference ) ).apply( this , precisions );
    });
    return limits;
  }
  function goToLimit ( limit , reference ){
    var op = ( limit == 'calendarEnd' ) ? 'endOf' : 'startOf',
      precisions = _.rest( arguments , 2 );
    return _.reduce( precisions , function( date , precision ){
      return date[op](precision);
    }, moment( reference ).clone() );
  }


  // Constructor
  function CalendarController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    // Create Bindings
    this.watchView ( 'selectDate' , _.bind( change, this ) );
  }


  // Public
  function model2viewModel ( state , props ){
    return {
      headerRange: getHeaderRange( props ),
      range: getRange( props ) ,
      rowSize: getRowSize( props )
    };
  }


  // Exports
  return BlockController.extend( {
    constructor: CalendarController ,
    model2viewModel: model2viewModel
  } );

} );