define([
  'amd!../../../lib/underscore',
  '../../../lib/jquery',
  '../../../lib/moment',
  '../../UnmanagedComponent',
  '../../../Logger',
  '../lib/blocks/DateRangeSelector/DateRangeSelectorBlock',
  './DateRangeSelectorComponentDefaults'
], function(
  _,
  $,
  moment,
  UnmanagedComponent,
  Logger,
  DateRangeSelectorBlock,
  DateRangeSelectorComponentDefaults
) {
  'use strict';

  var ownDefaultProps = [ 'inputFormat' , 'inputParameters' ];

  // Static
  function getDefaultsRegistry ( ){
    return isOwnRegistry( arguments[0] ) ? DateRangeSelectorComponentDefaults : DateRangeSelectorBlock;
  }
  function isOwnRegistry( key ){
    return _.contains( ownDefaultProps , key );
  }


  function getDefaults ( ){
    var registry = getDefaultsRegistry( arguments[0]),
      accessor = isOwnRegistry( arguments[0] ) ? 'get' : 'getDefaults';
    return registry[accessor].apply( registry , arguments );
  }
  function setDefaults ( ){
    var registry = getDefaultsRegistry( arguments[0]),
      accessor = isOwnRegistry( arguments[0] ) ? 'set' : 'setDefaults';
    return registry[accessor].apply( registry , arguments );
  }

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

  function negate( predicate ){
    function negatedPredicate (){
      return !predicate.apply( this, arguments );
    }
    return _.bind( negatedPredicate , this );
  }


  function normalizeInputFormat( inputFormat ){
    return ( _.isString(inputFormat) || _.isFunction(inputFormat) ) ? inputFormat : getDefaults('inputFormat');
  }

  function update () {
    this.synchronous( _.bind( loadAndRender , this ) );
  }

  function loadAndRender (){
    updateCachedInput.call( this , getInputProps.call(this) );
    render.call( this );
  }

  function render ( ){
    getBlock.call( this )
      .mount( this.placeholder() )
      .update( getBlockProps.call( this ) );
  }

  function isValidInputParameters( params ){
    return ( _.isArray( params ) && !_.isEmpty( params ) )
  }

  function getInputParameters (){
    return isValidInputParameters( this._inputParameters ) ? this._inputParameters : getDefaults('inputParameters');
  }
  function setInputParameters ( params ){
    if ( isValidInputParameters( params ) ){
      this._inputParameters = params;
    }
  }

  function getFilteredInputParameters(){
    return _.filter( getInputParameters.call(this) , _.compose( negate(_.isEmpty ) , _.bind( getDashboardParamName , this ) ) );
  }

  function processChange ( range ){
    var newRange = formatRange.call( this , range );

    if ( _.isFunction( this.preChange ) ){
      newRange = this.preChange.call( this , range ) || range;
    }

    if ( !this.oneWayBinding ) {
      updateCachedInput.call(this, newRange);
      render.call(this);
    }

    var filteredRange = getFilteredInputParameters.call( this );
    _.each( filteredRange , _.bind( function ( paramKey , idx ) {
      setParameter.call( this , paramKey , newRange[paramKey] ,  idx == ( filteredRange.length - 1 ) );
    }, this ) );

    if (_.isFunction( this.postChange ) ){
      this.postChange.call( this , newRange );
    }
  }


  function getDashboardParamName ( paramName ){
    return ( _.isObject( this.dashboardParameterMap ) && _.isString( this.dashboardParameterMap[paramName] ) ) ? this.dashboardParameterMap[paramName] : "";
  }

  function getParameter ( paramName ){
    return this.dashboard.getParameterValue( getDashboardParamName.call( this , paramName) );
  }
  function setParameter ( paramName , value , isNotified ){
    var dashboardParamName = getDashboardParamName.call( this , paramName );
    if ( !_.isEmpty( dashboardParamName ) ){
      this.dashboard[ isNotified? 'fireChange' : 'setParameter']( dashboardParamName , value );
    }
  }
  function parseDate( date , format ){
    return _.isFunction( format ) ? format( false , date ) : moment( date , format );
  }
  function formatDate( date , format ){
    return _.isFunction( format ) ? format( true, date ) : moment( date ).format( format );
  }
  function parseRange ( range ){
    var newRange = {},
      format = getConfigurationProps.call(this)['inputFormat'];
    _.each( range , _.bind( function ( value , key ){
      newRange[key] = isDateParameter( key ) ? parseDate( value , format ) : value;
    }, this ) );
    return newRange;
  }
  function formatRange ( range ){
    var newRange = {},
      format = getConfigurationProps.call(this)['inputFormat'];
    _.each( range , _.bind( function ( value , key ){
      newRange[key] = isDateParameter( key ) ? formatDate( value , format ) : value;
    }, this) );
    return newRange;
  }
  function isDateParameter ( paramName ){
    return paramName == 'start' || paramName == 'end';
  }

  function getCachedInput (){
    return this._input;
  }

  function setCachedInput ( input ){
    this._input = input;
  }

  function updateCachedInput ( range ){
    setCachedInput.call( this , $.extend( {} , getCachedInput.call( this ) , range ) ) ;
  }

  function getInputProps(){
    var range = {};
    _.each( getInputParameters.call(this) , _.bind(function ( key ){
      range[key] = getParameter.call( this, key );
    }, this) );
    return range;
  }


  function normalizeSelectors( selectors , includeCustomRange ){
    var out = _.map( copy( selectors ) , function ( sel ){
      if ( _.isObject( sel ) ){
        sel.type =  sel.type || 'predefined' ;
      }
      return sel;
    });
    if ( includeCustomRange ){
      out.push( { value:'custom' } );
    }
    return out;
  }
  function normalizeDate ( date , parser ){
    return ( _.isEmpty( date ) || _.isFunction(date) ) ? date : parseDate( date , parser );
  }



  function getConfigurationProps(){
    var cd = this.componentDefinition || {},
        normalizedInputFormat = normalizeInputFormat( cd.inputFormat );
    return {
      rangeFormat: cd.rangeFormat,
      dateFormat: cd.dateFormat,
      calendarFormat: cd.calendarFormat,
      selectors: normalizeSelectors( cd.selectors , cd.includeCustomRange ),
      granularities: cd.granularities,
      precisions: cd.precisions,
      actionsPosition: cd.actionsPosition,
      max: normalizeDate( cd.max , normalizedInputFormat ),
      min: normalizeDate( cd.min , normalizedInputFormat ),
      calendarStart: normalizeDate( cd.calendarStart , normalizedInputFormat ),
      calendarEnd: normalizeDate( cd.calendarEnd , normalizedInputFormat ),
      labels: cd.labels,
      foldDirection: cd.foldDirection || getFoldDirection.call( this ),
      inputFormat: normalizedInputFormat
    };
  }

  function getBlockProps ( ){
    return $.extend( {} , getConfigurationProps.call( this ) , parseRange.call( this , getCachedInput.call( this ) ) );
  }

  function getBlock (){
    if ( !this._componentBlock ){
      setNewBlock.call( this );
    }
    return this._componentBlock;
  }
  function setNewBlock( ){
    setBlock.call( this , new DateRangeSelectorBlock() );
  }
  function setBlock ( block ){
    if ( this._componentBlock ){
      this.stopListening( this._componentBlock );
    }
    this._componentBlock = block;
    this.listenTo( block , 'change' , _.bind( processChange , this ) );
  }


  function getPositionInViewport (){
    return ( this.placeholder() && this.placeholder()[0] && this.placeholder()[0].getBoundingClientRect() );
  }
  function getViewportWidth (){
    return $(window).width();
  }

  function getFoldDirection ( ) {
    var position = getPositionInViewport.call(this),
      viewportWidth = getViewportWidth.call(this),
      leftMargin = position.left - position.width,
      rightMargin = viewportWidth - position.left - 2 * position.width;

    return ( leftMargin > 0 ) ? 'left' : ( rightMargin > 0 ) ? 'right' : 'down';
  }

  return UnmanagedComponent.extend({
    update: update,
    getParameter: getParameter,
    setParameter: setParameter,
    _getBlock: getBlock,
    _setBlock: setBlock,
    _setNewBlock: setNewBlock,
    getInputParameters: getInputParameters,
    setInputParameters: setInputParameters
  },{
    getDefaults: getDefaults,
    setDefaults: setDefaults
  });

});