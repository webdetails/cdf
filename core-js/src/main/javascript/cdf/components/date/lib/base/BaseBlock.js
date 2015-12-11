define([
  'amd!../../../../lib/underscore',
  '../../../../lib/jquery',
  './BaseEvents',
  './BaseView',
  './BaseModel'
], function ( _ , $ , BaseEvents , BaseView , BaseModel  ) {
  'use strict';

  // Constructor
  function BaseBlock ( opts ) {
    var _opts = opts || {};

    this.base( _opts );

    // Set Props model
    this.setPropsModel( new BaseModel( _opts.props ) );
    // Set State model
    this.setStateModel( new BaseModel( _opts.state ) );
  }

  // Public
  function update ( newInput ){
    this.getPropsModel().set( newInput );
    this.trigger( 'update' , newInput );
    return this;
  }
  function render (){
    if ( this.getView() ){
      this.getView().render( );
    }
    this.trigger( 'render' , this );
    return this;
  }
  function mount ( node ){
    this.setMountNode( node );
    if ( this.getView() ){
      this.getView().mount( this.getMountNode() );
    }
    this.trigger( 'mount' , this );
    return this;
  }
  function setMountNode ( node ){
    if ( node ){
      this.mountNode = $(node);
    }
  }
  function getMountNode ( ){
    return this.mountNode;
  }
  function setView ( view ){
    this.view = view;
  }
  function getView (){
    return this.view;
  }
  function setController ( controller ){
    this.stopListening( this.controller );
    this.listenTo( controller , 'all', this.routeControllerEvent );
    this.controller = controller;
  }
  function getController (){
    return this.controller;
  }
  function routeControllerEvent  ( ){
    this.trigger.apply( this , arguments );
  }
  function setPropsModel ( props ){
    this.props = props;
  }
  function getPropsModel (){
    return this.props;
  }
  function setStateModel ( state ){
    this.state = state;
  }
  function getStateModel (){
    return this.state;
  }


  // Exports
  return BaseEvents.extend( {
    constructor: BaseBlock,
    update: update,
    render: render,
    mount: mount,
    setMountNode: setMountNode,
    getMountNode: getMountNode,
    setView: setView,
    getView: getView,
    setController: setController,
    getController: getController,
    routeControllerEvent: routeControllerEvent,
    setPropsModel: setPropsModel,
    getPropsModel: getPropsModel,
    setStateModel: setStateModel,
    getStateModel: getStateModel
  } );

} );