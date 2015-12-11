/* jshint devel:true */


window.wd = window.wd || {};
window.wd.dateRangeSelectorModules  = window.wd.dateRangeSelectorModules || {};


/***********************************************************************************************************************
 *
 * Base Generic Classes
 *
 **********************************************************************************************************************/

  // BaseEvents: returns Base.js modification that includes Backbone.Events.
  //   Also has several static helpers to augment constructors with .extend
  //   and events functionality.
window.wd.dateRangeSelectorModules.BaseEvents = ( function ( _ , Base , Backbone ) {
  //'use strict';
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

} )( _ , Base , Backbone );

/***********************************************************************************************************************
 *
 * Utils
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.BaseRegistry = (function ( _ , BaseEvents ){

  function rearg ( fn ){
    return function ( arg1 , arg2 ){
      fn.call(this , arg2 , arg1)
    };
  }

  function prepareDefault ( key ){
    if ( !_.isObject( this.defaults ) ){
      this.defaults = {};
    }
    if ( !_.isObject( this.defaults[key] ) ){
      this.defaults[key] = {};
    }
  }

  function getValue ( key ){
    prepareDefault.call( this , key );
    return this.defaults[key].value;
  }
  function setValue ( key , value ){
    prepareDefault.call( this , key );
    this.defaults[key].value = value;
  }
  function getSetter ( key ){
    prepareDefault.call( this , key );
    return  _.bind( this.defaults[key].set || _.identity, this ) ;
  }
  function setSetter ( key , fn ){
    prepareDefault.call( this, key );
    if (_.isFunction( fn ) ){
      this.defaults[key].set = fn;
    }
  }
  function getGetter ( key ){
    prepareDefault.call( this , key );
    return _.bind( this.defaults[key].get || _.identity, this ) ;
  }
  function setGetter ( key , fn ){
    prepareDefault.call( this, key );
    if (_.isFunction( fn ) ){
      this.defaults[key].get = fn;
    }
  }


  function setDefaults ( ) {
    ( ( arguments.length == 1 ) ? setMany : ( arguments.length > 1) ? setOne : _.noop ).apply( this , arguments );
  }
  function setMany( collection ){
    _.each( ( _.isObject(collection) && collection ) || {} , _.bind( rearg( setOne ), this ) );
  }
  function setOne( key , value ){
    if ( _.isString(key) || _.isNumber(key) ){
      setValue.call( this , key , getSetter.call( this , key )( value ) );
    }
  }

  function getDefaults ( key ){
    return ( arguments.length === 0 ) ? getAll.call(this) : getOne.call(this,key);
  }
  function getAll( ){
    var out = {};
    _.each( this.defaults , _.bind( function ( key ){
      out[key] = getOne.call( this , key );
    }, this ) );
    return out;
  }
  function getOne( key ){
    return ( _.isString(key) || _.isNumber(key) ) &&  getGetter.call( this , key )( getValue.call( this , key ) ) ;
  }

  function initOne ( key , cfg ){
    if ( _.isObject(cfg) ){
      if ( cfg.set ){ setSetter.call( this, key , cfg.set ) }
      if ( cfg.get ){ setGetter.call( this, key , cfg.get ) }
      if ( cfg.value ){ setOne.call( this, key , cfg.value ) }
    }
  }
  function initAll( config ) {
    _.each(config, _.bind(rearg(initOne), this));
  }


  function BaseRegistry ( config ){
    initAll.call( this , config );
  }

  return BaseEvents.extend({
    constructor: BaseRegistry,
    getDefaults: getDefaults,
    setDefaults: setDefaults
  });

})( _ , window.wd.dateRangeSelectorModules.BaseEvents );



window.wd.dateRangeSelectorModules.ExpressionEvaluator = ( function ( _ , BaseEvents ) {
  //'use strict';
  var _window = window;

  // Static
  var globalExceptions =  {
    Math: _window.Math
  };
  function setGlobalExceptions ( exceptions ){
    globalExceptions = exceptions;
  }
  function getGlobalExceptions(){
    return globalExceptions;
  }

  // Private
  function getFunctionBody( expression ){
    return "with(scope){ \n var something; \n return (" + expression + ");}";
  }
  function evaluateExpression ( evaluator , scope ){
    var newScope = _.extend( {} , getGlobalsObfuscator.call(this) , getGlobalExceptions(), getBaseScope.call(this) , scope );
    return evaluator.call( {} , newScope );
  }
  function getGlobalsObfuscator (){
    var obfuscator = {};
    for ( var prop in _window ){
      obfuscator[prop] = null;
    }
    return obfuscator;
  }

  function hasFunction ( expression ){
    return !!expression.match(/^.*[^a-zA-Z0-9]function(?=[^a-zA-Z0-9]).*$/g);
  }
  function hasNew ( expression ){
    return !!expression.match(/^.*[^a-zA-Z0-9]new(?=[^a-zA-Z0-9]).*$/g);
  }
  function validateExpression ( expression ){
    return _.isString( expression ) && !_.isEmpty( expression ) && !hasFunction(expression) && !hasNew(expression);
  }

  function setBaseScope ( baseScope ){
    this.baseScope = _.isObject( baseScope ) ? baseScope : {};
  }
  function getBaseScope(){
    return this.baseScope;
  }

  function getEvaluator( expression ){
    // TODO: Add error throw??
    if ( validateExpression( expression ) ){
      var evaluator =  new Function( "scope" , getFunctionBody(expression) );
      return _.bind( evaluateExpression , this, evaluator );
    } else {
      return undefined;
    }
  }

  function ExpressionEvaluator ( baseScope ){
    setBaseScope.call( this, baseScope );
  }

  return BaseEvents.extend( {
    constructor: ExpressionEvaluator,
    getEvaluator: getEvaluator
  },{
    getGlobalExceptions: getGlobalExceptions,
    setGlobalExceptions: setGlobalExceptions
  });

})( _ , window.wd.dateRangeSelectorModules.BaseEvents );


/***********************************************************************************************************************
 *
 * Range/Date Formatter
 *
 **********************************************************************************************************************/


window.wd.dateRangeSelectorModules.RangeFormatter = ( function ( BaseEvents, _  ){

  function getDefaultFormat ( grain ){
    var map = {
      day: 'YYYY-MM-DD',
      month: 'YYYY-MM',
      week: 'YYYY-[W]ww',
      isoWeek: 'YYYY-[W]ww',
      quarter: 'YYYY-[Q]Q',
      year: 'YYYY',
      dayOfWeek: 'ddd',
      _separator: ' - '
    };
    return map[grain];
  }

  function dateFormatter ( date , format ){
    return date.format( format );
  }

  function getSharedRegex () {
    return /(\{(.*?)\})/g;
  }
  function getTokensRegex (){
    return  /[{}]/g;
  }
  function getShortFormat ( start , end , format ){
    return _.reduce( format.match( getSharedRegex() ) , function ( memo , match ){
      var isShared = dateFormatter( start , match ) == dateFormatter( end , match );
      return memo.replace( isShared ? match : getTokensRegex() , "" );
    }, format );
  }
  function getLongFormat ( start , end, format ){
    return format.replace( getTokensRegex() , "" );
  }

  function rangeFormatter( start , end , format, particle ){
    var shortStart = dateFormatter( start , getShortFormat( start, end, format ) ),
      longStart = dateFormatter( start , getLongFormat( start, end, format )),
      longEnd = dateFormatter( end , getLongFormat( start, end, format) );
    return ( longStart == longEnd ) ? longStart : shortStart + particle + longEnd;
  }

  function defaultFormatter ( start , end , grain ){
    return rangeFormatter( start , end , getDefaultFormat(grain) || getDefaultFormat('day') );
  }


  // Public
  function format ( start , end, granularity ){
    var opts = this.getFormats();

    function formatter ( start , end , granularity ){
      var ft = _.isObject(opts) && opts[granularity],
        particle = opts['_separator'] || getDefaultFormat('_separator');
      return _.isFunction( ft ) ? ft( start , end , granularity ) :
        _.isString( ft )   ? rangeFormatter( start , end , ft , particle ) :
          defaultFormatter( start , end , granularity );
    }

    return ( _.isFunction( opts ) ? opts : formatter )( start , end , granularity );
  }
  function setFormats( formats ){
    this.formats = formats;
  }
  function getFormats(){
    return this.formats;
  }

  // Constructor
  function RangeFormatter ( formats ){
    this.setFormats( formats );
  }

  // Exports
  return BaseEvents.extend({
    constructor: RangeFormatter,
    setFormats: setFormats,
    getFormats: getFormats,
    format: format
  });

})( window.wd.dateRangeSelectorModules.BaseEvents , _  );


