/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

var dash, Dashboards = dash = {

  ERROR_CODES:{
    'QUERY_TIMEOUT' : {
      msg: "Query timeout reached"
    },
    "COMPONENT_ERROR" : {
      msg: "Error processing component"
    }
  },
  CDF_BASE_PATH: wd.cdf.endpoints.getCdfBase(),
  parameterModel: new Backbone.Model(),
  viewFlags: {
    UNUSED: "unused",
    UNBOUND: "unbound",
    VIEW: "view"
  },
  /* globalContext determines if components and params are retrieved
   * from the current window's object or from the Dashboards singleton
   */
  globalContext: true,
  escapeParameterValues : true,
  _flatParameters: false,
  /* Used to control progress indicator for async mode */
  runningCalls: 0,
  components: [],
  /* Holds the dashboard parameters if globalContext = false */
  parameters: [],

  // Holder for context
  context:{},

  // Init Counter, for subdashboards
  initCounter: 0,

  /*
   * Legacy dashboards don't have priority, so we'll assign a very low priority
   * to them.
   * */

  legacyPriority: -1000,

  /* Log lifecycle events? */
  logLifecycle: true,

  args: [],
  monthNames : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

  lastServerResponse: (Date.now) ? Date.now() : new Date().valueOf(),
  serverCheckResponseTimeout: 1800000, //ms, will be overridden at init
  /* Reference to current language code . Used in every place where jquery
   * plugins used in CDF hasm native internationalization support (ex: Datepicker)
   */
  i18nCurrentLanguageCode : null,
  i18nSupport : null  // Reference to i18n objects
};


_.extend(Dashboards, Backbone.Events);

// Log
Dashboards.log = function(m,type){
  if (typeof console != "undefined" ){
    if (type && console[type]) {
      console[type]("CDF: " + m);
    }else if (type === 'exception' &&
        !console.exception) {
      console.error(m.stack);
    }
    else {
      console.log("CDF: " + m);
    }
  }
};

Dashboards.error = function(m){
  this.log(m, 'error');
}

Dashboards.getWebAppPath = function (){
  return webAppPath;
}

Dashboards.setGlobalContext = function(globalContext) {
  this.globalContext = globalContext;
};

Dashboards._setFlatParameters = function(flatParameters) {
  this._flatParameters = flatParameters;
};

Dashboards.showProgressIndicator = function() {
  $.blockUI && this.blockUIwithDrag();
};

Dashboards.hideProgressIndicator = function(force) {
  if (force) {
    this.runningCalls = 0;
  }
  $.unblockUI && $.unblockUI();
  this.showErrorTooltip();// Dashboards.Legacy
};

Dashboards.resetRunningCalls = function(){
  this.runningCalls = 0;
  setTimeout(_.bind(function(){
    this.hideProgressIndicator();
  },this),10);
};

Dashboards.getRunningCalls = function (){
  return this.runningCalls;
};

Dashboards.incrementRunningCalls = function() {
  this.runningCalls++ ;
  this.showProgressIndicator();
//Dashboards.log("+Running calls incremented to: " + Dashboards.getRunningCalls());
};

Dashboards.decrementRunningCalls = function() {
  this.runningCalls-- ;
  //Dashboards.log("-Running calls decremented to: " + Dashboards.getRunningCalls());
  setTimeout(_.bind(function(){
    if(this.runningCalls<=0){
      this.hideProgressIndicator();
      this.runningCalls = 0; // Just in case
    }
  },this),10);
};

Dashboards.bindControl = function(control) {
  var Class = this._getControlClass(control);
  if(!Class) {
    this.log("Object type " + control["type"] + " can't be mapped to a valid class", "error");
  } else {
    this._castControlToClass(control, Class);
  }

  return this.bindExistingControl(control, Class);
};

Dashboards.bindExistingControl = function(control, Class) {
  if(!control.dashboard) {
    control.dashboard = this;
    delete control.initInstance;

    // Ensure BaseComponent's methods
    this._castControlToComponent(control, Class);

    // Make sure we clean all events in the case we're redefining the control.
    if(typeof control.off === "function") { control.off("all"); }

    // Endow it with the Backbone event system.
    if (!control.on){ $.extend(control, Backbone.Events); };

    // Add logging lifeCycle
    this._addLogLifecycleToControl(control);

    // For legacy dashboards, we'll automatically assign some priority for component execution.
    if(control.priority == null || control.priority === "") {
        control.priority = this.legacyPriority++;
    }
  }

  return control;
};

Dashboards._castControlToClass = function(control, Class) {
  if(!(control instanceof Class)) {
    var controlImpl = this._makeInstance(Class);

    // Copy implementation into control
    $.extend(control, controlImpl);
  }
};

