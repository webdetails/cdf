define([
  '../../base/BaseBlock',
  './DateRangeSelectorView',
  './DateRangeSelectorController',
  './DateRangeSelectorDefaults'
], function ( BaseBlock , DateRangeSelectorView , DateRangeSelectorController , DateRangeSelectorDefaults  ) {
  'use strict';

  // Static
  function getDefaults ( ){
    return DateRangeSelectorDefaults.get.apply( DateRangeSelectorDefaults , arguments );
  }
  function setDefaults ( ){
    return DateRangeSelectorDefaults.set.apply( DateRangeSelectorDefaults , arguments );
  }


  // Constructor
  function DateRangeSelectorBlock ( opts ){
    this.base( opts );

    this.setView( new DateRangeSelectorView( ) );
    this.setController( new DateRangeSelectorController( this.getStateModel() , this.getPropsModel() , this.getView() ) );

  }


  // Exports
  return BaseBlock.extend( {
    constructor: DateRangeSelectorBlock
  },{
    setDefaults: setDefaults,
    getDefaults: getDefaults
  } );

} );