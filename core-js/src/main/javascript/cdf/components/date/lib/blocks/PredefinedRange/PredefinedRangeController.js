define([
  'amd!../../../../../lib/underscore',
  '../../../../../lib/moment',
  '../../base/BlockController'
], function ( _ , moment , BlockController ){
  'use strict';

  // Constructor
  function PredefinedRangeController ( stateModel , propsModel , view ){
    this.base(  stateModel , propsModel , view );

    // Create Bindings
    this.watchView( 'clickOnDisplay' , _.bind( change, this ) );

  }

  // Public
  function model2viewModel ( state , props ){
    return { label: props.label };
  }
  function change (){
    var start = this.getProp('start'),
      end = this.getProp('end'),
      precision = this.getProp('precision');
    start = moment.isMoment( start ) && start.clone();
    end = moment.isMoment( end ) && end.clone();
    this.trigger( 'change' , this.getProp('getRange')( start ,  end ,  precision ) );
  }


  // Exports
  return BlockController.extend( {
    constructor: PredefinedRangeController,
    model2viewModel: model2viewModel
  } );

} );