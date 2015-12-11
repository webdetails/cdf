define( [
    'amd!../../../../../lib/underscore',
    '../../../../../lib/moment',
    '../../base/BaseBlock',
    './CalendarView',
    './CalendarController'
], function ( _ , moment , BaseBlock , CalendarView , CalendarController ) {
  'use strict';

  // Constructor
  function CalendarBlock ( opts ){
    this.base( opts );

    this.setView( new CalendarView( ) );
    this.setController( new CalendarController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CalendarBlock
  } );

} );