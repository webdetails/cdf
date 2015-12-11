define( [
  '../../../../../lib/jquery',
  'amd!../../../../../lib/underscore',
  '../../base/BaseView',
  '../PredefinedRange/PredefinedRangeBlock',
  '../CustomRange/CustomRangeBlock',
  './DateRangeSelectorViewTemplate',
  './DateRangeSelectorViewItemTemplate'
],function ( $ , _ , BaseView , PredefinedBlock , CustomRangeBlock , DateRangeSelectorViewTemplate , DateRangeSelectorViewItemTemplate ) {
  'use strict';

  // Private
  function bindToPage ( callback ) {

    function handler ( ev ){
      callback( ev );
    }
    function bind ( ){
      document.addEventListener('click', handler , true );
    }
    function unbind(){
      document.removeEventListener('click', handler , true );
    }

    bind();

    return unbind;
  }

  function select ( selectorKey ){
    this.trigger('select', selectorKey );
  }

  function createSelector ( type , opts ) {
    var selector = this.createNewChild( type , opts );
    this.listenTo( selector  , 'change' , _.partial( this.trigger , 'selectRange' ) );

    return selector;
  }
  function renderSelector ( viewModel, selectorModel , idx ){
    var $selector = $( DateRangeSelectorViewItemTemplate( selectorModel ) )
      .click( _.bind( select , this , selectorModel ) );

    var selectorBlock =
      ( idx && this.hasChild( idx ) ) ?  this.getChild( idx ) : createSelector.call( this, selectorModel.type ) ;
    if ( idx && !this.hasChild( idx ) ){
      this.setChild( idx , selectorBlock );
    }

    var selectorProps = $.extend({
      precision: viewModel['precision'],
      precisions: viewModel['precisions'],
      granularity: viewModel['granularity'],
      granularities: viewModel['granularities'],
      start: viewModel['start'],
      calendarEnd: viewModel['calendarEnd'],
      calendarStart: viewModel['calendarStart'],
      end:  viewModel['end'],
      max: viewModel['max'],
      min: viewModel['min'],
      labels: viewModel['labels'],
      isSelected: selectorModel.isSelected,
      calendarFormat: viewModel['calendarFormat'],
      dateFormat: viewModel['dateFormat'],
      foldDirection: viewModel['foldDirection']
    }, selectorModel );

    selectorBlock
      .mount( $selector )
      .update( selectorProps );

    return $selector;
  }

  function clickOnDisplay ( ) {
    this.trigger( 'clickOnDisplay' );
  }
  function apply (){
    this.trigger( 'apply' );
  }
  function cancel (){
    this.trigger( 'cancel' );
  }
  function clickOutside(){
    this.trigger( 'clickOutside' );
  }

  function getClickOutsideCallback ( ){
    var uniqueId = this.getViewId();

    function isInside ( ev ){
      return ( $(ev.target).parents('.date-range-selector-block').length > 0 ) && ( $(ev.target).parents('.' + uniqueId ).length > 0 );
    }

    function callback ( ev ){
      if (!isInside(ev)) {
        clickOutside.call(this);
      }
    }

    return _.bind( callback , this );
  }


  // Public
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    var typedSelectors = _.filter( viewModel['selectors'], function ( s ){ return !!s.type; } );
    if ( viewModel['isDropdownOpen'] ) {
      $(target).find('.selectors-body').append(
        _.map( typedSelectors , _.bind( renderSelector, this, viewModel ) )
      )
    }

    this.bindToViewport( getClickOutsideCallback.call(this) );
  }


  // Exports
  return BaseView.extend( {
    components: {
      'predefined': PredefinedBlock,
      'custom': CustomRangeBlock
    },
    events: {
      'click .range-display': clickOnDisplay,
      'click .apply-button': apply,
      'click .cancel-button': cancel
    },
    template: DateRangeSelectorViewTemplate,
    render: render
  } );

} );