window.wd.dateRangeSelectorModules.DateFormatter = (function ( RangeFormatter ){
  //'use strict';

  // Public
  function format ( start , granularity ){
    return this.base.call( this, start, start, granularity );
  }

  //Exports
  return RangeFormatter.extend({
    format: format
  });

})( window.wd.dateRangeSelectorModules.RangeFormatter );







/***********************************************************************************************************************
 *
 * Base Blocks
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.BaseModel = ( function ( _ , BaseEvents , Backbone ) {
  //'use strict';

  // Public
  function get ( attributeName ){
    return _.isEmpty( attributeName ) ? this.toJSON() : this.base.apply( this, arguments );
  }

  // Exports
  return BaseEvents.convert( Backbone.Model , {
    get: get
  } );

} )( _ , window.wd.dateRangeSelectorModules.BaseEvents , Backbone );

window.wd.dateRangeSelectorModules.BaseController = ( function ( _ , BaseEvents ){
  //'use strict';

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

} )( _ , window.wd.dateRangeSelectorModules.BaseEvents );

window.wd.dateRangeSelectorModules.BlockController = ( function ( _ , BaseController ){
  //'use strict';

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

} )( _ , window.wd.dateRangeSelectorModules.BaseController );

window.wd.dateRangeSelectorModules.BaseView = ( function ( _ , $ , Mustache , BaseEvents , Backbone , BaseModel ) {
  //'use strict';

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

} )( _ , $ , Mustache , window.wd.dateRangeSelectorModules.BaseEvents , Backbone , window.wd.dateRangeSelectorModules.BaseModel );

window.wd.dateRangeSelectorModules.BaseBlock = ( function ( _ , BaseEvents , BaseView , BaseModel  ) {
  //'use strict';

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

} )( _ , window.wd.dateRangeSelectorModules.BaseEvents , window.wd.dateRangeSelectorModules.BaseView , window.wd.dateRangeSelectorModules.BaseModel );





/***********************************************************************************************************************
 *
 * Predefined Block
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.PredefinedRangeController = ( function ( $ , moment , BlockController ){
  //'use strict';

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

} )( $ , moment , window.wd.dateRangeSelectorModules.BlockController );


window.wd.dateRangeSelectorModules.PredefinedRangeViewTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="predefined-range-block range-label">' +
    '  <span>{{ label }}</span>' +
    '</div>';
  return _.partial( Mustache.render, template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.PredefinedRangeView = ( function ( BaseView , PredefinedRangeViewTemplate ) {
  //'use strict';

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

} )( window.wd.dateRangeSelectorModules.BaseView, window.wd.dateRangeSelectorModules.PredefinedRangeViewTemplate );


window.wd.dateRangeSelectorModules.PredefinedRangeBlock = ( function ( BaseBlock , PredefinedRangeView , PredefinedRangeController ) {
  //'use strict';

  // Constructor
  function PredefinedRangeBlock ( opts ){
    this.base( opts );

    this.setView( new PredefinedRangeView( ) );
    this.setController( new PredefinedRangeController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }

  // Exports
  return BaseBlock.extend( {
    constructor: PredefinedRangeBlock
  } );

} )( window.wd.dateRangeSelectorModules.BaseBlock , window.wd.dateRangeSelectorModules.PredefinedRangeView , window.wd.dateRangeSelectorModules.PredefinedRangeController );









/***********************************************************************************************************************
 *
 * Calendar
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.CalendarController = ( function ( BlockController , DateFormatter ){
  //'use strict';

  // Static
  var defaultFormats = {
    'day' : 'DD',
    'month': 'MMM',
    'week': function ( date ){
      var startMonth = date.startOf('week').format('MMM'),
        endMonth = date.endOf('week').format('MMM'),
        model = {
          week: date.format('[W]w'),
          range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
        },
        template = '{{week}} <span class="weak">({{range}})</span>';
      return Mustache.render( template, model );
    },
    'isoWeek': function ( date ){
      var startMonth = date.startOf('isoWeek').format('MMM'),
        endMonth = date.endOf('isoWeek').format('MMM'),
        model = {
          week: date.format('[W]W'),
          range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
        },
        template = '{{week}} <span class="weak">({{range}})</span>';
      return Mustache.render( template, model );
    },
    'quarter': '[Q]Q',
    'year': 'YYYY'
  };
  function getDefaultFormats (){
    return defaultFormats;
  }
  function setDefaultFormats ( formats ){
    if (_.isObject(formats)){
      defaultFormats = formats;
    }
  }


  // Private
  function change ( newDate ){
    this.trigger( 'change' , newDate );
  }

  function generateRange ( date , selectedDate , min , max , start , end , precision , itemFormatter ){
    var current   = start.clone(),
      dates = [];

    while ( precision && current.isBefore( end ) ){
      dates.push( {
        date: current,
        label: itemFormatter( current , precision ),
        isSelected: current.isSame( selectedDate , precision ),
        isDisabled:
        ( min && current.isBefore( min , precision ) ) ||
        ( max && current.isAfter ( max , precision ) ),
        isCurrentPeriod: ( precision != 'day' ) || current.isSame( date , 'month' )
      } );

      current = current.clone();
      current.add( 1, precision );
    }

    return dates;
  }

  function getFormatterOpts( props ){
    return _.isFunction( props.calendarFormat ) ? props.calendarFormat :
      _.extend( {} , getDefaultFormats() , props.calendarFormat );
  }

  function getHeaderRange ( props ){
    var limits = getLimits( props ),
      formatter = new DateFormatter( getFormatterOpts( props ) ),
      rowSize = getRowSize( props ),
      start = limits.calendarStart,
      range = [];
    formatter = _.bind( formatter.format , formatter );

    if ( props.precision == 'day' ){
      range = _.map( _.range( rowSize ) , function( offset ){
        return {
          label: formatter( start.clone().add( offset , 'day' ) , 'dayOfWeek' )
        };
      });
    }

    return range;
  }

  function getRange( props ){
    var formatter = new DateFormatter( getFormatterOpts( props ) ),
      limits = getLimits( props );
    formatter = _.bind( formatter.format , formatter );

    return generateRange( props.date , props.selectedDate , props.min , props.max , limits.calendarStart , limits.calendarEnd , props.precision , formatter );
  }
  function getRowSize ( props ){
    var rowSizeMap = {
      'day': 7,
      'week': 2,
      'isoWeek': 2,
      'month': 3,
      'quarter': 2,
      'year': 3
    };
    return rowSizeMap[props.precision] || 7;
  }
  function getLimits( props ){
    var precisionsMap = {
        'day': [ 'month' , 'week' ],
        'week': ['year' , 'week' ],
        'isoWeek': ['year' , 'isoWeek' ],
        'month': ['year' , 'month' ], // month is a bit redundant here
        'quarter': ['year' , 'quarter' ],
        'year': ['year']
      },
      precisions = precisionsMap[props.precision] || precisionsMap['day'],
      limits = {};
    _.each( ['calendarStart' , 'calendarEnd' ] , function ( limit ){
      var defaultLimit = ( limit == 'calendarEnd' ) ? 'max' : 'min'
          reference = ( props.precision == 'year' ) ? ( props[limit] || props[defaultLimit]) : props.date;
      limits[limit] = ( _.partial( goToLimit  , limit , reference ) ).apply( this , precisions );
    });
    return limits;
  }
  function goToLimit ( limit , reference ){
    var op = ( limit == 'calendarEnd' ) ? 'endOf' : 'startOf',
      precisions = _.rest( arguments , 2 );
    return _.reduce( precisions , function( date , precision ){
      return date[op](precision);
    }, moment( reference ).clone() );
  }


  // Constructor
  function CalendarController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    // Create Bindings
    this.watchView ( 'selectDate' , _.bind( change, this ) );
  }


  // Public
  function model2viewModel ( state , props ){
    return {
      headerRange: getHeaderRange( props ),
      range: getRange( props ) ,
      rowSize: getRowSize( props )
    };
  }


  // Exports
  return BlockController.extend( {
    constructor: CalendarController ,
    model2viewModel: model2viewModel
  } );

} )( window.wd.dateRangeSelectorModules.BlockController , window.wd.dateRangeSelectorModules.DateFormatter );


window.wd.dateRangeSelectorModules.CalendarViewFrameTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="calendar-block">' +
    '  <table>' +
    '    <thead class="calendar-header"></thead>' +
    '    <tbody class="calendar-body"></tbody>' +
    '  </table>' +
    '</div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarViewRowTemplate = ( function ( Mustache , _ ){
  var template = '<tr class="calendar-row items"></tr>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarViewItemTemplate = ( function ( Mustache , _ ){
  var template =
    '<td>' +
    '  <div class="{{#isSelected}}selected {{/isSelected}}{{#isDisabled}}disabled {{/isDisabled}}{{#isCurrentPeriod}}current-period {{/isCurrentPeriod}}{{^isCurrentPeriod}}outside-period {{/isCurrentPeriod}}" ' +
    '       {{#isSelected}}selected {{/isSelected}}{{#isDisabled}}disabled {{/isDisabled}}{{#isCurrentPeriod}}current-period {{/isCurrentPeriod}}{{^isCurrentPeriod}}outside-period {{/isCurrentPeriod}} >' +
    '    {{{ label }}}' +
    '  </div>' +
    '</td>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarViewHeaderRowTemplate = ( function ( Mustache , _ ){
  var template = '<tr class="calendar-header-row items"></tr>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarViewHeaderItemTemplate = ( function ( Mustache , _ ){
  var template =
    '<th>' +
    '  {{{ label }}}' +
    '</th>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarView = ( function ( BaseView , $ , _ , CalendarViewRowTemplate , CalendarViewItemTemplate , CalendarViewFrameTemplate , CalendarViewHeaderItemTemplate , CalendarViewHeaderRowTemplate  ) {
  //'use strict';

  // Private
  function selfOrDescendant( target , selector ){
    return $( target ).find( selector ).addBack( selector );
  }

  function periodicPartition( collection , period ){
    return _.groupBy( collection , function ( v, idx ){ return Math.floor( idx / ( period || idx || 1 ) ) } );
  }

  function renderFrame ( model ){
    var $frame = $( CalendarViewFrameTemplate ( model )),
      $body = selfOrDescendant( $frame , '.calendar-body'),
      $header = selfOrDescendant( $frame , '.calendar-header');
    $body.append( renderBody.call( this , { range: model.range , rowSize: model.rowSize } ) );
    $header.append( renderHeader.call( this, { range: model.headerRange , rowSize: model.rowSize } ) );

    return $frame;
  }

  function createItemsModel( items ){
    return { items: items };
  }

  function renderBody ( model ){
    return _.map( periodicPartition( model.range , model.rowSize ) , _.bind( _.compose( renderRow , createItemsModel ) , this ) );
  }

  function renderHeader( model ){
    return _.map( periodicPartition( model.range , model.rowSize ) , _.bind( _.compose( renderHeaderRow, createItemsModel ) , this ) );
  }

  function renderHeaderRow ( model ){
    var $row = $( CalendarViewHeaderRowTemplate( model ) ),
      $items = selfOrDescendant( $row , '.items' );

    $items.append( _.map( model.items, _.bind( renderHeaderItem , this ) ) );

    return $row;
  }

  function renderHeaderItem ( model ){
    return $( CalendarViewHeaderItemTemplate ( model ) );
  }

  function renderRow (  model ){
    var $row = $( CalendarViewRowTemplate( model ) ),
      $items = selfOrDescendant( $row , '.items' );

    $items.append( _.map( model.items, _.bind( renderItem , this ) ) );

    return $row;
  }

  function renderItem (  model ){
    var $item = $( CalendarViewItemTemplate( model ) );

    if ( !model.isDisabled ){
      $item.click( _.bind( selectDate , this , model.date.clone() ) );
    }

    return $item;
  }

  // Emmitted Events
  function selectDate ( date ){
    this.trigger( 'selectDate' , date );
  }

  // Public
  function render ( target , model ){
    return target.append( renderFrame.call( this , model ) );
  }

  // Exports
  return BaseView.extend( {
    render: render
  } );

} )( window.wd.dateRangeSelectorModules.BaseView , $ , _ , window.wd.dateRangeSelectorModules.CalendarViewRowTemplate , window.wd.dateRangeSelectorModules.CalendarViewItemTemplate , window.wd.dateRangeSelectorModules.CalendarViewFrameTemplate , window.wd.dateRangeSelectorModules.CalendarViewHeaderItemTemplate , window.wd.dateRangeSelectorModules.CalendarViewHeaderRowTemplate);


window.wd.dateRangeSelectorModules.CalendarBlock = ( function ( _ , moment , BaseBlock , CalendarView , CalendarController ) {
  //'use strict';

  // Constructor
  function CalendarBlock ( opts ){
    this.base( opts );

    this.setView( new CalendarView( ) );
    this.setController( new CalendarController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CalendarBlock
  } );

} )( _ , moment , window.wd.dateRangeSelectorModules.BaseBlock , window.wd.dateRangeSelectorModules.CalendarView , window.wd.dateRangeSelectorModules.CalendarController );


/***********************************************************************************************************************
 *
 * Calendar Dialog
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.CalendarDialogViewTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="calendar-dialog-block {{#precision}}precision-{{precision}}{{/precision}}">' +
    '  <div class="precisions-container clearfix">' +
    '  </div>'+
    '  <div class="calendar-container">' +
    '  </div>' +
    '</div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarDialogViewPrecisionTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="precision-button" title="{{tooltip}}"><div class="precision-button-label">{{{label}}}</div></div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CalendarDialogView = ( function (
  BaseView ,
  CalendarBlock ,
  CalendarDialogViewTemplate,
  CalendarDialogViewPrecisionTemplate
){
  // 'use strict';

  // Private
  function renderPrecision ( precisionModel , precisionKey ){
    return $( CalendarDialogViewPrecisionTemplate( precisionModel ) )
      .click( _.bind( selectPrecision , this , precisionKey ) );
  }
  function selectPrecision ( precision ){
    this.trigger('selectPrecision', precision );
  }
  function selectDate ( newDate ){
    this.trigger('selectDate' , newDate );
  }


  // Public
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    $(target).find('.precisions-container')
      .append( _.map( viewModel['precisions'] , _.bind( renderPrecision, this ) ) );

    if ( !this.hasChild( 'calendar' ) ){
      this.setChild( 'calendar' , this.createNewChild( 'calendar' ) );
      this.listenTo( this.getChild( 'calendar' ) , 'change' , _.bind( selectDate , this ) );
    }
    this.getChild( 'calendar' )
      .mount( $(target).find('.calendar-container') )
      .update({
        date: viewModel['date'],
        precision: viewModel['precision'],
        selectedDate: viewModel['selectedDate'],
        max: viewModel['max'],
        min: viewModel['min'],
        calendarStart: viewModel['calendarStart'],
        calendarEnd: viewModel['calendarEnd'],
        calendarFormat: viewModel['calendarFormat']
      });
  }


  // Exports
  return BaseView.extend({
    components: {
      'calendar': CalendarBlock
    },
    template: CalendarDialogViewTemplate,
    render: render
  });

})(
  window.wd.dateRangeSelectorModules.BaseView ,
  window.wd.dateRangeSelectorModules.CalendarBlock ,
  window.wd.dateRangeSelectorModules.CalendarDialogViewTemplate,
  window.wd.dateRangeSelectorModules.CalendarDialogViewPrecisionTemplate
);

window.wd.dateRangeSelectorModules.CalendarDialogController = ( function ( BlockController , DateFormatter ){
  // 'use strict';


  var defaultFormats =  {
    'day' : 'DD',
    'month': 'MMM',
    'week': function ( date ){
      var startMonth = date.startOf('week').format('MMM'),
        endMonth = date.endOf('week').format('MMM'),
        model = {
          week: date.format('[W]w'),
          range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
        },
        template = '{{week}} <span class="weak">({{range}})</span>';
      return Mustache.render( template, model );
    },
    'isoWeek': function ( date ){
      var startMonth = date.startOf('isoWeek').format('MMM'),
        endMonth = date.endOf('isoWeek').format('MMM'),
        model = {
          week: date.format('[W]W'),
          range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
        },
        template = '{{week}} <span class="weak">({{range}})</span>';
      return Mustache.render( template, model );
    },
    'quarter': '[Q]Q',
    'year': 'YYYY'
  };
  function getDefaultFormats (){
    return defaultFormats;
  }
  function setDefaultFormats ( formats ){
    if (_.isObject(formats)){
      defaultFormats = formats;
    }
  }


  // Private
  function getAllPrecisions( precision ){
    var precisionsMap = {
      day: [ 'year', 'month' , 'day' ],
      week: [ 'year' , 'week' ],
      isoWeek: [ 'year' , 'isoWeek' ],
      month: [ 'year' , 'month' ],
      quarter: [ 'year' , 'quarter' ],
      year: [ 'year' ]
    };

    return precisionsMap[precision];
  }

  function getPrimaryPrecision ( precision ){
    return _.last( getAllPrecisions( precision ) );
  }

  function getPrecisionsTooltip( precision ){
    var tooltipMap = {
      'day': 'Click to select day',
      'week': 'Click to select week',
      'isoWeek': 'Click to select week',
      'month': 'Click to select month',
      'quarter': 'Click to select quarter',
      'year': 'Click to select year'
    };
    return tooltipMap[precision];
  }

  function getPrecisionsModel ( date , precision , dateFormatter ){
    var precisions = {},
      precisionsList = _.without( getAllPrecisions( precision ) , getPrimaryPrecision( precision ) );
    _.forEach( precisionsList , function ( newPrecision ) {
      precisions[newPrecision] = {
        label: dateFormatter( date , newPrecision ) ,
        tooltip: getPrecisionsTooltip( newPrecision )
      }
    });
    return precisions;
  }

  function resetPrecision (  ){
    this.setState( 'precision' , getPrimaryPrecision( this.getProp('precision') ) );
  }

  function isPrimaryPrecision( precision , newPrecision ){
    return ( newPrecision == getPrimaryPrecision ( precision ) );
  }
  function getNextPrecision( precision , newPrecision ){
    var allGrains = getAllPrecisions(precision),
      idx = Math.min( _.indexOf( allGrains , newPrecision) + 1 , allGrains.length );
    return ( idx == 0 ) ? getPrimaryPrecision( precision ) : allGrains[idx];
  }

  function change ( newDate ){
    var statePrecision = this.getState('precision'),
      precision = this.getProp('precision'),
      op = ( this.getProp('edge') == 'end' ) ? 'endOf' : 'startOf';
    if (isPrimaryPrecision( precision , statePrecision) ){
      this.trigger( 'change' , newDate[op]( statePrecision ) );
    }
    this.setState( 'date', newDate[op]( statePrecision ) );
    this.setState('precision' , getNextPrecision( precision , statePrecision ) );
  }

  // Constructor
  function CalendarDialogController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    this.watchView( 'selectDate' , _.bind( change, this ) );
    this.watchView( 'selectPrecision' , _.partial( this.setState , 'precision' ) );
    this.watchProp( 'date' , _.partial( this.setState, 'date' ) );
    this.watchProp( 'precision' , _.bind( resetPrecision, this ) );
    this.watchProp( 'isActive' , _.bind( resetPrecision , this ) );

  }


  // Public
  function model2viewModel ( state ,  props ){
    var formatterOpts = _.isFunction( props.calendarFormat ) ? props.calendarFormat :
        _.extend( {} , getDefaultFormats() , props.calendarFormat ),
      dateFormatter = new DateFormatter( formatterOpts );

    return {
      precision: state.precision,
      date: state.date,
      selectedDate: props.date,
      precisions: getPrecisionsModel( state.date , props.precision , _.bind( dateFormatter.format , dateFormatter ) ),
      max: props.max,
      min: props.min,
      calendarStart: props.calendarStart,
      calendarEnd: props.calendarEnd,
      calendarFormat: formatterOpts
    }
  }


  // Exports
  return BlockController.extend({
    constructor: CalendarDialogController ,
    model2viewModel: model2viewModel
  });

})( window.wd.dateRangeSelectorModules.BlockController , window.wd.dateRangeSelectorModules.DateFormatter );


window.wd.dateRangeSelectorModules.CalendarDialogBlock = ( function ( BaseBlock , CalendarDialogView , CalendarDialogController ) {
  //'use strict';


  // Constructor
  function CalendarDialogBlock ( opts ){
    this.base( opts );

    this.setView( new CalendarDialogView(  ) );
    this.setController( new CalendarDialogController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CalendarDialogBlock
  } );

} )( window.wd.dateRangeSelectorModules.BaseBlock, window.wd.dateRangeSelectorModules.CalendarDialogView , window.wd.dateRangeSelectorModules.CalendarDialogController );



/***********************************************************************************************************************
 *
 * Custom Range
 *
 **********************************************************************************************************************/