Dashboards._getControlClass = function(control) {
  // see if there is a class defined for this control
  var typeName = control.type;
  if(typeof typeName === 'function') { typeName = typeName.call(control); } // <=> control.type() ; the _this_ in the call is _control_

  var TypeName = typeName.substring(0,1).toUpperCase() + typeName.substring(1);

  // try _TypeComponent_, _type_ and _Type_ as class names
  var typeNames = [TypeName + 'Component', typeName, TypeName];

  for (var i = 0, N = typeNames.length ; i < N ; i++) {
    // TODO: window represents access to the JS global object.
    // This, or a special object on which to eval types, should be provided by some FWK.

    // If the value of a name is not a function, keep on trying.
    var Class = window[typeNames[i]];
    if(Class && typeof Class === 'function') { return Class; }
  }
  // return undefined;
};

Dashboards._makeInstance = function(Class, args) {
  var o = Object.create(Class.prototype);
  if(args) { Class.apply(o, args); } else { Class.apply(o); }
  return o;
};

Dashboards._castControlToComponent = function(control, Class) {
  // Extend control with BaseComponent methods, if it's not an instance of it.
  // Also, avoid extending if _Class_ was already applied
  // and it is a subclass of BaseComponent.
  if(!(control instanceof BaseComponent) &&
     (!Class || !(Class.prototype instanceof BaseComponent))) {

    var baseProto = BaseComponent.prototype;
    for(var p in baseProto) {
      if(baseProto.hasOwnProperty(p) &&
         (control[p] === undefined) &&
         (typeof baseProto[p] === 'function')) {
        switch(p) {
          // Exceptions
          case 'base': break;

          // Copy
          default: control[p] = baseProto[p]; break;
        }
      }
    }
  }
};

Dashboards._addLogLifecycleToControl = function(control) {
  // TODO: Could the _typeof console !== "undefined"_ test be made beforehand,
  // to avoid always installing the catch-all handler?
  // The same could be said for the _this.logLifecycle_ test.
  // To still allow changing the value dynamically, a Dashboards.setLogLifecycle(.) method could be provided.

  // Add logging lifeCycle
  control.on("all", function(e) {
    var dashs = this.dashboard;
    if(dashs && dashs.logLifecycle && e !== "cdf" && this.name !== "PostInitMarker" && typeof console !== "undefined") {
      var eventStr;
      var eventName = e.substr(4);
      switch(eventName) {
        case "preExecution":  eventStr = ">Start"; break;
        case "postExecution": eventStr = "<End  "; break;
        case "error":         eventStr = "!Error"; break;
        default:              eventStr = "      "; break;
      }
      
      var timeInfo = Mustache.render("Timing: {{elapsedSinceStartDesc}} since start, {{elapsedSinceStartDesc}} since last event", this.splitTimer());
      console.log("%c          [Lifecycle " + eventStr + "] " + this.name + " [" + this.type + "]"  + " (P: "+ this.priority +" ): " +
          eventName + " " + timeInfo +" (Running: "+ this.dashboard.runningCalls  +")","color: " + this.getLogColor());
    }
  });
};


Dashboards.restoreDuplicates = function() {
  /*
   * We mark duplicates by appending an _nn suffix to their names.
   * This means that, when we read the parameters from bookmarks,
   * we can look for the _nn suffixes, and infer from those suffixes
   * what duplications were triggered, allowing us to reproduce that
   * state as well.
   */
  var dupes = this.components.filter(function(c){return c.type == 'duplicate'}),
      suffixes = {},
      params = this.getBookmarkState().params || {};
  /*
   * First step is to go over the bookmarked parameters and find
   * all of those that end with the _nn suffix (possibly several
   * such suffixes piled up, like _1_2, as we can re-duplicate
   * existing duplicates).
   *
   * The suffixes object then maps those suffixes to a mapping of
   * the root parameter names to their respective values.
   * E.g. a parameter 'foo_1 = 1' yields '{_1: {foo: 1}}'
   */
  Object.keys(params).filter(function(e){
      return /(_[0-9]+)+$/.test(e);
  }).map(function(e){
      var parts = e.match(/(.*?)((_[0-9]+)+)$/),
          name = parts[1],
          suffix = parts[2];
      if(!suffixes[suffix]){
          suffixes[suffix] = {}
      }
      suffixes[suffix][name] = params[e];
      return e;
  });


  /*
   * Once we have the suffix list, we'll check each suffix's
   * parameter list against each of the DuplicateComponents
   * in the dashboard. We consider that a suffix matches a
   * DuplicateComponent if the suffix contains all of the
   * Component's Bookmarkable parameters. If we're satisfied
   * that such a match was found, then we tell the Component
   * to trigger a duplication with the provided values.
   */
  var myself = this;
  for (var s in suffixes) if (suffixes.hasOwnProperty(s)) {
    var params = suffixes[s];
    $.each(dupes,function(i,e){
      var p;
      for (p = 0; p < e.parameters.length;p++) {
        if (!params.hasOwnProperty(e.parameters[p]) && myself.isBookmarkable(e.parameters[p])) {
          return;
        }
      }
      e.duplicate(params);
    });
  }
}
Dashboards.blockUIwithDrag = function() {
  if (typeof this.i18nSupport !== "undefined" && this.i18nSupport != null) {
    // If i18n support is enabled process the message accordingly
    // but we're just setting the same img
    $.blockUI.defaults.message = '<div class="img blockUIDefaultImg" style="padding: 0px;"></div>';
  }

  $.blockUI();
  var handle = $('<div id="blockUIDragHandle"></div>')
  $("div.blockUI.blockMsg").prepend(handle);
  $("div.blockUI.blockMsg").draggable({
    handle: "#blockUIDragHandle"
  });
};

