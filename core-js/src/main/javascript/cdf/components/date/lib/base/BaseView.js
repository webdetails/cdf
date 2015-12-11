define([
  'amd!../../../../lib/underscore',
  '../../../../lib/jquery',
  '../../../../lib/mustache',
  'amd!../../../../lib/backbone',
  './BaseEvents',
  './BaseModel'
], function ( _ , $ , Mustache , Backbone , BaseEvents , BaseModel ) {
  'use strict';

  // Private
  function getDefaultRenderer ( template  ){
    return _.partial( Mustache.render ,  template );
  }
  function getNormalizedRenderer( template ){
    return _.isFunction ( template ) ? template : getDefaultRenderer( template );
  }

  // Constructor
  function BaseView ( config ) {
    this.children = {};
    this.hasTooltips = _.isUndefined( config ) || _.isUndefined( config.hasTooltips ) || config.hasTooltips;
    this.base.apply( this, arguments );
    this.setModel ( new BaseModel() );
  }


  // Public
  function bindToViewport ( callback ) {

    function handler ( ev ){
      callback( ev );
    }
    function bind ( ){
      document.addEventListener('click', handler , true );
    }
    function unbind(){
      document.removeEventListener('click', handler , true );
    }

    if ( _.isFunction(this.unbindFromViewport) ) {
      this.unbindFromViewport();
    }
    bind();
    this.unbindFromViewport = unbind;

    return unbind;
  }

  function getViewId (){
    return this.cid;
  }
  function setModel ( model ){
    this.model = model;
  }
  function getModel (){
    return this.model;
  }
  function getElement (){
    return this.$el;
  }
  function setCachedContents ( contents ){
    this.cachedContents = contents;
  }
  function getCachedContents (){
    return this.cachedContents;
  }
  function update ( model ) {
    if ( _.isObject( model ) ) {
      this.getModel().set( model );
    }
    if ( this.getCachedContents() ){
      this.getCachedContents().detach();
    }
    // Using .hasChanged instead of binding a callback to synchronize.
    if ( this.getModel().hasChanged() ){
      this.render( this.getElement() , this.getModel().toJSON() );
    } else {
      this.getElement().empty().append( this.getCachedContents() );
    }

    this.setCachedContents( this.getElement().contents() );

    return this.getElement();
  }
  function mount( node ){
    this.setElement( node );
    this.update();
  }
  function render ( target , model ){
    target.html( this.renderTemplate( model ) );
    addViewClass.call( this, target );
  }
  function addViewClass( target ){
    target.children().addClass( getViewId.call(this) );
  }
  function renderTemplate ( data ){
    return getNormalizedRenderer( this.template )( data );
  }
  function hasChild ( key ){
    return !!this.children[key];
  }
  function getChild ( key ){
    return this.children[key];
  }
  function setChild ( key , child ){
    this.children[key] = child;
  }
  function setBlocks ( typesMap ){
    this.components = _.isObject( typesMap ) ? typesMap : {};
  }
  function getBlocks ( typeKey ){
    return _.isUndefined( typeKey ) ? this.components : this.components[typeKey];
  }
  function createNewChild ( type , opts ){
    var ChildClass = _.isFunction( type ) ? type : getBlocks.call( this , type );
    return ( _.isFunction(ChildClass) ? new ChildClass(opts) : null );
  }


  // Exports
  return BaseEvents.convert( Backbone.View ,{
    constructor: BaseView,
    setModel: setModel,
    getModel: getModel,
    getElement: getElement,
    getViewId: getViewId,
    setCachedContents: setCachedContents,
    getCachedContents: getCachedContents,
    update: update,
    mount: mount,
    render: render,
    renderTemplate: renderTemplate,
    hasChild: hasChild,
    getChild: getChild,
    setChild: setChild,
    createNewChild: createNewChild,
    setBlocks: setBlocks,
    getBlocks: getBlocks,
    bindToViewport: bindToViewport
  } );

} );