window.wd.dateRangeSelectorModules.CustomDateViewTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="custom-date-block {{foldClass}} {{#isDialogOpen}}open{{/isDialogOpen}}">' +
    '  <div class="date-display">' +
    '    {{{displayDate}}}' +
    '  </div>'+
    '  {{#isDialogOpen}}' +
    '    <div class="calendar-dialog">' +
    '    </div>' +
    '  {{/isDialogOpen}}' +
    '</div>';
  return _.partial( Mustache.render, template );
})( Mustache , _ );

window.wd.dateRangeSelectorModules.CustomDateView = ( function ( BaseView , CalendarDialogBlock , CustomDateViewTemplate ){
  // 'use strict';

  // Private
  function clickOnDisplay ( ) {
    this.trigger( 'clickOnDisplay' );
  }
  function clickOutside ( ){
    this.trigger( 'clickOutside' );
  }
  function selectDate ( newDate ){
    this.trigger('selectDate' , newDate );
  }
  function getClickOutsideCallback ( ){
    var uniqueId = this.getViewId();

    function isInside ( ev ){
      return ( $(ev.target).parents('.custom-date-block').length > 0 ) && ( $(ev.target).parents('.' + uniqueId ).length > 0 );
    }

    function callback ( ev ){
      if (!isInside(ev)) {
        clickOutside.call(this);
      }
    }

    return _.bind( callback , this );
  }


  // Public
  function setElement (){
    this.base.apply( this, arguments );
  }
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    if ( viewModel['isDialogOpen'] ){
      var calendar = this.createNewChild( 'calendarDialog' );
      this.listenTo( calendar , 'change', _.bind( selectDate, this ) );
      calendar
        .mount( $(target).find('.calendar-dialog') )
        .update( {
          date: viewModel['date'],
          max: viewModel['max'],
          min: viewModel['min'],
          calendarStart: viewModel['calendarStart'],
          calendarEnd: viewModel['calendarEnd'],
          edge: viewModel['edge'],
          precision: viewModel['precision'],
          calendarFormat: viewModel['calendarFormat']
        });
    }

    this.bindToViewport( getClickOutsideCallback.call( this ) );

  }


  // Exports
  return BaseView.extend({
    components: {
      'calendarDialog': CalendarDialogBlock
    },
    events:{
      'click .date-display': clickOnDisplay
    },
    template: CustomDateViewTemplate,
    setElement: setElement ,
    render: render
  });

})( window.wd.dateRangeSelectorModules.BaseView , window.wd.dateRangeSelectorModules.CalendarDialogBlock , window.wd.dateRangeSelectorModules.CustomDateViewTemplate );


