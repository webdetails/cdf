define([
  '../../base/BaseBlock',
  './CustomDateView',
  './CustomDateController',
  './CustomDateDefaults'
], function ( BaseBlock , CustomDateView , CustomDateController , CustomDateDefaults ) {
  'use strict';

  // Static
  function getDefaults ( ){
    return CustomDateDefaults.get.apply( CustomDateDefaults , arguments );
  }
  function setDefaults ( ){
    return CustomDateDefaults.set.apply( CustomDateDefaults , arguments );
  }

  // Constructor
  function CustomDateBlock ( opts ){
    this.base( opts );

    this.setView( new CustomDateView( ) );
    this.setController( new CustomDateController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CustomDateBlock
  },{
    setDefaults: setDefaults,
    getDefaults: getDefaults
  } );

} );
