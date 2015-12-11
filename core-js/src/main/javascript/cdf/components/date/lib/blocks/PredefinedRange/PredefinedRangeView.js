define([
  '../../base/BaseView',
  './PredefinedRangeViewTemplate'
], function ( BaseView , PredefinedRangeViewTemplate ) {
  'use strict';

  // Private
  function clickOnDisplay () {
    this.trigger( 'clickOnDisplay' );
  }

  // Exports
  return BaseView.extend( {
    events: {
      'click': clickOnDisplay
    },
    template: PredefinedRangeViewTemplate
  } );

} );