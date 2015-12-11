define([
  'amd!../../../../lib/underscore',
  './BaseEvents'
], function ( _ , BaseEvents ){
  'use strict';

  // Constructor
  function BaseController ( models , views ){
    this.models = {};
    this.views = {};

    _.forEach( models , _.bind( this.setModel, this ) );
    _.forEach( views , _.bind( this.setView, this ));

  }

  // Public
  function setModel ( model , id ){
    this.models[id] = model;
  }
  function getModel ( id ){
    return this.models[id];
  }
  function getModelValue ( id , attributeName ){
    return this.getModel( id ).get( attributeName );
  }
  function setModelValue ( id , attributeName , value ){
    return this.getModel( id ).set( attributeName , value );
  }
  function watchModelValue ( id , attributeName , callback ){
    var eventName = _.isEmpty( attributeName )  ? 'change' : 'change:' + attributeName;
    return this.listenTo( this.getModel( id ) , eventName , _.bind( callback , this ) );
  }
  function setView ( view  , id ){
    this.views[id] = view;
  }
  function getView ( id ){
    return this.views[id];
  }
  function watchView ( id , event , callback ){
    return this.listenTo( this.getView( id ) , event , _.bind( callback , this ) );
  }

  // Exports
  return BaseEvents.extend( {
    constructor: BaseController,
    setModel: setModel,
    getModel: getModel,
    getModelValue: getModelValue,
    setModelValue: setModelValue,
    watchModelValue: watchModelValue,
    setView: setView ,
    getView: getView,
    watchView: watchView
  } );

} );