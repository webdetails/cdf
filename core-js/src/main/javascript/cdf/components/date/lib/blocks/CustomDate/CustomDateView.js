define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/jquery',
  '../../base/BaseView',
  '../CalendarDialog/CalendarDialogBlock',
  './CustomDateViewTemplate'
], function ( _ , $ , BaseView , CalendarDialogBlock , CustomDateViewTemplate ){
  'use strict';

  // Private
  function clickOnDisplay ( ) {
    this.trigger( 'clickOnDisplay' );
  }
  function clickOutside ( ){
    this.trigger( 'clickOutside' );
  }
  function selectDate ( newDate ){
    this.trigger('selectDate' , newDate );
  }
  function getClickOutsideCallback ( ){
    var uniqueId = this.getViewId();

    function isInside ( ev ){
      return ( $(ev.target).parents('.custom-date-block').length > 0 ) && ( $(ev.target).parents('.' + uniqueId ).length > 0 );
    }

    function callback ( ev ){
      if (!isInside(ev)) {
        clickOutside.call(this);
      }
    }

    return _.bind( callback , this );
  }


  // Public
  function setElement (){
    this.base.apply( this, arguments );
  }
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    if ( viewModel['isDialogOpen'] ){
      var calendar = this.createNewChild( 'calendarDialog' );
      this.listenTo( calendar , 'change', _.bind( selectDate, this ) );
      calendar
        .mount( $(target).find('.calendar-dialog') )
        .update( {
          date: viewModel['date'],
          max: viewModel['max'],
          min: viewModel['min'],
          calendarStart: viewModel['calendarStart'],
          calendarEnd: viewModel['calendarEnd'],
          edge: viewModel['edge'],
          precision: viewModel['precision'],
          calendarFormat: viewModel['calendarFormat']
        });
    }

    this.bindToViewport( getClickOutsideCallback.call( this ) );

  }


  // Exports
  return BaseView.extend({
    components: {
      'calendarDialog': CalendarDialogBlock
    },
    events:{
      'click .date-display': clickOnDisplay
    },
    template: CustomDateViewTemplate,
    setElement: setElement ,
    render: render
  });

});