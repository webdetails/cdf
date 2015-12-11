define([
  '../../base/BaseBlock',
  './PredefinedRangeView',
  './PredefinedRangeController'
], function ( BaseBlock , PredefinedRangeView , PredefinedRangeController ) {
  'use strict';

  // Constructor
  function PredefinedRangeBlock ( opts ){
    this.base( opts );

    this.setView( new PredefinedRangeView( ) );
    this.setController( new PredefinedRangeController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }

  // Exports
  return BaseBlock.extend( {
    constructor: PredefinedRangeBlock
  } );

} );