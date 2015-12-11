define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/jquery',
  '../../base/BaseView',
  '../Calendar/CalendarBlock',
  './CalendarDialogViewTemplate',
  './CalendarDialogViewPrecisionTemplate'
], function ( _ , $ , BaseView , CalendarBlock , CalendarDialogViewTemplate, CalendarDialogViewPrecisionTemplate ){
  'use strict';

  // Private
  function renderPrecision ( precisionModel , precisionKey ){
    return $( CalendarDialogViewPrecisionTemplate( precisionModel ) )
      .click( _.bind( selectPrecision , this , precisionKey ) );
  }
  function selectPrecision ( precision ){
    this.trigger('selectPrecision', precision );
  }
  function selectDate ( newDate ){
    this.trigger('selectDate' , newDate );
  }


  // Public
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    $(target).find('.precisions-container')
      .append( _.map( viewModel['precisions'] , _.bind( renderPrecision, this ) ) );

    if ( !this.hasChild( 'calendar' ) ){
      this.setChild( 'calendar' , this.createNewChild( 'calendar' ) );
      this.listenTo( this.getChild( 'calendar' ) , 'change' , _.bind( selectDate , this ) );
    }
    this.getChild( 'calendar' )
      .mount( $(target).find('.calendar-container') )
      .update({
        date: viewModel['date'],
        precision: viewModel['precision'],
        selectedDate: viewModel['selectedDate'],
        max: viewModel['max'],
        min: viewModel['min'],
        calendarStart: viewModel['calendarStart'],
        calendarEnd: viewModel['calendarEnd'],
        calendarFormat: viewModel['calendarFormat']
      });
  }


  // Exports
  return BaseView.extend({
    components: {
      'calendar': CalendarBlock
    },
    template: CalendarDialogViewTemplate,
    render: render
  });

});