window.wd.dateRangeSelectorModules.CustomDateDefaults = ( function ( BaseModel ){
  var defaults = {

    dateFormat: {
      'day' : 'MMM DD, YYYY',
      'month': 'MMM [<span class="weak">](DD, YYYY)[</span>]',
      'week': '[Week] ww [<span class="weak">](MMM DD, YYYY)[</span>]',
      'isoWeek': '[Week] WW [<span class="weak">](MMM DD, YYYY)[</span>]',
      'quarter': '[Q]Q [<span class="weak">](MMM DD, YYYY)[</span>]',
      'year': 'YYYY [<span class="weak">](MMM DD)[</span>]'
    },

    calendarFormat: {
      'day' : 'DD',
      'month': 'MMM',
      'week': function ( date ){
        var startMonth = date.startOf('week').format('MMM'),
          endMonth = date.endOf('week').format('MMM'),
          model = {
            week: date.format('[W]w'),
            range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
          },
          template = '{{week}} <span class="weak">({{range}})</span>';
        return Mustache.render( template, model );
      },
      'isoWeek': function ( date ){
        var startMonth = date.startOf('isoWeek').format('MMM'),
          endMonth = date.endOf('isoWeek').format('MMM'),
          model = {
            week: date.format('[W]W'),
            range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
          },
          template = '{{week}} <span class="weak">({{range}})</span>';
        return Mustache.render( template, model );
      },
      'quarter': '[Q]Q',
      'year': 'YYYY',
      'dayOfWeek': 'ddd'
    },

    max: function (){
      return moment();
    },

    min: function(){
      return moment().add(-20,'year');
    },

    edge: 'start',

    precision: 'day'

  };

  return ( new BaseModel(defaults) );
})( window.wd.dateRangeSelectorModules.BaseModel );


