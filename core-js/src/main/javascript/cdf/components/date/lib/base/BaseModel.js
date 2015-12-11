define([
	'amd!../../../../lib/underscore',
	'amd!../../../../lib/backbone',
	'./BaseEvents'
], function ( _  , Backbone , BaseEvents ) {
  'use strict';

  // Public
  function get ( attributeName ){
    return _.isEmpty( attributeName ) ? this.toJSON() : this.base.apply( this, arguments );
  }

  // Exports
  return BaseEvents.convert( Backbone.Model , {
    get: get
  } );

} );