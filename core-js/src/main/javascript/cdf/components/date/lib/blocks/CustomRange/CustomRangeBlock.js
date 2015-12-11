define([
  '../../base/BaseBlock',
  './CustomRangeView',
  './CustomRangeController'
], function ( BaseBlock , CustomRangeView , CustomRangeController ) {
  'use strict';

  // Constructor
  function CustomRangeBlock ( opts ){
    this.base( opts );

    this.setView( new CustomRangeView( ) );
    this.setController( new CustomRangeController( this.getStateModel() , this.getPropsModel() , this.getView() ) );

  }

  // Exports
  return BaseBlock.extend( {
    constructor: CustomRangeBlock
  } );

} );