Dashboards.updateLifecycle = function(object) {
    var silent = object.lifecycle ? !!object.lifecycle.silent : false;

    if( object.disabled ){
      return;
    }
    if(!silent) {
      this.incrementRunningCalls();
    }
    var handler = _.bind(function() {
      try {
        var shouldExecute;
        if(!(typeof(object.preExecution)=='undefined')){
          shouldExecute = object.preExecution.apply(object);
        }
        /*
         * If `preExecution` returns anything, we should use its truth value to
         * determine whether the component should execute. If it doesn't return
         * anything (or returns `undefined`), then by default the component
         * should update.
         */
        shouldExecute = typeof shouldExecute != "undefined"? !!shouldExecute : true;
        object.trigger('cdf cdf:preExecution', object, shouldExecute);
        if (!shouldExecute) {
          return; // if preExecution returns false, we'll skip the update
        }
        if (object.tooltip != undefined){
          object._tooltip = typeof object["tooltip"]=='function'?object.tooltip():object.tooltip;
        }
        // first see if there is an objectImpl
        if ((object.update != undefined) &&
          (typeof object['update'] == 'function')) {
          object.update();

          // check if component has periodic refresh and schedule next update
          this.refreshEngine.processComponent(object);

        } else {
        // unsupported update call
        }

        if(!(typeof(object.postExecution)=='undefined')){
          object.postExecution.apply(object);
        }
        // if we have a tooltip component, how is the time.
        if (object._tooltip != undefined){
          $("#" + object.htmlObject).attr("title",object._tooltip).tooltip({
            delay:0,
            track: true,
            fade: 250
          });
        }
      } catch (e) {
        var ph = (object.htmlObject) ? $('#' + object.htmlObject) : undefined,
            msg = Dashboards.getErrorObj('COMPONENT_ERROR').msg
                  + ' (' + object.name.replace('render_', '') + ')';
        this.errorNotification( { msg: msg  } , ph );
        this.log("Error updating " + object.name +":",'error');
        this.log(e,'exception');
      } finally {
        if(!silent) {
          this.decrementRunningCalls();
        }
      }

      // Triggering the event for the rest of the process
      object.trigger('cdf cdf:postExecution', object);

  },this);
  setTimeout(handler,1);
};

Dashboards.update = function(component) {
  /*
   * It's not unusual to have several consecutive calls to `update` -- it can
   * happen, e.g, as a result of using `DuplicateComponent` to clone a number
   * of components. If we pass each update individually to `updateAll`, the
   * first call will pass through directly, while the remaining calls will
   * result in the components being queued up for update only after the first
   * finished. To prevent this, we build a list of components waiting to be
   * updated, and only pass those forward to `updateAll` if we haven't had any
   * more calls within 5 miliseconds of the last.
   */
  if(!this.updateQueue){
    this.updateQueue = [];
  }
  this.updateQueue.push(component);
  if(this.updateTimeout) {
    clearTimeout(this.updateTimeout);
  }

  var handler = _.bind(function(){
    this.updateAll(this.updateQueue);
    delete this.updateQueue;
  },this);
  this.updateTimeout = setTimeout(handler,5);
};

Dashboards.updateComponent = function(object) {
  if(Date.now() - Dashboards.lastServerResponse > Dashboards.serverCheckResponseTimeout) {
    //too long in between ajax communications
    if(!Dashboards.checkServer()) {
      Dashboards.hideProgressIndicator();
      Dashboards.loginAlert();
      throw "not logged in";
    }
  }

  if(object.isManaged === false && object.update) {
    object.update();
  // check if component has periodic refresh and schedule next update
    this.refreshEngine.processComponent(object);
  } else {
    this.updateLifecycle(object);
  }
};


Dashboards.getComponent = dash.getComp = function(name){
  for (var i in this.components){
    if (this.components[i].name == name)
      return this.components[i];
  }
};

Dashboards.getComponentByName = function(name) {
  if (this.globalContext) {
    return eval(name);
  } else {
    return this.getComponent(name);
  }
};

Dashboards.addComponents = function(components) {
  components.forEach(function(component) {
    this.bindControl(component);
    this.components.push(component);
  }, this);
};

