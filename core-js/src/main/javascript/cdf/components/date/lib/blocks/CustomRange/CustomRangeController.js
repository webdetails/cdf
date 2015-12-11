define([
  '../../../../../lib/moment',
  '../../../../../lib/jquery',
  'amd!../../../../../lib/underscore',
  '../../base/BlockController'
], function ( moment , $ , _ , BlockController ){
  'use strict';

  // Static
  var defaultLabels = {
    customRange: 'Custom Range',
    selectedPeriod: 'Selected Period:',
    startDate: 'Start Date:',
    endDate: 'End Date:',
    granularity: 'Granularity:'
  }
  function getDefaultLabels( ){
    return defaultLabels;
  }
  function setDefaultLabels( labels ){
    if (_.isObject(labels)){
      defaultLabels = labels;
    }
  }

  // Private
  function copy( collection ){
    var out;
    if ( !_.isObject( collection ) ){
      out = collection;
    } else {
      var emptyCollection = _.isArray( collection ) ? [] : {};
      out = $.extend( true , emptyCollection , collection );
    }
    return out;
  }

  function change ( newRange ){
    this.trigger('change' , newRange );
    toggleGranularity.call( this, false );
  }

  function toggleGranularity ( value ){
    var newValue = _.isBoolean( value ) ? value : !this.getState('isGranularitiesOpen');
    this.setState('isGranularitiesOpen' , newValue );
  }

  function filterMomentValues ( valuesArray ){
    return _.filter( valuesArray , moment.isMoment );
  }
  function getMax( ){
    return moment.max.apply( this , filterMomentValues( arguments ) );
  }
  function getMin( ){
    return moment.min.apply( this , filterMomentValues( arguments ) );
  }

  function getCollectionViewModel( collection , isSelected ){
    var viewModel = copy(collection);
    _.forEach( viewModel , function ( el ){
      el.isSelected = isSelected( el );
    });
    return viewModel;
  }

  function getLabelsModel( labels ){
    return $.extend( {} , getDefaultLabels() , labels );
  }

  function getFoldClass( foldDirection ){
    return ( foldDirection == 'left' ) ? 'fold-left' : ( foldDirection == 'right' ) ? 'fold-right' : '';
  }


  // Constructor
  function CustomRangeController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    // Create Bindings
    this.watchView( 'selectRange' , _.bind( change, this ) );
    this.watchView( 'clickOnGranularitiesDisplay' , _.bind( toggleGranularity , this ) );
    this.watchProp( 'isSelected' , _.bind( toggleGranularity , this , false ) );
    this.watchView( 'clickOutsideGranularities'   , _.bind( toggleGranularity , this , false ) );

  }


  // Public
  function model2viewModel ( state , props ){

    function isPrecisionSelected( p ){
      return p.value == props.precision;
    }
    function isGranularitySelected( g ){
      return g.value == props.granularity;
    }

    var granularities = getCollectionViewModel( props.granularities , isGranularitySelected ),
      selectedGranularities = _.filter( granularities , isGranularitySelected ),
      selectedGranularityDisplay = _.pluck( selectedGranularities , 'label' ).join(',');

    return {
      startConfig: {
        date: props.start,
        calendarEnd: props.calendarEnd || getMax( props.end , props.max ),
        calendarStart: props.calendarStart || getMin( props.start , props.min ),
        max: getMin( props.end , props.max ),
        min: props.min,
        edge: 'start'
      },
      endConfig: {
        date: props.end,
        calendarEnd: props.calendarEnd || getMax( props.end , props.max ),
        calendarStart: props.calendarStart || getMin( props.start , props.min ),
        min: getMax( props.start , props.min ),
        max: props.max,
        edge: 'end'
      },
      selectedGranularityDisplay: selectedGranularityDisplay,
      isGranularitiesOpen: state.isGranularitiesOpen,
      labels: getLabelsModel( props.labels ),
      precision: props.precision,
      precisions: getCollectionViewModel( props.precisions , isPrecisionSelected ),
      granularity: props.granularity,
      granularities: granularities,
      isOpen: props.isSelected,
      dateFormat: props.dateFormat,
      calendarFormat: props.calendarFormat,
      foldDirection: props.foldDirection,
      foldClass: getFoldClass( props.foldDirection )
    };
  }


  // Exports
  return BlockController.extend( {
    constructor: CustomRangeController ,
    model2viewModel: model2viewModel
  } );

} );