window.wd.dateRangeSelectorModules.CustomDateController = ( function ( _ , BlockController , DateFormatter , CustomDateDefaults ){
  // 'use strict';

  function getDefaults(){
    return CustomDateDefaults.get.apply( CustomDateDefaults, arguments);
  }
  function setDefaults(){
    return CustomDateDefaults.set.apply( CustomDateDefaults, arguments);
  }

  // Private
  function change ( newDate ){
    this.setState( 'isDialogOpen' , false );
    this.trigger( 'change' , newDate );
  }
  function toggleDialog ( value ){
    var newValue = _.isUndefined( value ) ? !this.getState( 'isDialogOpen' ) : value;
    this.setState( 'isDialogOpen' , newValue );
  }
  function normalizeFormat( propsFormat ,  defaultsFormat ){
    return _.isFunction( propsFormat ) ? propsFormat : _.extend( {} , defaultsFormat , propsFormat );
  }

  function normalizeLimit ( limitKey , date ){
    var limit = date || getDefaults( limitKey );
    if ( _.isFunction( limit ) ){
      limit = limit( moment() );
    }
    if ( !moment.isMoment( limit ) && !_.isEmpty( limit ) ){
      limit = moment( limit );
    }
    return limit;
  }
  function normalizePrecision( precision ){
    return _.isString( precision ) ? precision : getDefaults('precision');
  }
  function normalizeEdge( edge ){
    return _.contains( ['start' , 'end' ], edge ) ? edge : getDefaults('edge');
  }

  function getFoldClass( foldDirection ){
    return ( foldDirection == 'left' ) ? 'fold-left' : ( foldDirection == 'right' ) ? 'fold-right' : '';
  }


  // Constructor
  function CustomDateController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    this.watchView( 'selectDate' , _.bind( change, this ) );
    this.watchView( 'clickOnDisplay' , _.bind( toggleDialog, this ) );
    this.watchView( 'clickOutside'   , _.bind( toggleDialog , this , false ) );

  }


  // Public
  function model2viewModel ( state ,  props ){
    var formatOpts = normalizeFormat( props.dateFormat , getDefaults('dateFormat') ),
      formatter = new DateFormatter( formatOpts);
    return {
      precision: normalizePrecision( props.precision ),
      date: props.date,
      max: normalizeLimit( 'max' , props.max ),
      min: normalizeLimit( 'min' , props.min ),
      calendarStart: normalizeLimit( 'calendarStart' , props.calendarStart),
      calendarEnd: normalizeLimit( 'calendarEnd' , props.calendarEnd),
      edge: normalizeEdge( props.edge ),
      displayDate: formatter.format( props.date, props.precision ),
      isDialogOpen: state.isDialogOpen,
      calendarFormat: props.calendarFormat,
      foldClass: getFoldClass( props.foldDirection )
    }
  }

  // Exports
  return BlockController.extend({
    constructor: CustomDateController ,
    model2viewModel: model2viewModel
  },{
    getDefaults: getDefaults,
    setDefaults: setDefaults
  });

})( _ , window.wd.dateRangeSelectorModules.BlockController , window.wd.dateRangeSelectorModules.DateFormatter , window.wd.dateRangeSelectorModules.CustomDateDefaults );

window.wd.dateRangeSelectorModules.CustomDateBlock = ( function ( BaseBlock , CustomDateView , CustomDateController ) {
  //'use strict';


  // Constructor
  function CustomDateBlock ( opts ){
    this.base( opts );

    this.setView( new CustomDateView( ) );
    this.setController( new CustomDateController( this.getStateModel() , this.getPropsModel() , this.getView() ) );
  }


  // Exports
  return BaseBlock.extend( {
    constructor: CustomDateBlock
  } );

} )( window.wd.dateRangeSelectorModules.BaseBlock, window.wd.dateRangeSelectorModules.CustomDateView , window.wd.dateRangeSelectorModules.CustomDateController );



/***********************************************************************************************************************
 *
 * Custom Range Block
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.CustomRangeController = ( function ( moment , $ , _ , BlockController ){
  //'use strict';

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

} )( moment , $ , _ , window.wd.dateRangeSelectorModules.BlockController );

window.wd.dateRangeSelectorModules.CustomRangeViewTemplate = ( function  ( Mustache , _ ){
  var template =
    '<div class="custom-range-block">' +
    '  <div class="custom-range-label range-label">' +
    '    <span> {{{ labels.customRange }}} </span> ' +
    '  </div> ' +
    '  {{#isOpen}}' +
    '    <div class="custom-range-dropdown dropdown"> ' +
    '      <div class="precisions-container"> ' +
    '        <div class="precisions-header header-label">{{{ labels.selectedPeriod }}}</div>' +
    '        <div class="precisions-body"></div>' +
    '      </div> ' +
    '      <div class="calendars-container"> ' +
    '        <div class="start-calendar-dialog-container">' +
    '          <div class="start-calendar-dialog-header header-label">{{{ labels.startDate }}}</div> '+
    '          <div class="start-calendar-dialog"></div>'+
    '        </div> ' +
    '        <div class="end-calendar-dialog-container">' +
    '          <div class="end-calendar-dialog-header header-label">{{{ labels.endDate }}}</div> '+
    '          <div class="end-calendar-dialog"></div>'+
    '        </div> ' +
    '      </div> ' +
    '      <div class="granularities-container {{foldClass}} {{#isGranularitiesOpen}}open{{/isGranularitiesOpen}} ">' +
    '        <div class="granularities-header header-label">{{{ labels.granularity }}}</div>' +
    '        <div class="granularities-body">' +
    '          <div class="granularities-display" >' +
    '            {{selectedGranularityDisplay}}' +
    '          </div>' +
    '          {{#isGranularitiesOpen}}' +
    '            <div class="granularities-dropdown">' +
    '            </div>' +
    '          {{/isGranularitiesOpen}}' +
    '        </div>' +
    '      </div> ' +
    '    </div> ' +
    '  {{/isOpen}}' +
    '</div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CustomRangeViewPrecisionTemplate = ( function  ( Mustache , _ ){
  var template =
    '<div class="custom-range-precision {{#isSelected}}selected{{/isSelected}}" {{#isSelected}}selected{{/isSelected}}>' +
    '  {{label}}' +
    '</div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.CustomRangeViewGranularityTemplate = ( function  ( Mustache , _ ){
  var template =
    '<div class="custom-range-granularity {{#isSelected}}selected{{/isSelected}}" {{#isSelected}}selected{{/isSelected}}>' +
    '  {{label}}' +
    '</div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
var CustomRangeView = ( function (
  BaseView ,
  $ ,
  _ ,
  CustomDateBlock ,
  CustomRangeViewTemplate,
  CustomRangeViewModeTemplate,
  CustomRangeViewGranularityTemplate
) {
  //'use strict';

  // Private

  function clickOnDisplay (){
    this.trigger('clickOnDisplay');
  }
  function renderPrecision ( precisionModel ){
    return $( CustomRangeViewModeTemplate ( precisionModel ) )
      .click( _.bind( selectPrecision , this , precisionModel.value ) );
  }
  function renderGranularity ( granularityModel ){
    return $( CustomRangeViewGranularityTemplate ( granularityModel ) )
      .click( _.bind( selectGranularity , this , granularityModel.value ) );
  }
  function selectStart ( newStart ){
    this.trigger('selectRange' , { start: newStart } );
  }
  function selectEnd ( newEnd ){
    this.trigger('selectRange' , { end: newEnd } );
  }
  function selectPrecision ( newPrecision ){
    this.trigger('selectRange' , { precision: newPrecision } );
  }
  function selectGranularity ( newGranularity ){
    this.trigger('selectRange' , { granularity: newGranularity } );
  }
  function clickOnGranularitiesDisplay (){
    this.trigger('clickOnGranularitiesDisplay');
  }
  function clickOutsideGranularities (){
    this.trigger('clickOutsideGranularities');
  }
  function getClickOutsideCallback ( ){
    var uniqueId = this.getViewId();

    function isInside ( ev ){
      return ( $(ev.target).parents('.granularities-body').length > 0 ) && ( $(ev.target).parents('.' + uniqueId ).length > 0 );
    }

    function callback ( ev ){
      if (!isInside(ev)) {
        clickOutsideGranularities.call(this);
      }
    }

    return _.bind( callback , this );
  }


  // Public
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    if ( viewModel['isOpen'] ) {

      $(target).find('.precisions-body')
        .append( _.map( viewModel['precisions'] , _.bind( renderPrecision, this ) ) );

      if ( !this.hasChild( 'startCalendarDialog' ) ){
        this.setChild( 'startCalendarDialog' , this.createNewChild('customDate') );
        this.listenTo( this.getChild( 'startCalendarDialog' ) , 'change', _.bind( selectStart, this ) );
      }
      this.getChild( 'startCalendarDialog' )
        .mount( $(target).find('.start-calendar-dialog') )
        .update( {
          date: viewModel['startConfig']['date'],
          max: viewModel['startConfig']['max'],
          min: viewModel['startConfig']['min'],
          calendarStart: viewModel['startConfig']['calendarStart'],
          calendarEnd: viewModel['startConfig']['calendarEnd'],
          precision: viewModel['precision'],
          edge: viewModel['startConfig']['edge'],
          dateFormat: viewModel['dateFormat'],
          calendarFormat: viewModel['calendarFormat'],
          foldDirection: viewModel['foldDirection']
        });

      if ( !this.hasChild( 'endCalendarDialog' ) ){
        this.setChild( 'endCalendarDialog' , this.createNewChild('customDate') );
        this.listenTo( this.getChild( 'endCalendarDialog' ) , 'change', _.bind( selectEnd, this ) );
      }
      this.getChild( 'endCalendarDialog' )
        .mount( $(target).find('.end-calendar-dialog') )
        .update( {
          date: viewModel['endConfig']['date'],
          max: viewModel['endConfig']['max'],
          min: viewModel['endConfig']['min'],
          calendarStart: viewModel['startConfig']['calendarStart'],
          calendarEnd: viewModel['startConfig']['calendarEnd'],
          precision: viewModel['precision'],
          edge: viewModel['endConfig']['edge'],
          dateFormat: viewModel['dateFormat'],
          calendarFormat: viewModel['calendarFormat'],
          foldDirection: viewModel['foldDirection']
        });

      $(target).find('.granularities-dropdown')
        .append( _.map( viewModel['granularities'] , _.bind( renderGranularity, this ) ) );

      this.bindToViewport( getClickOutsideCallback.call(this) );
    }
  }


  // Exports
  return BaseView.extend( {
    components: {
      'customDate': CustomDateBlock
    },
    events: {
      'click .custom-range-label' : clickOnDisplay,
      'click .granularities-display': clickOnGranularitiesDisplay
    },
    template: CustomRangeViewTemplate,
    render: render
  } );

} )(
  window.wd.dateRangeSelectorModules.BaseView ,
  $ ,
  _ ,
  window.wd.dateRangeSelectorModules.CustomDateBlock,
  window.wd.dateRangeSelectorModules.CustomRangeViewTemplate,
  window.wd.dateRangeSelectorModules.CustomRangeViewPrecisionTemplate,
  window.wd.dateRangeSelectorModules.CustomRangeViewGranularityTemplate
);

window.wd.dateRangeSelectorModules.CustomRangeBlock = ( function ( BaseBlock , CustomRangeView , CustomRangeController ) {
  //'use strict';


  // Constructor
  function CustomRangeBlock ( opts ){
    this.base( opts );

    this.setView( new CustomRangeView( ) );
    this.setController( new CustomRangeController( this.getStateModel() , this.getPropsModel() , this.getView() ) );

  }


  // Exports
  return BaseBlock.extend( {
    constructor: CustomRangeBlock
  } );

} )( window.wd.dateRangeSelectorModules.BaseBlock, CustomRangeView , window.wd.dateRangeSelectorModules.CustomRangeController );




/***********************************************************************************************************************
 *
 * DRP
 *
 **********************************************************************************************************************/

