/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
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
  /*
    used to keep compatibility with analyzer parameters with dots that do not require the path to be
    previously created
   */
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

  lastServerResponse: Date.now ? Date.now() : new Date().getTime(),
  serverCheckResponseTimeout: 1800000, //ms, will be overridden at init
  /* Reference to current language code . Used in every place where jquery
   * plugins used in CDF hasm native internationalization support (ex: Datepicker)
   */
  i18nCurrentLanguageCode : null,
  i18nSupport : null  // Reference to i18n objects
};


_.extend(Dashboards, Backbone.Events);

// Log
Dashboards.log = function(message, type, css) {
  type =  type || "log"; // default

  if(typeof console != "undefined" ) {
    if(!console[type]) {
      if(type === "exception") {
        type = "error";
        message = message.stack || message;
      } else {
        type = "log";
      }
    }
    if(css) {
      try {
        console[type]("%cCDF: " + message, css);
        return;
      } catch(e) {
        // styling is not supported
      }
    }
    console[type]("CDF: " + message);
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
      Dashboards.log("          [Lifecycle " + eventStr + "] " + this.name + " [" + this.type + "]" + " (P: "
        + this.priority + " ): " + eventName + " " + timeInfo + " (Running: " + this.dashboard.runningCalls  + ")",
        "log",
        "color: " + this.getLogColor());
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
   * more calls within 5 milliseconds of the last.
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
  if((Date.now ? Date.now() : new Date().getTime()) - Dashboards.lastServerResponse > Dashboards.serverCheckResponseTimeout) {
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

/**
 * Gets the name of a component given an object with a property <i>name</i>.
 * If a non-empty string is specified, or <i>component.name</i> is a non-empty string, it returns it.
 * If a <i>falsy</i> value is specified, <tt>undefined</tt> is returned.
 *
 * @param {object|string} component the component or a string representing the component's name.
 * @return {string|undefined} a string with the component's name or <tt>undefined</tt>.
 */
Dashboards.getComponentName = function(component) {
  if(!component) { return; }
  if(component.name && (typeof component.name === "string")) { return component.name; }
  if(typeof component === "string") { return component; }
};

/**
 * Gets the component given an object with a property <i>name</i> or a string containing the name.
 * If <i>component</i> is an object with property <i>name</i> it calls {@link Dashboards.getComponentByName} to search for the component
 * with name <i>component.name</i>. If <i>component</i> is a string it calls {@link Dashboards.getComponentByName} to search for the
 * component with name <i>component</i>.
 * If a <i>falsy</i> value is specified, <tt>undefined</tt> is returned.
 *
 * @param {object|string} component the component or a string representing the component's name.
 * @return {object|undefined} the component or <tt>undefined</tt>
 */
Dashboards.getComponent = dash.getComp = function(component) {
  var name = this.getComponentName(component);
  if(name) { return this.getComponentByName(name); }
};

/**
 * Gets the component given a string representing the component's name.
 * If <i>Dashboards.globalContext</i> is <tt>true</tt> it searches the global <i>window</i> object for the component with name <i>name</i>.
 * If <i>Dashboards.globalContext</i> is <tt>false</tt>, or the component is not found in the global <i>window</i> object, it searches the array
 * <i>components</i> for the component with name <i>name</i>.
 * If a <i>falsy</i> value is specified, <tt>undefined</tt> is returned.
 *
 * @param {string} name the component's name
 * @return {object|undefined} the component or <tt>undefined</tt>
 */
Dashboards.getComponentByName = function(name) {
  if(!name) { return; }
  if(this.globalContext && window[name]) { return window[name]; }
  for(var i = 0, cs = this.components, L = cs.length ; i < L ; i++) {
    var comp = cs[i];
    if(comp && comp.name === name) { return comp; }
  }
};

/**
 * Adds one or more components to the dashboard, replacing existing components with the same name.
 * If an array of components is specified it iterates through the array and calls {@link Dashboards.addComponent} for each
 * component and in the end returns the <i>Dashboards</i> object.
 * If a <i>falsy</i> value is specified, <tt>undefined</tt> is returned.
 *
 * @param {array} components the array of components to be added
 * @return {object|undefined} the Dashboards object or <tt>undefined</tt>
 */
Dashboards.addComponents = function(components) {
  if(!$.isArray(components)) { 
    this.log('Dashboards.addComponents: components in a structure other than an array will not be added!','warn');
    return;
  }
  components.forEach(function(component) {
    this.addComponent(component);
  }, this);
  return this;
};

/**
 * Adds a component to the dashboard, replacing the first component that has the same name if any exist.
 * If <i>component</i> doesn't have a property <i>component.name</i> or it isn't a valid string name undefined is returned.
 * If <i>options.index</i> is <i>nuly</i> the component is appended to the end of the <i>Dashboards.components</i> array.
 * If <i>options.index</i> is <i>truly</i> the component is appended to the <i>Dashboards.components</i> array at position <i>options.index</i>.
 * If <i>Dashboards.globalContext</i> is <tt>true</tt> it will also add the component into the global <i>window</i> object.
 *
 * @param {object} component the new component to be added
 * @param {object} options an object containing the property <i>options.index</i>
 * @return {boolean} <tt>true</tt> if the component was added and <tt>false</tt> otherwise
 */
Dashboards.addComponent = function(component, options) {
  // get the component's name
  var name = this.getComponentName(component);
  if(!name) {
    this.log('Dashboards.addComponent: failed attempting to add a component that has no name!','warn');
    return false;
  }
  // Remove a component that has the same name
  this.removeComponent(name);
  // Attempt to convert over to component implementation
  this.bindControl(component);
  // If globalContext is true add the component to the global window object
  if(this.globalContext) { window[name] = component; }
  // If options.index provided add the new component in the specified position of the array
  if (options && options.index && (options.index > -1) && (options.index < this.components.length)) {
    this.components.splice(options.index,0,component)
  } else {
    this.components.push(component);
  }
  return true;
};

/**
 * Get the index of the array <i>Dashboards.components</i> that contains the component.
 * If <i>compOrNameOrIndex</i> is a <tt>string</tt> search the component that first matches such name.
 * If <i>compOrNameOrIndex</i> is a <tt>number</tt> return it.
 * If <i>compOrNameOrIndex</i> is a component return the index where it is in <i>Dashboards.components</i>.
 *
 * @param {string|number|object} compOrNameOrIndex the name, index or the component to search
 * @return {number} the index where the component is at or <tt>-1</tt> if not found
 */
Dashboards.getComponentIndex = function(compOrNameOrIndex) {
  if(compOrNameOrIndex) {
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

/**
 * Removes a component from the <i>Dashboards.components</i> array.
 * If <i>compOrNameOrIndex</i> is a string the first component with such name is removed from the <i>components</i> array.
 * If <i>compOrNameOrIndex</i> is a number the component in such position in the <i>components</i> array is removed.
 * If <i>compOrNameOrIndex</i> is an object with a property <i>component.name</i> the first component with such name is
 * removed from the <i>components</i> array.
 * If <i>Dashboards.globalContext</i> is <tt>true</tt> it will also remove the component from the global <i>window</i> object.
 *
 * @param {object|string|number} compOrNameOrIndex the component object, the name of the component or the index of the component to be removed
 * @return {object|undefined} the removed component or undefined
 */
Dashboards.removeComponent = function(compOrNameOrIndex) {
  var index = this.getComponentIndex(compOrNameOrIndex);
  if(index === -1) { return; }
  var name = this.components[index].name;
  if(!name) {
    this.log('Dashboards.removeComponent: failed attempting to remove a component that has no name!','warn');
    return;
  }
  // If globalContext is true also remove the component from the global `window` object
  if(this.globalContext && window[name]) { window[name] = undefined; }
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
 * both *b* and *c* are subordinate to *a*), and in Dashboards.chains we'll
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
    Dashboards.log("          [Lifecycle >Start] Init[" + initInstance + "] (Running: " + this.getRunningCalls()  + ")",
      "log",
      "color: #ddd");
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
  // low priority who's function is only to act as a marker.
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
      Dashboards.log("          [Lifecycle <End  ] Init[" + initInstance + "] (Running: " + this.getRunningCalls() + ")",
        "log",
        "color: #ddd");
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

/*
 * Checks if there are any other components of equal or higher 
 * priority than the one that is currently being executed
 */
Dashboards.othersAwaitExecution = function( tiers , current ) {

  if( !tiers || !current || !current.components ) {
    return false;
  }

  // first thing is to discard 'current.components' from the calculations, as we are only 
  // interested in checking if there are *other components* that await execution
  tiers[current.priority] = _.difference( tiers[current.priority], current.components );

  var componentsToUpdate = this.getFirstTier( tiers );
  
  if( !componentsToUpdate || !componentsToUpdate.components || componentsToUpdate.components.length == 0  ){ 

    return false; // no other components await execution

  } else if( parseInt( componentsToUpdate.priority ) > parseInt( current.priority ) ) {

    // recall: 1 - utmost priority , 999999 - lowest priority
    // those who await execution are lower in priority that the current component
    return false;
  } 

  // compToUpdate has components with equal or higher priority than the component 
  // that is currently being executed, that await execution themselves
  return true;
}


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
  var othersAwaitExecution = false;
  if(updating === null || updating.components.length == 0
      || ( othersAwaitExecution = this.othersAwaitExecution( _.clone( this.updating.tiers ) , this.updating.current ) ) ) {
    var toUpdate = this.getFirstTier(this.updating.tiers);
    if(!toUpdate) return;

    if( othersAwaitExecution ){ 
      var tiers = this.updating.tiers;
      tiers[updating.priority] = _.difference( tiers[updating.priority], updating.components );
      toUpdate.components = _.union( tiers[updating.priority] , this.getFirstTier( tiers ).components );
    }

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
  if(!this.view || !this.view.params) {return;}
  /* Because we're storing the parameters in OrientDB, and as OrientDB has some
   * serious issues when storing nested objects, we're stuck marshalling the
   * parameters into a JSON object and converting that JSON into a Base64 blob
   * before storage. So now we have to decode that mess.
   */
  params = JSON.parse(Base64.decode(this.view.params));
  if(!params) {return;}
  if($.isEmptyObject(params)) {
    this.view.params = params;
  } else {
    for(p in params) {
      if(params.hasOwnProperty(p)) {
        this.setParameter(p, params[p]);
      }
    }
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
 * @return the parameter store
 * @private
 */
Dashboards._getParameterStore = function(){
  return this.globalContext ? window : this.parameters;
};

/**
 * Verifies if a parameter is available in the Parameter Model
 *
 * @param {string} name of the parameter
 * @return {boolean}
 * @private
 */
Dashboards._isParameterInModel = function(name){
  return this._getValueFromContext(this._getParameterStore(), name) !== undefined;
};

/**
 * Gets the value of a path in a given object.
 *
 * @param {Object} o the context object
 * @param {string|Array.<string>} path the path of the property
 * @return {*} the value of the property, if the path is present in <i>o</i>, or <tt>undefined</tt>, otherwise.
 * @private
 */
Dashboards._getValueFromContext = function(o, path) {
  if(!o) return;

  if(this._flatParameters) {
    return o[path];
  } else {
    if(path != null) {
      var parts, L;

      if(path instanceof Array) {
        parts = path;
      } else {
        if(path.indexOf('.') < 0) return o[path];

        parts = path.split(".");
      }
      L = parts.length;

      for(var i = 0; i < L; i++) {
        //if(!(o instanceof Object) return; // not an object
        if(!o) return; // more efficient approximation

        var part = parts[i],
            value = o[part];
        if(value === undefined) return;

        o = value;
      }
    }
  }

  return o;
};

/**
 * Sets a property path in a context <i>o</i> with value <i>v</i>
 *
 * @param {Object} o the context object
 * @param {string|Array.<string>} path the path of the property
 * @param {*} v the value of the property
 * @return the context object <i>o</i> or undefined
 * @private
 */
Dashboards._setValueInContext = function(o, path, v) {
  if(!o || path == null || v === undefined) return; // undefined

  if(this._flatParameters) { //to keep compatibility with dotted parameters without requiring the path created to work
    o[path] = v;
  } else {
    var parts, pLast;
    if(path instanceof Array) {
      parts = path;
      pLast = parts.pop();
    } else {
      if(path.indexOf(".") < 0) {
        o[path] = v;
        return o;
      }

      parts = path.split(".");
      pLast = parts.pop();
    }

    o = this._getValueFromContext(o, parts);
    if(o) o[pLast] = v;
  }
  return o;
};

/**
 * Adds a new parameter to the parameter module.
 * Receives a parameter name and an initial value, that will be used if the parameter is
 * not available in the parameter model. Otherwise, the getParameterValue return is used
 *
 * @param name the name of the parameter
 * @param initValue the initial value of the parameter
 * @return the value assigned to the parameter
 */
Dashboards.addParameter = function(name, initValue){
  if(this._isParameterInModel(name)){
    initValue = this.getParameterValue(name);
  }
  this.setParameter(name,initValue);
  return initValue;
};

Dashboards.getParameterValue = dash.getParam = function (parameterName) {
  return this._getValueFromContext(this._getParameterStore(), parameterName);
};

/* Sets the value of a parameter if it's name is not undefined and is not an empty string. The
 * parameter will also not be set when using a composed path that lacks more than the last
 * parameter (eg: when setting parameter <i>dash.obj.prop</i> if <i>dash.obj</i> doesn't exist undefined will be returned).
 *
 * @param parameterName the name of the parameter
 * @param parameterValue the value of the parameter
 * @isNotified the value of notify passed to the Backbone Model setter
 * @return the new value of the parameter or undefined
 */
Dashboards.setParameter = dash.setParam = function(parameterName, parameterValue, isNotified) {
  if(parameterName == undefined || parameterName == "undefined" || parameterName == ""){
    this.log('Dashboards.setParameter: trying to set undefined or empty string as parameter name!!','warn');
    return;
  }
  var value;
  if(!this.globalContext && this.escapeParameterValues){
    value = encode_prepare_arr(parameterValue);
  } else {
    value = parameterValue;
  }
  if(this._setValueInContext(this._getParameterStore(), parameterName, value) !== undefined){
    this.parameterModel.set(parameterName,value,{notify:isNotified});
    this.persistBookmarkables(parameterName);
    return value;
  }
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
    _: Date.now ? Date.now() : new Date().getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
  };

  $.ajax({
    type:'GET',
    dataType: "json",
    url: wd.cdf.endpoints.getStorage( args.action ),
    data: args,
    async:true,
    xhrFields: {
      withCredentials: true
    }
  }).done(function(json) {
    $.extend( myself.storage, json );
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
    _: Date.now ? Date.now() : new Date().getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
  };

  $.ajax({
    type:'GET',
    dataType: "json",
    url: wd.cdf.endpoints.getStorage( args.action ),
    data: args,
    async:true,
    xhrFields: {
      withCredentials: true
    }
  }).done(function(json) {
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

  $.ajax({
    type:'GET',
    dataType: "json",
    url: wd.cdf.endpoints.getStorage( args.action ),
    data: args,
    async:true,
    xhrFields: {
      withCredentials: true
    }
  }).done(function(json) {
    if(json.result != true){
      myself.log("Error deleting storage", 'error');
    }
  });

};