Dashboards.addComponent = function(component, options) {
  this.removeComponent(component);

  // Attempt to convert over to component implementation
  this.bindControl(component);

  var index = options && options.index;
  var L = this.components.length;
  if(index == null || index < 0 || index > L) { index = L; } // <=> push
  this.components[index] = component;
};

Dashboards.getComponentIndex = function(compOrNameOrIndex) {
  if(compOrNameOrIndex != null) {
    switch(typeof compOrNameOrIndex) {
      case 'string':
        for(var i = 0, cs = this.components, L = cs.length ; i < L ; i++) {
          if(cs[i].name === compOrNameOrIndex) { return i; }
        }
        break;
      case 'number': //really?
        if(compOrNameOrIndex >= 0 && compOrNameOrIndex < this.components.length) {
          return compOrNameOrIndex;
        }
        break;

      default: return this.components.indexOf(compOrNameOrIndex);
    }
  }
  return -1;
};

Dashboards.removeComponent = function(compOrNameOrIndex) {
  var index = this.getComponentIndex(compOrNameOrIndex);
  var comp = null;
  if(index >= 0) {
    var cs = this.components;
    comp = cs[index];
    cs.splice(index, 1);
    comp.dashboard = null;
    
    comp.off('cdf:postExecution');
    comp.off('cdf:preExecution');
    comp.off('cdf:error');
    comp.off('all');
  }

  return comp;
};

Dashboards.registerEvent = function (ev, callback) {
  if (typeof this.events == 'undefined') {
    this.events = {};
  }
  this.events[ev] = callback;
};

Dashboards.addArgs = function(url){
  if(url != undefined)
    this.args = getURLParameters(url);
};

Dashboards.setI18nSupport = function(lc, i18nRef) {
  // Update global reference to i18n objects if needed
  if (i18nRef !== "undefined" && lc !== "undefined") {
    this.i18nCurrentLanguageCode = lc;
    this.i18nSupport = i18nRef;
  }

};

Dashboards.init = function(components){
  var myself = this;


  // We're now adding support for multiple inits. This part is only relevant for 
  // the first execution. 

  var initInstance = Dashboards.initCounter++;
  Dashboards.log("InitInstance " + initInstance);

  if( initInstance == 0 ){

    this.syncDebugLevel();

    if(this.initialStorage) {
      _.extend(this.storage, this.initialStorage);
    } else {
      this.loadStorage();
    }

    if(this.context != null && this.context.sessionTimeout != null ) {
      //defaulting to 90% of ms value of sessionTimeout
      Dashboards.serverCheckResponseTimeout = this.context.sessionTimeout * 900;
    }

    this.restoreBookmarkables();
    this.restoreView();
    this.syncParametersInit();

  }
  
  if($.isArray(components)) { this.addComponents(components); }

  // Now we need to go through all components we have and attach this
  // initInstance to all 
  _.chain(Dashboards.components)
  .where({initInstance:undefined})
  .each(function(c){ c.initInstance = initInstance});
  
  $(function() { myself.initEngine(initInstance); });
};


/* Keep parameters master and slave in sync. The master parameter's
 * initial value takes precedence over the slave parameter's when
 * initializing the dashboard.
 */
Dashboards.syncParameters = function(master, slave) {
  this.setParameter(slave, this.getParameterValue(master));
  this.parameterModel.on("change:" + master,function(m,v,o){
    this[o.notify?'fireChange':'setParameter'](slave,v)
  },this);
  this.parameterModel.on("change:" + slave,function(m,v,o){
    this[o.notify?'fireChange':'setParameter'](master,v)
  },this);
}

Dashboards.chains = [];
Dashboards.syncedParameters = {};
/* Register parameter pairs that will be synced on dashboard init. We'll store
 * the dependency pairings in Dashboards.syncedParameters,as an object mapping
 * master parameters to an array of all its slaves (so {a: [b,c]} means that
 * both *b* and *c* are subordinate to *a*), and in Dashboards.chains wel'll
 * store an array of arrays representing a list of separate dependency trees.
 * An entry of the form [a, b, c] means that *a* doesn't depend on either *b*
 * or *c*, and that *b* doesn't depend on *c*. Inversely, *b* depends on *a*,
 * and *c* depends on either *a* or *b*. You can have multiple such entries,
 * each representing a completely isolated set of dependencies.
 *
 * Note that we make no effort to detect circular dependencies. Behaviour is
 * undetermined should you provide such a case.
 */
