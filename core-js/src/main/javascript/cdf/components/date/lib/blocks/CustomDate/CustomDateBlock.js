define([
  '../../base/BaseBlock',
  './CustomDateView',
  './CustomDateController'
], function ( BaseBlock , CustomDateView , CustomDateController ) {
  'use strict';


  // Constructor
  function CustomDateBlock ( opts ){
    this.base( opts );

    this.setView( new CustomDateView( ) );
    this.setController( new CustomDateController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CustomDateBlock
  } );

} );