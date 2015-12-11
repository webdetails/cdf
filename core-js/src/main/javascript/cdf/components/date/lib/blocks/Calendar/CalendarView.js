define([
  '../../../../../lib/jquery',
  'amd!../../../../../lib/underscore',
  '../../base/BaseView',
  './CalendarViewRowTemplate',
  './CalendarViewItemTemplate',
  './CalendarViewFrameTemplate',
  './CalendarViewHeaderItemTemplate',
  './CalendarViewHeaderRowTemplate'
], function ( $ , _ , BaseView , CalendarViewRowTemplate , CalendarViewItemTemplate , CalendarViewFrameTemplate , CalendarViewHeaderItemTemplate , CalendarViewHeaderRowTemplate  ) {
  'use strict';

  // Private
  function selfOrDescendant( target , selector ){
    return $( target ).find( selector ).addBack( selector );
  }

  function periodicPartition( collection , period ){
    return _.groupBy( collection , function ( v, idx ){ return Math.floor( idx / ( period || idx || 1 ) ) } );
  }

  function renderFrame ( model ){
    var $frame = $( CalendarViewFrameTemplate ( model )),
      $body = selfOrDescendant( $frame , '.calendar-body'),
      $header = selfOrDescendant( $frame , '.calendar-header');
    $body.append( renderBody.call( this , { range: model.range , rowSize: model.rowSize } ) );
    $header.append( renderHeader.call( this, { range: model.headerRange , rowSize: model.rowSize } ) );

    return $frame;
  }

  function createItemsModel( items ){
    return { items: items };
  }

  function renderBody ( model ){
    return _.map( periodicPartition( model.range , model.rowSize ) , _.bind( _.compose( renderRow , createItemsModel ) , this ) );
  }

  function renderHeader( model ){
    return _.map( periodicPartition( model.range , model.rowSize ) , _.bind( _.compose( renderHeaderRow, createItemsModel ) , this ) );
  }

  function renderHeaderRow ( model ){
    var $row = $( CalendarViewHeaderRowTemplate( model ) ),
      $items = selfOrDescendant( $row , '.items' );

    $items.append( _.map( model.items, _.bind( renderHeaderItem , this ) ) );

    return $row;
  }

  function renderHeaderItem ( model ){
    return $( CalendarViewHeaderItemTemplate ( model ) );
  }

  function renderRow (  model ){
    var $row = $( CalendarViewRowTemplate( model ) ),
      $items = selfOrDescendant( $row , '.items' );

    $items.append( _.map( model.items, _.bind( renderItem , this ) ) );

    return $row;
  }

  function renderItem (  model ){
    var $item = $( CalendarViewItemTemplate( model ) );

    if ( !model.isDisabled ){
      $item.click( _.bind( selectDate , this , model.date.clone() ) );
    }

    return $item;
  }

  // Emmitted Events
  function selectDate ( date ){
    this.trigger( 'selectDate' , date );
  }

  // Public
  function render ( target , model ){
    return target.append( renderFrame.call( this , model ) );
  }

  // Exports
  return BaseView.extend( {
    render: render
  } );

} );