Dashboards.syncParametersOnInit = function (master, slave){
  var parameters = this.syncedParameters,
      currChain,
      masterChain,
      slaveChain, slaveChainIdx, i;
  if(!parameters[master]) parameters[master] = [];
  parameters[master].push(slave);

  /* When inserting an entry into Dashboards.chains, we need to check whether
   * any of the master or the slave are already in one of the chains.
   */
  for (i = 0; i < this.chains.length;i++) {
    currChain = this.chains[i];
    if (currChain.indexOf(master) > -1) {
      masterChain = currChain;
    }
    if (currChain.indexOf(slave) > -1) {
      slaveChain = currChain;
      slaveChainIdx = i;
    }
  }
  /* If both slave and master are present in different chains, we merge the
   * chains.
   *
   * If only one of the two is present, we insert the slave at the end
   * of the master's chain, or the master at the head of the slave's chain.
   *
   * Note that, since a parameter can be both a master and a slave, and because
   * no slave can have two masters, it is guaranteed that we can only add the
   * master to the head of the chain if the slave was the head before, and, when
   * adding the slave at the end of the master's chain, none of the parameters
   * between master and slave can depend on the slave. This means there is no
   * scenario where a chain can become inconsistent from prepending masters or
   * appending slaves.
   *
   * If neither master nor slave is present in the existing chains, we create a
   * new chain with [master, slave].
   */
  if(slaveChain && masterChain) {
    if (masterChain != slaveChain) {
      args = slaveChain.slice();
      args.unshift(0);
      args.unshift(masterChain.length);
      [].splice.apply(masterChain,args);
      this.chains.splice(slaveChainIdx,1);
    }
  } else if (slaveChain) {
      slaveChain.unshift(master);
  } else if(masterChain) {
      masterChain.push(slave)
  } else {
    this.chains.push([master, slave]);
  }
}

/*
 * Iterate over the registered parameter syncing chains,
 * and configure syncing for each parameter pair.
 */
Dashboards.syncParametersInit = function() {
  var parameters = this.syncedParameters,
      i,j,k,master, slave;
  for(i = 0; i < this.chains.length;i++) {
    for(j = 0; j < this.chains[i].length;j++) {
      var master = this.chains[i][j];
      if(!parameters[master]) continue;
      for(k = 0; k < parameters[master].length; k++) {
        slave = parameters[master][k];
        this.syncParameters(master,slave);
      }
    }
  }
}


Dashboards.initEngine = function(initInstance) {
  // Should really throw an error? Or return?
  if(this.waitingForInit && this.waitingForInit.length) {
    this.log("Overlapping initEngine!", 'warn');
  }

  var myself = this;
  var components = initInstance != null 
    ? _.where(this.components, {initInstance: initInstance})
    : this.components;

  if( (!this.waitingForInit || this.waitingForInit.length === 0) && !this.finishedInit ){
    this.incrementRunningCalls();
  }


  if( this.logLifecycle && typeof console != "undefined" ){
    console.log("%c          [Lifecycle >Start] Init[" + initInstance + "] (Running: "+
          this.getRunningCalls()  +")","color: #ddd ");
  }

  this.createAndCleanErrorDiv();
  // Fire all pre-initialization events
  if(typeof this.preInit == 'function') {
    this.preInit();
  }
  this.trigger("cdf cdf:preInit",this);
  /* Legacy Event -- don't rely on this! */
  $(window).trigger('cdfAboutToLoad');
  var myself = this;
  var updating = [],i;
  for(i = 0; i < components.length;i++) {
    if(components[i].executeAtStart) {
      updating.push(components[i]);
    }
  }

  if (!updating.length) {
    this.handlePostInit();
    return;
  }

  // Since we can get into racing conditions between last component's
  // preExecution and dashboard.postInit, we'll add a last component with very
  // low priority who's funcion is only to act as a marker.
  var postInitComponent = {
    name: "PostInitMarker",
    type: "unmanaged",
    lifecycle: {
      silent: true
    },
    executeAtStart: true,
    priority:999999999
  };
  this.bindControl(postInitComponent)
  updating.push(postInitComponent);


  this.waitingForInit = updating.slice();

  var callback = function(comp,isExecuting) {
    /*
     * The `preExecution` event will pass two arguments (the component proper
     * and a flag telling us whether the preExecution test passed), so we can
     * test for that, and check whether the component is executing or not.
     * If it's not going to execute, we should check for postInit right now.
     * If it is, we shouldn't do anything.right now.
     */
    if(arguments.length == 2 && isExecuting) {
      return;
    }
    this.waitingForInit = _(this.waitingForInit).without(comp);
    comp.off('cdf:postExecution',callback);
    comp.off('cdf:preExecution',callback);
    comp.off('cdf:error',callback);
    this.handlePostInit(initInstance);
  }

  for(var i= 0, len = updating.length; i < len; i++){
    var component = updating[i];
    component.on('cdf:postExecution cdf:preExecution cdf:error',callback,myself);
  }
  Dashboards.updateAll(updating);
  if(components.length > 0) {
    myself.handlePostInit(initInstance);
  }

};

