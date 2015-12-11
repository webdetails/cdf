define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/moment',
  '../../base/BlockController',
  '../../utils/DateFormatter',
  './CustomDateDefaults'
], function ( _ , moment , BlockController , DateFormatter , CustomDateDefaults ){
  'use strict';

  function getDefaults(){
    return CustomDateDefaults.get.apply( CustomDateDefaults, arguments);
  }
  function setDefaults(){
    return CustomDateDefaults.set.apply( CustomDateDefaults, arguments);
  }

  // Private
  function change ( newDate ){
    this.setState( 'isDialogOpen' , false );
    this.trigger( 'change' , newDate );
  }
  function toggleDialog ( value ){
    var newValue = _.isUndefined( value ) ? !this.getState( 'isDialogOpen' ) : value;
    this.setState( 'isDialogOpen' , newValue );
  }
  function normalizeFormat( propsFormat ,  defaultsFormat ){
    return _.isFunction( propsFormat ) ? propsFormat : _.extend( {} , defaultsFormat , propsFormat );
  }

  function normalizeLimit ( limitKey , date ){
    var limit = date || getDefaults( limitKey );
    if ( _.isFunction( limit ) ){
      limit = limit( moment() );
    }
    if ( !moment.isMoment( limit ) && !_.isEmpty( limit ) ){
      limit = moment( limit );
    }
    return limit;
  }
  function normalizePrecision( precision ){
    return _.isString( precision ) ? precision : getDefaults('precision');
  }
  function normalizeEdge( edge ){
    return _.contains( ['start' , 'end' ], edge ) ? edge : getDefaults('edge');
  }

  function getFoldClass( foldDirection ){
    return ( foldDirection == 'left' ) ? 'fold-left' : ( foldDirection == 'right' ) ? 'fold-right' : '';
  }


  // Constructor
  function CustomDateController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    this.watchView( 'selectDate' , _.bind( change, this ) );
    this.watchView( 'clickOnDisplay' , _.bind( toggleDialog, this ) );
    this.watchView( 'clickOutside'   , _.bind( toggleDialog , this , false ) );

  }


  // Public
  function model2viewModel ( state ,  props ){
    var formatOpts = normalizeFormat( props.dateFormat , getDefaults('dateFormat') ),
      formatter = new DateFormatter( formatOpts);
    return {
      precision: normalizePrecision( props.precision ),
      date: props.date,
      max: normalizeLimit( 'max' , props.max ),
      min: normalizeLimit( 'min' , props.min ),
      calendarStart: normalizeLimit( 'calendarStart' , props.calendarStart),
      calendarEnd: normalizeLimit( 'calendarEnd' , props.calendarEnd),
      edge: normalizeEdge( props.edge ),
      displayDate: formatter.format( props.date, props.precision ),
      isDialogOpen: state.isDialogOpen,
      calendarFormat: props.calendarFormat,
      foldClass: getFoldClass( props.foldDirection )
    }
  }

  // Exports
  return BlockController.extend({
    constructor: CustomDateController ,
    model2viewModel: model2viewModel
  },{
    getDefaults: getDefaults,
    setDefaults: setDefaults
  });

});