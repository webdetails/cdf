define([
  'amd!../../../../lib/underscore',
  './BaseController'
],function ( _ , BaseController ){
  'use strict';

  // Constructor
  function ComponentController ( stateModel , propsModel , view ){
    this.base(
      { state: stateModel , props: propsModel },
      { main: view }
    );

    // Create Bindings.
    this.watchState( '' , this.updateView  );
    this.watchProp( '' , this.updateView  );
  }

  // Public
  function model2viewModel ( state , props ){
    // Default Implementation of model -> viewModel transformation. Override as needed.
    return {
      state: state,
      props: props
    };
  }
  function updateView (  ){
    return this.getView('main')
      .update( this.model2viewModel( this.getState() , this.getProp() ) );
  }
  function watchView ( event , callback ){
    return this.base('main' , event , callback );
  }
  function getProp ( attribute ){
    return this.getModelValue( 'props' , attribute );
  }
  function watchProp ( attribute , callback ){
    return this.watchModelValue( 'props' , attribute , callback );
  }
  function getState ( attribute ){
    return this.getModelValue('state' , attribute );
  }
  function setState ( attribute , value ){
    return this.setModelValue('state' , attribute , value );
  }
  function watchState ( attribute , callback ){
    return this.watchModelValue( 'state' , attribute , callback );
  }
  function listenTo ( observed , eventName , callback ){
    var modifiedCallback = callback;

    if ( eventName.match( /^change:.*$/ ) ){
      var boundcallback = _.bind( callback , this );

      modifiedCallback = function ( model , value , options ){
        return boundcallback( value , options );
      };
    }

    return this.base( observed , eventName , modifiedCallback );
  }

  // Exports
  return BaseController.extend( {
    constructor: ComponentController ,
    model2viewModel: model2viewModel,
    updateView: updateView,
    watchView: watchView,
    getProp: getProp,
    watchProp: watchProp,
    getState: getState,
    setState: setState,
    watchState: watchState,
    listenTo: listenTo
  } );

} );