Dashboards.handlePostInit = function(initInstance) {
  if( (!this.waitingForInit || this.waitingForInit.length === 0) && !this.finishedInit ) {
    this.trigger("cdf cdf:postInit",this);
    /* Legacy Event -- don't rely on this! */
    $(window).trigger('cdfLoaded');

    if(typeof this.postInit == "function") {
      this.postInit();
    }
    this.restoreDuplicates();
    this.finishedInit = true;

    this.decrementRunningCalls();
    if( this.logLifecycle && typeof console != "undefined" ){
      console.log("%c          [Lifecycle <End  ] Init[" + initInstance + "] (Running: "+
            this.getRunningCalls()  +")","color: #ddd ");
    }

  }
};

Dashboards.debug = 1;

Dashboards.syncDebugLevel = function() {
  var level = 1; // log errors
  try {
    var urlIfHasDebug = function(url) { return url && (/\bdebug=true\b/).test(url) ? url : null; };
    var url = urlIfHasDebug(window.location.href) ||
              urlIfHasDebug(window.top.location.href);
    if(url) {
        var m = /\bdebugLevel=(\d+)/.exec(url);
        level = m ? (+m[1]) : 3;
    }
  } catch(ex) {
    // swallow
  }

  return this.debug = level;
};

Dashboards.resetAll = function(){
  this.createAndCleanErrorDiv(); //Dashboards.Legacy
  var compCount = this.components.length;
  for(var i= 0, len = this.components.length; i < len; i++){
    this.components[i].clear();
  }
  var compCount = this.components.length;
  for(var i= 0, len = this.components.length; i < len; i++){
    if(this.components[i].executeAtStart){
      this.update(this.components[i]);
    }
  }
};

Dashboards.processChange = function(object_name){

  //Dashboards.log("Processing change on " + object_name);

  var object = this.getComponentByName(object_name);
  var parameter = object.parameter;
  var value;
  if (typeof object['getValue'] == 'function') {
    value = object.getValue();
  }
  if (value == null) // We won't process changes on null values
    return;

  if(!(typeof(object.preChange)=='undefined')){
    var preChangeResult = object.preChange(value);
    value = preChangeResult != undefined ? preChangeResult : value;
  }
  if(parameter) {
    this.fireChange(parameter,value);
  }
  if(!(typeof(object.postChange)=='undefined')){
    object.postChange(value);
  }
};

/* fireChange must accomplish two things:
 * first, we must change the parameters
 * second, we execute the components that listen for
 * changes on that parameter.
 *
 * Because some browsers won't draw the blockUI widgets
 * until the script has finished, we find the list of
 * components to update, then execute the actual update
 * in a function wrapped in a setTimeout, so the running
 * script has the opportunity to finish.
 */
Dashboards.fireChange = function(parameter, value) {
  var myself = this;
  this.createAndCleanErrorDiv(); //Dashboards.Legacy

  this.setParameter(parameter, value, true);
  var toUpdate = [];
  var workDone = false;
  for (var i= 0, len = this.components.length; i < len; i++){
    if ($.isArray(this.components[i].listeners)){
      for (var j= 0 ; j < this.components[i].listeners.length; j++){
        var comp = this.components[i];
        if (comp.listeners[j] == parameter && !comp.disabled) {
          toUpdate.push(comp);
          break;
        }
      }
    }
  }
  myself.updateAll(toUpdate);

};


/* Update components by priority. Expects as parameter an object where the keys
 * are the priorities, and the values are arrays of components that should be
 * updated at that priority level:
 *
 *    {
 *      0: [c1,c2],
 *      2: [c3],
 *      10: [c4]
 *    }
 *
 * Alternatively, you can pass an array of components, `[c1, c2, c3]`, in which
 * case the priority-keyed object will be created internally from the priority
 * values the components declare for themselves.
 *
 * Note that even though `updateAll` expects `components` to have numerical
 * keys, and that it does work if you pass it an array, `components` should be
 * an object, rather than an array, so as to allow negative keys (and so that
 * we can use it as a sparse array of sorts)
 */
