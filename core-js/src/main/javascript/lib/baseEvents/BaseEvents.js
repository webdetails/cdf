/* jshint devel:true */

define([
  'amd!cdf/lib/underscore',
  'amd!cdf/lib/backbone',
  'cdf/lib/Base'
], function (_, Backbone, Base) {

  var rest = _.rest;

  function extendClass(TargetClass) {
    return Base.extend.apply(TargetClass, rest(arguments));
  }

  function addSelfExtend(TargetClass) {
    return extendClass(TargetClass, {}, {
      extend: Base.extend
    });
  }

  function addEvents(TargetClass) {
    return extendClass(TargetClass, Backbone.Events);
  }

  function convertClass(TargetClass) {
    return extendClass(addEvents(addSelfExtend(TargetClass)), arguments[1], arguments[2]);
  }

  // BaseEvents: returns Base.js modification that includes Backbone.Events.
  //   Also has several static helpers to augment constructors with .extend
  //   and events functionality.
  var BaseEvents = convertClass(Base);

  BaseEvents.extendClass = extendClass;
  BaseEvents.convertClass = convertClass;
  BaseEvents.extendWithEvents = convertClass;

  return BaseEvents;
});
