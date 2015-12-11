define([
  '../../../../../lib/moment',
  '../../../../../lib/jquery',
  'amd!../../../../../lib/underscore',
  '../../utils/RangeFormatter',
  '../../base/BlockController',
  './DateRangeSelectorDefaults'
], function ( moment , $ , _ , RangeFormatter , BlockController, DateRangeSelectorDefaults ){
  'use strict';

  // Static
  function getDefaults ( ){
    return DateRangeSelectorDefaults.get.apply( DateRangeSelectorDefaults , arguments );
  }
  function setDefaults ( ){
    return DateRangeSelectorDefaults.set.apply( DateRangeSelectorDefaults , arguments );
  }


  // Private
  function copy( collection ){
    var out;
    if ( !_.isObject( collection ) ){
      out = collection;
    } else {
      var emptyCollection = _.isArray( collection ) ? [] : {};
      out = $.extend( true , emptyCollection , collection );
    }
    return out;
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

  function getRangeAttributes (){
    return [ 'start' , 'end' , 'precision' , 'granularity' ];
  }

  function getBackedAttributes (){
    return _.union( getRangeAttributes() , [ 'selection' ] );
  }

  function getRangeFromModel( model ){
    return _.pick( model, getRangeAttributes() );
  }

  function getBackedFromModel( model ){
    return _.pick( model, getBackedAttributes() );
  }

  function getLabelsModel( labels ){
    return $.extend( {} , getDefaults('labels') , labels );
  }


  function getItemModel( collectionId , cfg , idKey ){
    var out,
      preset = getDefaults (  collectionId ) || {};
    if ( _.isString(cfg) && !_.isEmpty(preset[cfg]) ){
      out = preset[cfg] || {};
    } else if ( _.isObject( cfg ) && !_.isEmpty(cfg) ){
      out = $.extend( {} , preset[ cfg[ idKey || 'value'] ] , cfg );
    } else {
      out = null;
    }
    if (_.isObject(out) ) {
      out.label = _.isEmpty( out.label ) ? out.value : out.label;
    }
    return out;
  }


  function isValidPrecisionsType ( cfg ){
    return ( ( _.isString(cfg) || _.isArray(cfg) ) && !_.isEmpty(cfg) );
  }
  function normalizePrecisionsConfig ( cfg ){
    var precisions = isValidPrecisionsType(cfg) ? cfg : getDefaults('precisions');
    return _.isString( precisions ) ? precisions.split(',') : precisions;
  }
  function getPrecisionModel ( cfg , idKey ){
    return getItemModel( 'precisionPresets' , cfg , idKey );
  }
  function getPrecisionsModel ( config ){
    return _.map( normalizePrecisionsConfig( config ) , getPrecisionModel );
  }



  function isValidSelectorsType ( cfg ){
    return ( !_.isEmpty(cfg) && _.isArray(cfg) );
  }
  function normalizeSelectorsConfig ( cfg ){
    return isValidSelectorsType(cfg) ? cfg : getDefaults('selectors');
  }
  function getSelectorModel ( idKey , cfg ){
    return getItemModel( 'selectorPresets' , cfg , idKey );
  }
  function getSelectorsModel ( config ){
    return _.filter( _.map( normalizeSelectorsConfig( config ) , _.partial( getSelectorModel , 'value') ) , isValidSelectorModel );
  }
  function isValidSelectorModel ( model ){
    return ( model.type == 'predefined' && _.isFunction( model.getRange ) ) ||
      ( model.type == 'custom' ) ||
      _.isFunction ( model.type );
  }

  function getCollectionViewModel( collection , isSelected ){
    var viewModel = copy(collection);
    _.forEach( viewModel , function ( el ){
      el.isSelected = isSelected( el );
    });
    return viewModel;
  }


  function isValidGranularitiesType ( cfg ){
    return ( ( _.isString(cfg) || _.isArray(cfg) ) && !_.isEmpty(cfg) );
  }
  function normalizeGranularitiesConfig ( cfg ){
    var grains = isValidGranularitiesType(cfg) ? cfg : getDefaults('granularities');
    return  _.isString( grains ) ? grains.split(',') : grains;
  }
  function getGranularityModel ( idKey , cfg ){
    return getItemModel( 'granularityPresets' , cfg , idKey );
  }
  function getGranularitiesModel ( config ){
    return _.filter( _.map( normalizeGranularitiesConfig( config ) , _.partial( getGranularityModel , 'value' ) ) , isValidGranularityModel );
  }
  function isValidGranularityModel ( model ){
    return !_.isEmpty( model.value );
  }
  function filterGranularities ( start , end , precision , granularities , granularityValidator ){
    var out;
    if ( moment.isMoment( start ) && moment.isMoment( end ) ) {
      var _start = start.clone(),
        _end = end.clone();
      out =  _.filter(granularities, function (grain) {
        return granularityValidator( grain.value , _start, _end, precision );
      });
    } else {
      out = [];
    }
    return out;
  }
  function isSelected ( selection , selector){
    return selection &&  selector.value == selection;
  }


  function isValidGranularityValidatorType ( cfg ){
    return _.isFunction( cfg ) || _.isNumber( cfg );
  }
  function getBoundedGranularityValidator ( min , max ){

    function granularityValidator ( grain , start , end ){
      var diff = end.diff( start , grain );
      return ( diff >= min ) && ( diff <= max );
    }

    return granularityValidator;
  }
  function normalizeGranularityValidatorConfig ( cfg ){
    var validator = isValidGranularityValidatorType ( cfg ) ? cfg : getDefaults('granularityValidator');
    return _.isFunction ( validator ) ? validator : getBoundedGranularityValidator( 0 , validator );
  }
  function getGranularityValidatorModel ( cfg ){
    return normalizeGranularityValidatorConfig( cfg );
  }



  function hasRangeChanged( state , props ){
    var stateRange = getRangeFromModel( state ),
      propsRange = getRangeFromModel( props );
    return (
      ( !_.isEmpty( propsRange.granularity ) && ( stateRange.granularity !== propsRange.granularity ) ) ||
      ( !_.isEmpty( propsRange.precision ) && ( stateRange.precision !== propsRange.precision ) ) ||
      ( !_.isEmpty( propsRange.start ) && !moment( propsRange.start ).isSame( stateRange.start , 'day' ) ) ||
      ( !_.isEmpty( propsRange.end ) && !moment( propsRange.end ).isSame( stateRange.end , 'day' ) )
    );
  }
  function validateSelector ( ){
    var selectors = getSelectorsModel( this.getProp('selectors') ),
      firstSelector = _.first( selectors );

    if ( !_.find( selectors , _.partial( isSelected , this.getState('selection') ) ) && firstSelector ) {
      select.call( this, firstSelector );
    }
  }

  function restoreSelection (){
    this.setState( this.getState('backup') );
  }
  function getRangeProps (){
    return getRangeFromModel( this.getProp() );
  }
  function getRangeState(){
    return getRangeFromModel( this.getState() );

  }
  function normalizeRangeState( range ){
    var normalizedRange = {};
    _.each( range , function ( value , key ){
      normalizedRange[key] = isDateProp(key) ? normalizeDate( value ) : value;
    } );
    return normalizedRange;
  }
  function normalizeDate( date ){
    return moment.isMoment( date ) ? date : moment( date );
  }
  function normalizePrecision ( precision ){
    return _.isString( precision ) ? precision : 'day';
  }

  function setRangeState( newRange ){
    this.setState( getRangeFromModel( newRange ) );
  }
  function toggleDropdown ( value ){
    var newValue = _.isUndefined( value ) ? !this.getState( 'isDropdownOpen' ) : value;
    if ( !newValue ){
      restoreSelection.call( this );
    } else {
      loadSelection.call( this );
    }
    this.setState( 'isDropdownOpen' , newValue );
  }
  function loadSelection (){
    this.setState( 'backup' , getBackedFromModel( this.getState() ) );
    updateRangeState.call( this , normalizeRangeState( getRangeProps.call( this ) ) );
    validateSelector.call( this );
  }
  function isDateProp ( prop ){
    return _.contains( ['start' , 'end'] , prop );
  }

  function notifyChange (){
    this.trigger( 'change' , getRangeState.call( this ) );
  }
  function cancelAndClose (){
    restoreSelection.call( this );
    this.setState( 'isDropdownOpen' , false );
  }
  function applyAndClose(){
    notifyChange.call( this );
    this.setState( 'isDropdownOpen' , false );
  }
  function select ( activeSelector ){
    this.setState('selection' , activeSelector['value'] );
  }
  function validateNewRangeState ( newRange ){
    var range = $.extend({}, getRangeState.call(this), newRange),
      precisions = getPrecisionsModel( this.getProp('precisions') ),
      min = normalizeLimit( 'min' , this.getProp('min') ),
      max = normalizeLimit( 'max' , this.getProp('max') ),
      newPrecision = ( _.findWhere( precisions , { value: range.precision } ) || _.first( precisions ) ).value,
      newStart = limitDate( range.start , min , max ).clone().startOf( newPrecision ),
      newEnd = limitDate( range.end , min , max ).clone().endOf( newPrecision),
      granularities = getGranularitiesModel( this.getProp('granularities') ),
      granularityValidator = getGranularityValidatorModel( this.getProp('granularityValidator') ),
      filteredGranularities = filterGranularities( newStart , newEnd , newPrecision , granularities , granularityValidator ),
      newGranularity = (_.findWhere( filteredGranularities , { value: range.granularity } ) || _.first( granularities) );
    newGranularity = _.isObject( newGranularity ) && newGranularity.value;
    return {
      start: newStart,
      end: newEnd,
      precision: newPrecision,
      granularity: newGranularity
    };
  }
  function updateRangeState ( newRange ){
    setRangeState.call( this , validateNewRangeState.call( this , newRange ) );
  }

  function limitDate ( date , min , max ){
    var newDate = normalizeDate( date );
    if ( moment.isMoment( max ) ){
      newDate = moment.min( newDate , max );
    }
    if ( moment.isMoment( min ) ){
      newDate = moment.max( newDate , min );
    }
    return newDate;
  }

  function normalizeFormat( propsFormat ,  defaultsFormat ){
    return _.isFunction( propsFormat ) ? propsFormat : _.extend( {} , defaultsFormat , propsFormat );
  }


  // Constructor
  function DateRangeSelectorController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    // Create Bindings

    this.watchView( 'clickOutside'   , _.bind( toggleDropdown , this , false ) );
    this.watchView( 'clickOnDisplay' , _.bind( toggleDropdown , this ) );
    this.watchView( 'selectRange' , _.bind( updateRangeState, this ) );
    this.watchView( 'cancel' , _.bind( cancelAndClose, this ) );
    this.watchView( 'apply' , _.bind( applyAndClose, this ) );
    this.watchView( 'select' , _.bind( select , this ) );
  }


  // Public
  function model2viewModel ( state , props ){
    var rangeFormatterOpts = normalizeFormat( props.rangeFormat , getDefaults('rangeFormat') ),
      formatter = new RangeFormatter( rangeFormatterOpts );

    return _.extend( getRangeFromModel( state ) , {
      rangeDisplay: formatter.format( normalizeDate( props.start ) , normalizeDate( props.end ) , normalizePrecision( props.precision ) ),
      calendarFormat: normalizeFormat( props.calendarFormat , getDefaults('calendarFormat') ),
      dateFormat: normalizeFormat( props.dateFormat , getDefaults('dateFormat') ),
      selectors: getCollectionViewModel( getSelectorsModel( props.selectors ) , _.partial( isSelected , state.selection ) ) ,
      isDropdownOpen: state.isDropdownOpen,
      areActionsOnTop: props.actionsPosition == 'top',
      hasRangeChanged: hasRangeChanged( state , props ),
      max: normalizeLimit( 'max' , props.max ),
      min: normalizeLimit( 'min' , props.min ),
      calendarStart: normalizeLimit( 'calendarStart' , props.calendarStart),
      calendarEnd: normalizeLimit( 'calendarEnd' , props.calendarEnd),
      precisions: getPrecisionsModel( props.precisions ),
      granularities: filterGranularities( state.start , state.end , state.precision , getGranularitiesModel( props.granularities ) , getGranularityValidatorModel( props.granularityValidator ) ),
      labels: getLabelsModel( props.labels ),
      foldDirection: props.foldDirection
    });
  }


  // Exports
  return BlockController.extend( {
    constructor: DateRangeSelectorController ,
    model2viewModel: model2viewModel
  }, {
    setDefaults: setDefaults,
    getDefaults: getDefaults
  });

} );