Dashboards.updateAll = function(components) {
  if(!this.updating) {
    this.updating = {
      tiers: {},
      current: null
    };
  }
  if(components && _.isArray(components) && !_.isArray(components[0])) {
    var comps = {};
    _.each(components,function(c) {
      if(c) {
        var prio = c.priority || 0;
        if (!comps[prio]) {
          comps[prio] = [];
        }
        comps[prio].push(c);
      }
    });
    components = comps;
  }
  this.mergePriorityLists(this.updating.tiers,components);

  var updating = this.updating.current;
  if(updating === null || updating.components.length == 0) {
    var toUpdate = this.getFirstTier(this.updating.tiers);
    if(!toUpdate) return;
    this.updating.current = toUpdate;

    var postExec = function(component,isExecuting) {
      /*
       * We first need to figure out what event we're handling. `error` will
       * pass the component, error message and caught exception (if any) to
       * its event handler, while the `preExecution` event will pass two
       * arguments (the component proper and a flag telling us whether the
       * preExecution test passed).
       *
       * If we're not going to finish updating the component, either because
       * `preExecution` cancelled the update, or because we're in an `error`
       * event handler, we should queue up the next component right now.
       */
      if(arguments.length == 2 && typeof isExecuting == "boolean" && isExecuting) {
        return;
      }
      component.off("cdf:postExecution",postExec);
      component.off("cdf:preExecution",postExec);
      component.off("cdf:error",postExec);
      var current = this.updating.current;
      current.components = _.without(current.components, component);
      var tiers = this.updating.tiers;
      tiers[current.priority] = _.without(tiers[current.priority], component);
      this.updateAll();
    }
    /*
     * Any synchronous components we update will edit the `current.components`
     * list midway through this loop, so we need a separate copy of that list
     * so as to avoid messing up the indices.
     */
    var comps = this.updating.current.components.slice();
    for(var i = 0; i < comps.length;i++) {
      component = comps[i];
      // Start timer
      component.startTimer();
      component.on("cdf:postExecution cdf:preExecution cdf:error",postExec,this);

      // Logging this.updating. Uncomment if needed to trace issues with lifecycle
      // Dashboards.log("Processing "+ component.name +" (priority " + this.updating.current.priority +"); Next in queue: " +
      //  _(this.updating.tiers).map(function(v,k){return k + ": [" + _(v).pluck("name").join(",") + "]"}).join(", "));
      this.updateComponent(component);
    }
  }
}

/*
 * Given a list of component priority tiers, returns the highest priority
 * non-empty tier of components awaiting update, or null if no such tier exists.
 */
Dashboards.getFirstTier = function(tiers) {
  var keys = _.keys(tiers).sort(function(a,b){
    return parseInt(a,10) - parseInt(b,10);
  });

  var tier;
  for(var i = 0;i < keys.length;i++) {
    tier = tiers[keys[i]];
    if(tier.length > 0) {
      return { priority: keys[i], components: tier.slice() };
    }
  }
  return null;
}

/*
 * Add all components in priority list 'source' into priority list 'target'
 */