window.wd.dateRangeSelectorModules.DateRangeSelectorDefaults = ( function ( _ , moment , BaseModel ){

  var defaults = {

    precisionPresets:{
      "day":     { label: "Day" , value: "day" },
      "week":    { label: "Week" , value: "week" },
      "isoWeek": { label: "Week" , value: "isoWeek" },
      "month":   { label: "Month" , value: "month" },
      "quarter": { label: "Quarter" , value: "quarter" },
      "year":    { label: "Year" , value: "year" }
    },

    precisions: [ 'day' , 'week' , 'month' , 'quarter' , 'year' ],

    selectorPresets: {
      'mtd': {
        value: 'mtd',
        type: 'predefined',
        label: 'Month to Date',
        getRange: function () {
          return {start: moment().startOf('month'), end: moment(), precision:'day' };
        }
      },
      'last7d': {
        value: 'last7d',
        type: 'predefined',
        label: 'Last 7 Days',
        getRange: function () {
          return {start: moment().add(-7, 'days'), end: moment(), precision:'day' };
        }
      },
      'ytd': {
        value: 'ytd',
        type: 'predefined',
        label: 'Year to Date',
        getRange: function () {
          return {start: moment().startOf('year'), end: moment(), precision:'day' };
        }
      },
      'custom': {
        type: 'custom',
        value: 'custom'
      }
    },

    selectors: [ 'mtd' , 'last7d' , 'custom' ],

    rangeFormat:{
      'day': 'MMM DD{, YYYY}',
      'week': '[Week] ww{, YYYY}',
      'isoWeek': '[Week] ww{, YYYY}',
      'month': 'MMM{, YYYY}',
      'quarter': '[Q]Q{, YYYY}',
      'year': 'YYYY'
    },

    granularityPresets: {
      "day":     {
        label: "Day" ,
        value: "day"
      },
      "week":    {
        label: "Week" ,
        value: "week"
      },
      "month":   {
        label: "Month" ,
        value: "month"
      },
      "quarter": {
        label: "Quarter" ,
        value: "quarter"
      },
      "year":    {
        label: "Year" ,
        value: "year"
      }
    },

    granularities: [ 'day' , 'week' , 'month' , 'quarter' , 'year' ],

    granularityValidator: 20,

    labels: {
      cancelButton: 'Cancel',
      applyButton: 'Apply',
      intervals: 'Intervals:',
      customRange: 'Custom Range',
      selectedPeriod: 'Selected Period:',
      startDate: 'Start Date:',
      endDate: 'End Date:',
      granularity: 'Granularity:'
    },

    dateFormat: {
      'day' : 'MMM DD, YYYY',
      'month': 'MMM [<span class="weak">](DD, YYYY)[</span>]',
      'week': '[Week] ww [<span class="weak">](MMM DD, YYYY)[</span>]',
      'isoWeek': '[Week] WW [<span class="weak">](MMM DD, YYYY)[</span>]',
      'quarter': '[Q]Q [<span class="weak">](MMM DD, YYYY)[</span>]',
      'year': 'YYYY [<span class="weak">](MMM DD)[</span>]'
    },

    calendarFormat: {
      'day' : 'DD',
      'month': 'MMM',
      'week': function ( date ){
        var startMonth = date.startOf('week').format('MMM'),
          endMonth = date.endOf('week').format('MMM'),
          model = {
            week: date.format('[W]w'),
            range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
          },
          template = '{{week}} <span class="weak">({{range}})</span>';
        return Mustache.render( template, model );
      },
      'isoWeek': function ( date ){
        var startMonth = date.startOf('isoWeek').format('MMM'),
          endMonth = date.endOf('isoWeek').format('MMM'),
          model = {
            week: date.format('[W]W'),
            range: ( startMonth == endMonth ) ? startMonth : startMonth + ' - ' + endMonth
          },
          template = '{{week}} <span class="weak">({{range}})</span>';
        return Mustache.render( template, model );
      },
      'quarter': '[Q]Q',
      'year': 'YYYY',
      'dayOfWeek': 'ddd'
    },

    max: function (){
      return moment();
    },

    min: function(){
      return moment().add(-20,'year');
    }

  };

  return ( new BaseModel(defaults) );

})( _ , moment , window.wd.dateRangeSelectorModules.BaseModel );




