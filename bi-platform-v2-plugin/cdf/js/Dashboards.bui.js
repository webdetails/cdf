
/************* Dashboards blocker extensions ***************/

/************* USAGE EXAMPLE *******************************
 *
 * 1. REGISTER NEW BLOCKERS
 *    Dashboards preInit is a good point to do this.
 *
 *    Dashboards.on('cdf:preInit' , function () {
 *      Dashboards.registerBlockerOpts({name: 'newBlocker' , ph: '#targetElement'});
 *    });
 *
 * 2. OVERRIDE COMPONENTS BLOCK FUNCTIONS
 *    The reason to only do this on the dashboard postInit is to let 
 *    the blocker be the global one at the start. This only works 
 *    if the code is ran before postInit, i.e., 
 *    components with executeAtStart = true.
 *
 *    var myself = this;
 *    Dashboards.on('cdf:postInit' , function (){
 *       myself.block = function (){
 *           Dashboards.incrementRunningCalls('newBlocker');
 *       }
 *       myself.unblock = function (){
 *           Dashboards.decrementRunningCalls('newBlocker');
 *       }
 *   });
 *
 ****************************************************************/

;(function ( myself ){

    var _registry = { };
    var _myself = {};
    var defaults = {
      name: 'full',
      ph: 'body',
      runningCalls: 0,
      extraOpts: { 
        message: '<div style="padding: 0px;"><img src="' + webAppPath + '/content/pentaho-cdf/resources/style/images/processing_transparent.gif" /></div>' ,
        css: {
          fadeIn: 0,
          left: '50%',
          top: '40%',
          marginLeft: '-16px',
          width: '32px',
          background: 'none',
          border: "none"
        },
        overlayCSS: { 
          backgroundColor: "#FFFFFF", 
          opacity: 0.8, 
          cursor: "wait"
        }
      }
    }
    
    _myself.registerBlockerOpts = function ( newOpts ){
      var opts = $.extend( {}, defaults, newOpts);
      if (opts.name){
        _registry[opts.name] = opts;
      }
    }
    _myself.registerBlockerOpts( { name:'full' } );

    _myself.getBlockerOpts = function ( blockerName ){
      return _registry[blockerName || 'full' ]
    }

    _myself.getRunningCalls = function (total, blockerName) {
      var out = null;
      if (arguments.length == 0){
        total = true
      } else if(arguments.length == 1){
        blockerName = total;
        total = true;
      }

      if (total){
        out = _.reduce( _registry, function(sum, b){
          return sum + b.runningCalls;
        }, 0);
      } else {
        var opts = _myself.getBlockerOpts( blockerName );
        if (opts){
          out = opts.runningCalls;
        }
      }

      return out
    }

    _myself.incrementRunningCalls = function (blockerName){
      var opts = _myself.getBlockerOpts( blockerName );
      if (opts){
        opts.runningCalls++;
        _myself.showProgressIndicator(blockerName);
      }
    }
    _myself.decrementRunningCalls = function(blockerName){
      var opts = _myself.getBlockerOpts( blockerName );
      if (opts){
        opts.runningCalls--;
        setTimeout(_.bind(function(){
          if( opts.runningCalls <= 0){
            _myself.hideProgressIndicator(blockerName);
            opts.runningCalls = 0; // Just in case
          }
        },this),100);
      }
    } 
    _myself.showProgressIndicator = function (blockerName){
      var opts = _myself.getBlockerOpts( blockerName );
      if (opts){
        if ( opts.name == 'full' || !opts.ph || isWindow( opts.ph ) ){
          $.blockUI( opts.extraOpts );
        } else {
          $(opts.ph).block( opts.extraOpts );
        }
      }
    }
    _myself.hideProgressIndicator = function(blockerName){
      var opts = _myself.getBlockerOpts( blockerName );
      if (opts){
        if ( opts.name == 'full' || !opts.ph || isWindow( opts.ph ) ){
          $.unblockUI( );
        } else {
          $(opts.ph).unblock();
        }
      }
    }
    var isWindow = function ( ph ){
      return $(ph).get(0) == window ;
    }

    
    myself = $.extend( myself, _myself );

})(Dashboards);



