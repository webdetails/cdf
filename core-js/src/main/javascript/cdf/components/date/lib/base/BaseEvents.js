define([
  'amd!../../../../lib/underscore',
  '../../../../lib/Base',
  'amd!../../../../lib/backbone'
], function ( _ , Base , Backbone ) {
  'use strict';
  
  var Events = Backbone.Events;

  function noop (){}

  //--------------------------------//

  function extendClass ( TargetClass  ) {
    return Base.extend.apply( TargetClass, _.rest( arguments ) );
  }

  function addSelfExtend ( TargetClass ) {
    return extendClass( TargetClass, {}, { extend: Base.extend } );
  }

  function addEvents ( TargetClass ) {
    return extendClass( TargetClass , Events );
  }

  function convert ( TargetClass ) {
    return extendClass(
      addEvents( addSelfExtend( TargetClass ) ) ,
      arguments[ 1 ] ,
      arguments[ 2 ]
    );
  }

  // Returns an empty constructor augmented with Base.js inheritance and Backbone Events.
  var exports = convert( noop );

  //--------------------------------//

  exports.extendClass = extendClass;
  exports.convert = convert;

  return exports;

} );