window.wd.dateRangeSelectorModules.DateRangeSelectorController = ( function ( moment , $ , _ , BlockController, RangeFormatter , DateRangeSelectorDefaults ){
  //'use strict';


  // Static
  function getDefaults ( ){
    return DateRangeSelectorDefaults.get.apply( DateRangeSelectorDefaults , arguments );
  }
  function setDefaults ( ){
    return DateRangeSelectorDefaults.set.apply( DateRangeSelectorDefaults , arguments );
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

  function normalizeLimit ( limitKey , date ){
    var limit = date || getDefaults( limitKey );
    if ( _.isFunction( limit ) ){
      limit = limit( moment() );
    }
    if ( !moment.isMoment( limit ) && !_.isEmpty( limit ) ){
      limit = moment( limit );
    }
    return limit;
  }

  function getRangeAttributes (){
    return [ 'start' , 'end' , 'precision' , 'granularity' ];
  }

  function getBackedAttributes (){
    return _.union( getRangeAttributes() , [ 'selection' ] );
  }

  function getRangeFromModel( model ){
    return _.pick( model, getRangeAttributes() );
  }

  function getBackedFromModel( model ){
    return _.pick( model, getBackedAttributes() );
  }

  function getLabelsModel( labels ){
    return $.extend( {} , getDefaults('labels') , labels );
  }


  function getItemModel( collectionId , cfg , idKey ){
    var out,
      preset = getDefaults (  collectionId ) || {};
    if ( _.isString(cfg) && !_.isEmpty(preset[cfg]) ){
      out = preset[cfg] || {};
    } else if ( _.isObject( cfg ) && !_.isEmpty(cfg) ){
      out = $.extend( {} , preset[ cfg[ idKey || 'value'] ] , cfg );
    } else {
      out = null;
    }
    if (_.isObject(out) ) {
      out.label = _.isEmpty( out.label ) ? out.value : out.label;
    }
    return out;
  }


  function isValidPrecisionsType ( cfg ){
    return ( ( _.isString(cfg) || _.isArray(cfg) ) && !_.isEmpty(cfg) );
  }
  function normalizePrecisionsConfig ( cfg ){
    var precisions = isValidPrecisionsType(cfg) ? cfg : getDefaults('precisions');
    return _.isString( precisions ) ? precisions.split(',') : precisions;
  }
  function getPrecisionModel ( cfg , idKey ){
    return getItemModel( 'precisionPresets' , cfg , idKey );
  }
  function getPrecisionsModel ( config ){
    return _.map( normalizePrecisionsConfig( config ) , getPrecisionModel );
  }



  function isValidSelectorsType ( cfg ){
    return ( !_.isEmpty(cfg) && _.isArray(cfg) );
  }
  function normalizeSelectorsConfig ( cfg ){
    return isValidSelectorsType(cfg) ? cfg : getDefaults('selectors');
  }
  function getSelectorModel ( idKey , cfg ){
    return getItemModel( 'selectorPresets' , cfg , idKey );
  }
  function getSelectorsModel ( config ){
    return _.filter( _.map( normalizeSelectorsConfig( config ) , _.partial( getSelectorModel , 'value') ) , isValidSelectorModel );
  }
  function isValidSelectorModel ( model ){
    return ( model.type == 'predefined' && _.isFunction( model.getRange ) ) ||
      ( model.type == 'custom' ) ||
      _.isFunction ( model.type );
  }

  function getCollectionViewModel( collection , isSelected ){
    var viewModel = copy(collection);
    _.forEach( viewModel , function ( el ){
      el.isSelected = isSelected( el );
    });
    return viewModel;
  }


  function isValidGranularitiesType ( cfg ){
    return ( ( _.isString(cfg) || _.isArray(cfg) ) && !_.isEmpty(cfg) );
  }
  function normalizeGranularitiesConfig ( cfg ){
    var grains = isValidGranularitiesType(cfg) ? cfg : getDefaults('granularities');
    return  _.isString( grains ) ? grains.split(',') : grains;
  }
  function getGranularityModel ( idKey , cfg ){
    return getItemModel( 'granularityPresets' , cfg , idKey );
  }
  function getGranularitiesModel ( config ){
    return _.filter( _.map( normalizeGranularitiesConfig( config ) , _.partial( getGranularityModel , 'value' ) ) , isValidGranularityModel );
  }
  function isValidGranularityModel ( model ){
    return !_.isEmpty( model.value );
  }
  function filterGranularities ( start , end , precision , granularities , granularityValidator ){
    var out;
    if ( moment.isMoment( start ) && moment.isMoment( end ) ) {
      var _start = start.clone(),
        _end = end.clone();
      out =  _.filter(granularities, function (grain) {
        return granularityValidator( grain.value , _start, _end, precision );
      });
    } else {
      out = [];
    }
    return out;
  }
  function isSelected ( selection , selector){
    return selection &&  selector.value == selection;
  }


  function isValidGranularityValidatorType ( cfg ){
    return _.isFunction( cfg ) || _.isNumber( cfg );
  }
  function getBoundedGranularityValidator ( min , max ){

    function granularityValidator ( grain , start , end ){
      var diff = end.diff( start , grain );
      return ( diff >= min ) && ( diff <= max );
    }

    return granularityValidator;
  }
  function normalizeGranularityValidatorConfig ( cfg ){
    var validator = isValidGranularityValidatorType ( cfg ) ? cfg : getDefaults('granularityValidator');
    return _.isFunction ( validator ) ? validator : getBoundedGranularityValidator( 0 , validator );
  }
  function getGranularityValidatorModel ( cfg ){
    return normalizeGranularityValidatorConfig( cfg );
  }



  function hasRangeChanged( state , props ){
    var stateRange = getRangeFromModel( state ),
      propsRange = getRangeFromModel( props );
    return (
      ( !_.isEmpty( propsRange.granularity ) && ( stateRange.granularity !== propsRange.granularity ) ) ||
      ( !_.isEmpty( propsRange.precision ) && ( stateRange.precision !== propsRange.precision ) ) ||
      ( !_.isEmpty( propsRange.start ) && !moment( propsRange.start ).isSame( stateRange.start , 'day' ) ) ||
      ( !_.isEmpty( propsRange.end ) && !moment( propsRange.end ).isSame( stateRange.end , 'day' ) )
    );
  }
  function validateSelector ( ){
    var selectors = getSelectorsModel( this.getProp('selectors') ),
      firstSelector = _.first( selectors );

    if ( !_.find( selectors , _.partial( isSelected , this.getState('selection') ) ) && firstSelector ) {
      select.call( this, firstSelector );
    }
  }

  function restoreSelection (){
    this.setState( this.getState('backup') );
  }
  function getRangeProps (){
    return getRangeFromModel( this.getProp() );
  }
  function getRangeState(){
    return getRangeFromModel( this.getState() );

  }
  function normalizeRangeState( range ){
    var normalizedRange = {};
    _.each( range , function ( value , key ){
      normalizedRange[key] = isDateProp(key) ? normalizeDate( value ) : value;
    } );
    return normalizedRange;
  }
  function normalizeDate( date ){
    return moment.isMoment( date ) ? date : moment( date );
  }
  function normalizePrecision ( precision ){
    return _.isString( precision ) ? precision : 'day';
  }

  function setRangeState( newRange ){
    this.setState( getRangeFromModel( newRange ) );
  }
  function toggleDropdown ( value ){
    var newValue = _.isUndefined( value ) ? !this.getState( 'isDropdownOpen' ) : value;
    if ( !newValue ){
      restoreSelection.call( this );
    } else {
      loadSelection.call( this );
    }
    this.setState( 'isDropdownOpen' , newValue );
  }
  function loadSelection (){
    this.setState( 'backup' , getBackedFromModel( this.getState() ) );
    updateRangeState.call( this , normalizeRangeState( getRangeProps.call( this ) ) );
    validateSelector.call( this );
  }
  function isDateProp ( prop ){
    return _.contains( ['start' , 'end'] , prop );
  }

  function notifyChange (){
    this.trigger( 'change' , getRangeState.call( this ) );
  }
  function cancelAndClose (){
    restoreSelection.call( this );
    this.setState( 'isDropdownOpen' , false );
  }
  function applyAndClose(){
    notifyChange.call( this );
    this.setState( 'isDropdownOpen' , false );
  }
  function select ( activeSelector ){
    this.setState('selection' , activeSelector['value'] );
  }
  function validateNewRangeState ( newRange ){
    var range = $.extend({}, getRangeState.call(this), newRange),
      precisions = getPrecisionsModel( this.getProp('precisions') ),
      min = normalizeLimit( 'min' , this.getProp('min') ),
      max = normalizeLimit( 'max' , this.getProp('max') ),
      newPrecision = ( _.findWhere( precisions , { value: range.precision } ) || _.first( precisions ) ).value,
      newStart = limitDate( range.start , min , max ).clone().startOf( newPrecision ),
      newEnd = limitDate( range.end , min , max ).clone().endOf( newPrecision),
      granularities = getGranularitiesModel( this.getProp('granularities') ),
      granularityValidator = getGranularityValidatorModel( this.getProp('granularityValidator') ),
      filteredGranularities = filterGranularities( newStart , newEnd , newPrecision , granularities , granularityValidator ),
      newGranularity = (_.findWhere( filteredGranularities , { value: range.granularity } ) || _.first( granularities) );
    newGranularity = _.isObject( newGranularity ) && newGranularity.value;
    return {
      start: newStart,
      end: newEnd,
      precision: newPrecision,
      granularity: newGranularity
    };
  }
  function updateRangeState ( newRange ){
    setRangeState.call( this , validateNewRangeState.call( this , newRange ) );
  }

  function limitDate ( date , min , max ){
    var newDate = normalizeDate( date );
    if ( moment.isMoment( max ) ){
      newDate = moment.min( newDate , max );
    }
    if ( moment.isMoment( min ) ){
      newDate = moment.max( newDate , min );
    }
    return newDate;
  }

  function normalizeFormat( propsFormat ,  defaultsFormat ){
    return _.isFunction( propsFormat ) ? propsFormat : _.extend( {} , defaultsFormat , propsFormat );
  }


  // Constructor
  function DateRangeSelectorController ( stateModel , propsModel , view ){
    this.base( stateModel , propsModel , view );

    // Create Bindings

    this.watchView( 'clickOutside'   , _.bind( toggleDropdown , this , false ) );
    this.watchView( 'clickOnDisplay' , _.bind( toggleDropdown , this ) );
    this.watchView( 'selectRange' , _.bind( updateRangeState, this ) );
    this.watchView( 'cancel' , _.bind( cancelAndClose, this ) );
    this.watchView( 'apply' , _.bind( applyAndClose, this ) );
    this.watchView( 'select' , _.bind( select , this ) );
  }


  // Public
  function model2viewModel ( state , props ){
    var rangeFormatterOpts = normalizeFormat( props.rangeFormat , getDefaults('rangeFormat') ),
      formatter = new RangeFormatter( rangeFormatterOpts );

    return _.extend( getRangeFromModel( state ) , {
      rangeDisplay: formatter.format( normalizeDate( props.start ) , normalizeDate( props.end ) , normalizePrecision( props.precision ) ),
      calendarFormat: normalizeFormat( props.calendarFormat , getDefaults('calendarFormat') ),
      dateFormat: normalizeFormat( props.dateFormat , getDefaults('dateFormat') ),
      selectors: getCollectionViewModel( getSelectorsModel( props.selectors ) , _.partial( isSelected , state.selection ) ) ,
      isDropdownOpen: state.isDropdownOpen,
      areActionsOnTop: props.actionsPosition == 'top',
      hasRangeChanged: hasRangeChanged( state , props ),
      max: normalizeLimit( 'max' , props.max ),
      min: normalizeLimit( 'min' , props.min ),
      calendarStart: normalizeLimit( 'calendarStart' , props.calendarStart),
      calendarEnd: normalizeLimit( 'calendarEnd' , props.calendarEnd),
      precisions: getPrecisionsModel( props.precisions ),
      granularities: filterGranularities( state.start , state.end , state.precision , getGranularitiesModel( props.granularities ) , getGranularityValidatorModel( props.granularityValidator ) ),
      labels: getLabelsModel( props.labels ),
      foldDirection: props.foldDirection
    });
  }


  // Exports
  return BlockController.extend( {
    constructor: DateRangeSelectorController ,
    model2viewModel: model2viewModel
  }, {
    setDefaults: setDefaults,
    getDefaults: getDefaults
  });

} )( moment , $ , _ , window.wd.dateRangeSelectorModules.BlockController , window.wd.dateRangeSelectorModules.RangeFormatter , window.wd.dateRangeSelectorModules.DateRangeSelectorDefaults );


window.wd.dateRangeSelectorModules.DateRangeSelectorViewTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="date-range-selector-block">' +
    '  <div class="range-display">' +
    '    <span> {{{ rangeDisplay }}} </span> ' +
    '  </div> ' +
    '  {{#isDropdownOpen}}' +
    '  <div class="date-range-selector-dropdown dropdown"> ' +
    '    {{#areActionsOnTop}}' +
    '    <div class="buttons-container buttons-container-top clearfix">' +
    '      <div class="button-container cancel-button-container">' +
    '        <button class="cancel-button">{{labels.cancelButton}}</button>' +
    '      </div>' +
    '      <div class="button-container apply-button-container">' +
    '        <button class="apply-button {{^hasRangeChanged}}disabled{{/hasRangeChanged}}" ' +
    '                {{^hasRangeChanged}}disabled{{/hasRangeChanged}}>{{labels.applyButton}}</button>' +
    '      </div>' +
    '    </div>' +
    '    {{/areActionsOnTop}}' +
    '    <div class="selectors-container"> ' +
    '      <div class="selectors-header header-label">{{labels.intervals}}</div>'+
    '      <div class="selectors-body"></div>' +
    '    </div> ' +
    '    {{^areActionsOnTop}}' +
    '    <div class="buttons-container buttons-container-bottom clearfix">' +
    '      <div class="button-container cancel-button-container">' +
    '        <button class="cancel-button">{{labels.cancelButton}}</button>' +
    '      </div>' +
    '      <div class="button-container apply-button-container">' +
    '        <button class="apply-button {{^hasRangeChanged}}disabled{{/hasRangeChanged}}" ' +
    '                {{^hasRangeChanged}}disabled{{/hasRangeChanged}}>{{labels.applyButton}}</button>' +
    '      </div>' +
    '    </div>' +
    '    {{/areActionsOnTop}}' +
    '  </div> ' +
    '  {{/isDropdownOpen}}' +
    '</div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.DateRangeSelectorViewItemTemplate = ( function ( Mustache , _ ){
  var template =
    '<div class="selector {{#isSelected}}selected{{/isSelected}}"  {{#isSelected}}selected{{/isSelected}}></div>';
  return _.partial( Mustache.render , template );
})( Mustache , _ );
window.wd.dateRangeSelectorModules.DateRangeSelectorView = ( function ( BaseView , $ , _ , PredefinedBlock , CustomRangeBlock , DateRangeSelectorViewTemplate , DateRangeSelectorViewItemTemplate ) {
  //'use strict';

  // Private
  function bindToPage ( callback ) {

    function handler ( ev ){
      callback( ev );
    }
    function bind ( ){
      document.addEventListener('click', handler , true );
    }
    function unbind(){
      document.removeEventListener('click', handler , true );
    }

    bind();

    return unbind;
  }

  function select ( selectorKey ){
    this.trigger('select', selectorKey );
  }

  function createSelector ( type , opts ) {
    var selector = this.createNewChild( type , opts );
    this.listenTo( selector  , 'change' , _.partial( this.trigger , 'selectRange' ) );

    return selector;
  }
  function renderSelector ( viewModel, selectorModel , idx ){
    var $selector = $( DateRangeSelectorViewItemTemplate( selectorModel ) )
      .click( _.bind( select , this , selectorModel ) );

    var selectorBlock =
      ( idx && this.hasChild( idx ) ) ?  this.getChild( idx ) : createSelector.call( this, selectorModel.type ) ;
    if ( idx && !this.hasChild( idx ) ){
      this.setChild( idx , selectorBlock );
    }

    var selectorProps = $.extend({
      precision: viewModel['precision'],
      precisions: viewModel['precisions'],
      granularity: viewModel['granularity'],
      granularities: viewModel['granularities'],
      start: viewModel['start'],
      calendarEnd: viewModel['calendarEnd'],
      calendarStart: viewModel['calendarStart'],
      end:  viewModel['end'],
      max: viewModel['max'],
      min: viewModel['min'],
      labels: viewModel['labels'],
      isSelected: selectorModel.isSelected,
      calendarFormat: viewModel['calendarFormat'],
      dateFormat: viewModel['dateFormat'],
      foldDirection: viewModel['foldDirection']
    }, selectorModel );

    selectorBlock
      .mount( $selector )
      .update( selectorProps );

    return $selector;
  }

  function clickOnDisplay ( ) {
    this.trigger( 'clickOnDisplay' );
  }
  function apply (){
    this.trigger( 'apply' );
  }
  function cancel (){
    this.trigger( 'cancel' );
  }
  function clickOutside(){
    this.trigger( 'clickOutside' );
  }

  function getClickOutsideCallback ( ){
    var uniqueId = this.getViewId();

    function isInside ( ev ){
      return ( $(ev.target).parents('.date-range-selector-block').length > 0 ) && ( $(ev.target).parents('.' + uniqueId ).length > 0 );
    }

    function callback ( ev ){
      if (!isInside(ev)) {
        clickOutside.call(this);
      }
    }

    return _.bind( callback , this );
  }


  // Public
  function render ( target , viewModel ){
    this.base.apply( this, arguments );

    var typedSelectors = _.filter( viewModel['selectors'], function ( s ){ return !!s.type; } );
    if ( viewModel['isDropdownOpen'] ) {
      $(target).find('.selectors-body').append(
        _.map( typedSelectors , _.bind( renderSelector, this, viewModel ) )
      )
    }

    this.bindToViewport( getClickOutsideCallback.call(this) );
  }


  // Exports
  return BaseView.extend( {
    components: {
      'predefined': PredefinedBlock,
      'custom': CustomRangeBlock
    },
    events: {
      'click .range-display': clickOnDisplay,
      'click .apply-button': apply,
      'click .cancel-button': cancel
    },
    template: DateRangeSelectorViewTemplate,
    render: render
  } );

} )( window.wd.dateRangeSelectorModules.BaseView , $ , _ , window.wd.dateRangeSelectorModules.PredefinedRangeBlock , window.wd.dateRangeSelectorModules.CustomRangeBlock , window.wd.dateRangeSelectorModules.DateRangeSelectorViewTemplate , window.wd.dateRangeSelectorModules.DateRangeSelectorViewItemTemplate );


window.wd.dateRangeSelectorModules.DateRangeSelectorBlock = ( function ( BaseBlock , DateRangeSelectorView , DateRangeSelectorController , DateRangeSelectorDefaults  ) {
  //'use strict';

  // Static
  function getDefaults ( ){
    return DateRangeSelectorDefaults.get.apply( DateRangeSelectorDefaults , arguments );
  }
  function setDefaults ( ){
    return DateRangeSelectorDefaults.set.apply( DateRangeSelectorDefaults , arguments );
  }


  // Constructor
  function DateRangeSelectorBlock ( opts ){
    this.base( opts );

    this.setView( new DateRangeSelectorView( ) );
    this.setController( new DateRangeSelectorController( this.getStateModel() , this.getPropsModel() , this.getView() ) );

  }


  // Exports
  return BaseBlock.extend( {
    constructor: DateRangeSelectorBlock
  },{
    setDefaults: setDefaults,
    getDefaults: getDefaults
  } );


} )( window.wd.dateRangeSelectorModules.BaseBlock, window.wd.dateRangeSelectorModules.DateRangeSelectorView , window.wd.dateRangeSelectorModules.DateRangeSelectorController, window.wd.dateRangeSelectorModules.DateRangeSelectorDefaults  );






