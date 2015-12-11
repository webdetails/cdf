define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/jquery',
  '../../base/BaseView',
  '../CustomDate/CustomDateBlock',
  './CustomRangeViewTemplate',
  './CustomRangeViewPrecisionTemplate',
  './CustomRangeViewGranularityTemplate'
], function ( _ , $ , BaseView , CustomDateBlock , CustomRangeViewTemplate, CustomRangeViewPrecisionTemplate, CustomRangeViewGranularityTemplate ) {
  'use strict';

  // Private
  function clickOnDisplay (){
    this.trigger('clickOnDisplay');
  }
  function renderPrecision ( precisionModel ){
    return $( CustomRangeViewPrecisionTemplate ( precisionModel ) )
      .click( _.bind( selectPrecision , this , precisionModel.value ) );
  }
  function renderGranularity ( granularityModel ){
    return $( CustomRangeViewGranularityTemplate ( granularityModel ) )
      .click( _.bind( selectGranularity , this , granularityModel.value ) );
  }
  function selectStart ( newStart ){
    this.trigger('selectRange' , { start: newStart } );
  }
  function selectEnd ( newEnd ){
    this.trigger('selectRange' , { end: newEnd } );
  }
  function selectPrecision ( newPrecision ){
    this.trigger('selectRange' , { precision: newPrecision } );
  }
  function selectGranularity ( newGranularity ){
    this.trigger('selectRange' , { granularity: newGranularity } );
  }
  function clickOnGranularitiesDisplay (){
    this.trigger('clickOnGranularitiesDisplay');
  }
  function clickOutsideGranularities (){
    this.trigger('clickOutsideGranularities');
  }
  function getClickOutsideCallback ( ){
    var uniqueId = this.getViewId();

    function isInside ( ev ){
      return ( $(ev.target).parents('.granularities-body').length > 0 ) && ( $(ev.target).parents('.' + uniqueId ).length > 0 );
    }

    function callback ( ev ){
      if (!isInside(ev)) {
        clickOutsideGranularities.call(this);
      }
    }

    return _.bind( callback , this );
  }


  // Public
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    if ( viewModel['isOpen'] ) {

      $(target).find('.precisions-body')
        .append( _.map( viewModel['precisions'] , _.bind( renderPrecision, this ) ) );

      if ( !this.hasChild( 'startCalendarDialog' ) ){
        this.setChild( 'startCalendarDialog' , this.createNewChild('customDate') );
        this.listenTo( this.getChild( 'startCalendarDialog' ) , 'change', _.bind( selectStart, this ) );
      }
      this.getChild( 'startCalendarDialog' )
        .mount( $(target).find('.start-calendar-dialog') )
        .update( {
          date: viewModel['startConfig']['date'],
          max: viewModel['startConfig']['max'],
          min: viewModel['startConfig']['min'],
          calendarStart: viewModel['startConfig']['calendarStart'],
          calendarEnd: viewModel['startConfig']['calendarEnd'],
          precision: viewModel['precision'],
          edge: viewModel['startConfig']['edge'],
          dateFormat: viewModel['dateFormat'],
          calendarFormat: viewModel['calendarFormat'],
          foldDirection: viewModel['foldDirection']
        });

      if ( !this.hasChild( 'endCalendarDialog' ) ){
        this.setChild( 'endCalendarDialog' , this.createNewChild('customDate') );
        this.listenTo( this.getChild( 'endCalendarDialog' ) , 'change', _.bind( selectEnd, this ) );
      }
      this.getChild( 'endCalendarDialog' )
        .mount( $(target).find('.end-calendar-dialog') )
        .update( {
          date: viewModel['endConfig']['date'],
          max: viewModel['endConfig']['max'],
          min: viewModel['endConfig']['min'],
          calendarStart: viewModel['startConfig']['calendarStart'],
          calendarEnd: viewModel['startConfig']['calendarEnd'],
          precision: viewModel['precision'],
          edge: viewModel['endConfig']['edge'],
          dateFormat: viewModel['dateFormat'],
          calendarFormat: viewModel['calendarFormat'],
          foldDirection: viewModel['foldDirection']
        });

      $(target).find('.granularities-dropdown')
        .append( _.map( viewModel['granularities'] , _.bind( renderGranularity, this ) ) );

      this.bindToViewport( getClickOutsideCallback.call(this) );
    }
  }


  // Exports
  return BaseView.extend( {
    components: {
      'customDate': CustomDateBlock
    },
    events: {
      'click .custom-range-label' : clickOnDisplay,
      'click .granularities-display': clickOnGranularitiesDisplay
    },
    template: CustomRangeViewTemplate,
    render: render
  } );

} );