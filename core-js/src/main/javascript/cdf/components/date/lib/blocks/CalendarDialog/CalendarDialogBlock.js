define([
  '../../base/BaseBlock',
  './CalendarDialogView',
  './CalendarDialogController'
], function ( BaseBlock , CalendarDialogView , CalendarDialogController ) {
  'use strict';

  // Constructor
  function CalendarDialogBlock ( opts ){
    this.base( opts );

    this.setView( new CalendarDialogView(  ) );
    this.setController( new CalendarDialogController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CalendarDialogBlock
  } );

} );