Dashboards.mergePriorityLists = function(target,source) {
  if(!source) {
    return;
  }
  for(var key in source) if (source.hasOwnProperty(key)) {
    if(_.isArray(target[key])) {
      target[key] = _.union(target[key],source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

Dashboards.restoreView = function() {
  var p, params;
  if(!this.view) return;
  /* Because we're storing the parameters in OrientDB, and as OrientDB has some
   * serious issues when storing nested objects, we're stuck marshalling the
   * parameters into a JSON object and converting that JSON into a Base64 blob
   * before storage. So now we have to decode that mess.
   */
  params = JSON.parse(Base64.decode(this.view.params));
  for(p in params) if (params.hasOwnProperty(p)) {
    this.setParameter(p,params[p]);
  }
};


Dashboards.setParameterViewMode = function(parameter, value) {
    if(!this.viewParameters) this.viewParameters = {};
    if (arguments.length === 1) value = this.viewFlags.VIEW;
    //if(!Dashboards.viewFlags.hasOwnProperty(value)) throw
    this.viewParameters[parameter] = value;
};

Dashboards.isViewParameter = function(parameter) {
    if(!this.viewParameters) {return false;}
    return this.viewParameters[parameter];
};

/*
 * List the values for all dashboard parameters flagged as being View parameters
 */
Dashboards.getViewParameters = function(){
  if(!this.viewParameters) return {};
  var params = this.viewParameters,
      ret = {};
  for(var p in params) if (params.hasOwnProperty(p)) {
    if (params[p] == this.viewFlags.VIEW|| params[p] == this.viewFlags.UNBOUND) {
      ret[p] = this.getParameterValue(p);
    }
  }
  return ret;
};

/*
 * List all dashboard parameters flagged as being Unbound View parameters
 */

Dashboards.getUnboundParameters = function(){
  if(!this.viewParameters) return [];
  var params = this.viewParameters,
      ret = []
  for(var p in params) if (params.hasOwnProperty(p)) {
    if (params[p] == this.viewFlags.UNBOUND) {
      ret.push(p);
    }
    return ret;
  }
};

/**
 * Gets the object where the parameters are being stored
 *
 * @returns the parameter store
 * @private
 */
Dashboards._getParameterStore = function(){
  return this.globalContext ? window : this.parameters;
};

/**
 * Verifies if a parameter is available in the Parameter Model
 *
 * @param name of the parameter
 * @returns boolean
 * @private
 */
Dashboards._isParameterInModel = function(name){
  return this.parameterModel.attributes.hasOwnProperty(name) ;
};

/**
 * Gets the value from a context o from the property with a given path
 *
 * @param o the context of the assignment
 * @param path the path of the property
 * @returns the value of the property
 * @private
 */
Dashboards._getValueFromContext = function(o, path) {
  if (!o) return; //undefined
  if (null != path) {
    if (this._flatParameters) {
      return o[path];
    } else {
      var parts = (path instanceof Array) ? path : path.split("."), L = parts.length;
      if (L) for (var i = 0; L > i; ) {
        var part = parts[i++], value = o[part];
        if (null == value) {
          return; //the path requested is undefined
        }
        o = value;
      }
    }
  }
  return o;
};

/**
 * Sets a property path in a context o with v as value
 *
 * @param o the context of the assignment
 * @param path the path of the property
 * @param v the value of the property
 * @returns the value of the property assigned
 * @private
 */
Dashboards._setValueInContext = function(o, path, v) {
  if (o && null != path) {
    if (this._flatParameters) {
      o[path] = v;
    } else {
      var parts = (path instanceof Array) ? path : path.split(".");
      if (parts.length) {
        var pLast = parts.pop();
        o = this._getValueFromContext(o, parts);
        if (o) o[pLast] = v;
      }
    }
  }
  return o;
};

/**
 * Adds a parameter new parameter to the parameter module.
 * Receives a parameter name and an initial value, that will be used if the parameter is
 * not available in the parameter model. Otherwise, the getParameterValue return is used
 *
 * @param name the name of the parameter
 * @param initValue the initial value of the parameter
 * @returns the value assigned to the parameter
 */
Dashboards.addParameter = function(name, initValue){
  if(this._isParameterInModel(name)){
    initValue = this.getParameterValue(name);
  }
  this.setParameter(name,initValue);
  return initValue;
};

Dashboards.getParameterValue = dash.getParam = function (parameterName) {
  var parameterStore = this._getParameterStore();
  return this._getValueFromContext(parameterStore, parameterName);
};

Dashboards.setParameter = dash.setParam = function(parameterName, parameterValue, isNotified) {
  if(parameterName == undefined || parameterName == "undefined"){
    this.log('Dashboards.setParameter: trying to set undefined!!','warn');
    return;
  }
  var parameterStore = this._getParameterStore();
  if(!this.globalContext && this.escapeParameterValues){
    this._setValueInContext(parameterStore, parameterName, encode_prepare_arr(parameterValue));
  } else {
    this._setValueInContext(parameterStore, parameterName, parameterValue);
  }
  this.parameterModel.set(parameterName,parameterValue,{notify:isNotified});
  this.persistBookmarkables(parameterName);
};


Dashboards.post = function(url,obj){

  var form = '<form action="' + url + '" method="post">';
  for(var o in obj){

    var v = (typeof obj[o] == 'function' ? obj[o]() : obj[o]);

    if (typeof v == 'string') {
      v = v.replace(/"/g , "\'")
    }

    form += '"<input type="hidden" name="' + o + '" value="' + v + '"/>';
  }
  form += '</form>';
  jQuery(form).appendTo('body').submit().remove();
};

Dashboards.clone = function clone(obj) {

  var c = obj instanceof Array ? [] : {};

  for (var i in obj) {
    var prop = obj[i];

    if (typeof prop == 'object') {
      if (prop instanceof Array) {
        c[i] = [];

        for (var j = 0; j < prop.length; j++) {
          if (typeof prop[j] != 'object') {
            c[i].push(prop[j]);
          } else {
            c[i].push(this.clone(prop[j]));
          }
        }
      } else {
        c[i] = this.clone(prop);
      }
    } else {
      c[i] = prop;
    }
  }

  return c;
};

Dashboards.getArgValue  = function(key)
{
  for (i=0;i<this.args.length;i++){
    if(this.args[i][0] == key){
      return this.args[i][1];
    }
  }

  return undefined;
};

Dashboards.ev = function(o){
  return typeof o == 'function'?o():o
};

// STORAGE ENGINE

// Default object
Dashboards.storage = {};

// Operations
Dashboards.loadStorage = function(){
  var myself = this;
  // Don't do anything for anonymousUser.
  if( this.context && this.context.user === "anonymousUser") {
    return;
  }

  var args = {
    action: "read",
    _: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
  };

  $.getJSON(wd.cdf.endpoints.getStorage( args.action ), args, function(json) {
    $.extend(myself.storage,json);
  });
};

Dashboards.saveStorage = function(){
  var myself = this;
  // Don't do anything for anonymousUser
  if( this.context && this.context.user === "anonymousUser") {
    return;
  }

  var args = {
    action: "store",
    storageValue: JSON.stringify(this.storage),
    _: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
  };

  $.getJSON(wd.cdf.endpoints.getStorage( args.action ), args, function(json) {
    if(json.result != true){
      myself.log("Error saving storage",'error');
    }
  });
};

Dashboards.cleanStorage = function(){
  var myself = this;
  this.storage = {};

  // Don't do noting for anonymousUser
  if( this.context && this.context.user === "anonymousUser") {
    return;
  }

  var args = {
    action: "delete"
  };

  $.getJSON(wd.cdf.endpoints.getStorage( args.action ), args, function(json) {
    if(json.result != true){
      myself.log("Error deleting storage", 'error');
    }
  });
};

