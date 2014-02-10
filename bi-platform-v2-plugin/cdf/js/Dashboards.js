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

$.ajaxSetup({
  type: "POST",
  async: false,
  traditional: true,
  scriptCharset: "utf-8",
  contentType: "application/x-www-form-urlencoded;charset=UTF-8",

  dataFilter: function(data, dtype) {
    // just tagging date
    Dashboards.lastServerResponse = Date.now();
    return data;
  }
});



var pathArray = window.location.pathname.split( '/' );
var webAppPath;
if (!(typeof(CONTEXT_PATH) == 'undefined')){
  webAppPath = CONTEXT_PATH;
}
if(webAppPath == undefined){
  webAppPath = "/" + pathArray[1];
}

if(webAppPath.endsWith("/")) {
  webAppPath = webAppPath.substr(0, webAppPath.length-1);
}

var GB_ANIMATION = true;
var CDF_CHILDREN = 1;
var CDF_SELF = 2;
var ERROR_IMAGE = webAppPath + "/api/plugins/pentaho-cdf/files/resources/style/images/error.png";
var CDF_ERROR_DIV = 'cdfErrorDiv';


if($.blockUI){
  $.blockUI.defaults.fadeIn = 0;
  $.blockUI.defaults.message = '<div style="padding: 15px;"><img src="' + webAppPath + '/api/plugins/pentaho-cdf/files/resources/style/images/processing_transparent.gif" />';
  $.blockUI.defaults.css.left = '50%';
  $.blockUI.defaults.css.top = '40%';
  $.blockUI.defaults.css.marginLeft = '-16px';
  $.blockUI.defaults.css.width = '32px';
  $.blockUI.defaults.css.background = 'none';
  $.blockUI.defaults.overlayCSS = { backgroundColor: "#FFFFFF", opacity: 0.8, cursor: "wait"};
  $.blockUI.defaults.css.border = "none";
}



if (typeof $.SetImpromptuDefaults == 'function')
  $.SetImpromptuDefaults({
    prefix: 'colsJqi',
    show: 'slideDown'
  });

var Dashboards = {

  ERROR_CODES:{
    'QUERY_TIMEOUT' : {
      msg: "Query timeout reached"
    },
    "COMPONENT_ERROR" : {
      msg: "Error processing component"
    }
  },
  CDF_BASE_PATH: webAppPath + "/plugin/pentaho-cdf/api/",
  parameterModel: new Backbone.Model(),
  TRAFFIC_RED: webAppPath + "/api/plugins/pentaho-cdf/files/resources/style/images/traffic_red.png",
  TRAFFIC_YELLOW: webAppPath + "/api/plugins/pentaho-cdf/files/resources/style/images/traffic_yellow.png",
  TRAFFIC_GREEN: webAppPath + "/api/plugins/pentaho-cdf/files/resources/style/images/traffic_green.png",
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
  /* Used to control progress indicator for async mode */
  runningCalls: 0,
  components: [],
  /* Holds the dashboard parameters if globalContext = false */
  parameters: [],

  // Holder for context
  context:{},


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
  return webAppPath
}

Dashboards.getCggDrawUrl = function() {
  return "../../../plugin/cgg/api/services/draw";
};

// REFRESH ENGINE begin

Dashboards.RefreshEngine = function(){// Manages periodic refresh of components

  var NO_REFRESH = 0;//currently no distinction between explicitly disabled or not set
  var refreshQueue = new Array();//component refresh queue
  var activeTimer = null;//timer for individual component refresh

  var globalRefreshPeriod = NO_REFRESH;
  var globalTimer = null;

  Dashboards.RefreshEngine.QueueItem = function() {
    return {
      nextRefresh : 0,
      component : null
    };
  };

  //set global refresh and (re)start interval
  var startGlobalRefresh = function(refreshPeriod){
    if (globalTimer != null) {
      clearInterval(globalTimer);
      globalTimer = null;
    }
    globalRefreshPeriod = (refreshPeriod >0)? refreshPeriod : NO_REFRESH;
    if(globalRefreshPeriod != NO_REFRESH){
      globalTimer = setInterval("Dashboards.refreshEngine.fireGlobalRefresh()",globalRefreshPeriod * 1000);//ToDo: cleaner way to call
    }
  };

  var clearFromQueue = function(component){
    for (var i = 0; i < refreshQueue.length; i++) {
      if (refreshQueue[i].component == component) {
        refreshQueue.splice(i,1);
        i--;
      }
    }
  };

  var clearQueue = function(){
    if(refreshQueue.length > 0) refreshQueue.splice(0,refreshQueue.length);
  };

  //binary search for elem's position in coll (nextRefresh asc order)
  var getSortedInsertPosition = function(coll, elem){
    var high = coll.length - 1;
    var low = 0;
    var mid;

    while (low <= high) {
      mid = parseInt((low + high) / 2)
      if (coll[mid].nextRefresh > elem.nextRefresh) {
        high = mid - 1;
      } else if (coll[mid].nextRefresh < elem.nextRefresh) {
        low = mid + 1;
      } else {//==
        return mid;
      }
    }
    return low;
  };
  var sortedInsert = function(rtArray,rtInfo){
    var pos = getSortedInsertPosition(rtArray,rtInfo);
    rtArray.splice(pos,0,rtInfo);
  };

  var stopTimer = function(){
    if (activeTimer != null) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
  };

  var restartTimer = function(){
    stopTimer();
    Dashboards.refreshEngine.fireRefresh();
  };

  var getCurrentTime = function (){
    var date = new Date();
    return date.getTime();
  };

  var isFirstInQueue = function(component){
    return refreshQueue.length > 0 && refreshQueue[0].component == component;
  };

  var refreshComponent = function(component){
    //if refresh period is too short, progress indicator will stay in user's face
    //    let(Dashboards.runningCalls = 0){
    Dashboards.update(component);
    //      Dashboards.runningCalls = 0;
    //      Dashboards.hideProgressIndicator()
    //    }
  };

  var insertInQueue = function(component){
    var time = getCurrentTime();
    // normalize invalid refresh
    if (!(component.refreshPeriod > 0)) {
      component.refreshPeriod = NO_REFRESH;
    }
    if (component.refreshPeriod != NO_REFRESH) {
      //get next refresh time for component
      var info = new Dashboards.RefreshEngine.QueueItem();
      info.nextRefresh = time + (component.refreshPeriod * 1000);
      info.component = component;
      sortedInsert(refreshQueue, info);
    }
  };
  return {

    //set a component's refresh period and clears it from the queue if there;
    //processComponent must be called to activate the refresh timer for the component
    registerComponent : function(component, refreshPeriod){
      if(!component) return false;

      component.refreshPeriod = (refreshPeriod > 0)? refreshPeriod : NO_REFRESH;
      var wasFirst =  isFirstInQueue(component);
      clearFromQueue(component);
      if(wasFirst) restartTimer();

      return true;
    },

    getRefreshPeriod : function(component){
      if(component && component.refreshPeriod > 0) return component.refreshPeriod;
      else return NO_REFRESH;
    },

    //sets next refresh for given component and inserts it in refreshQueue, restarts timer if needed
    processComponent : function(component){
      clearFromQueue(component);
      insertInQueue(component);
      if(isFirstInQueue(component)) restartTimer();
      return true;//dbg
    },

    //clears queue, sets next refresh for all components, restarts timer
    processComponents : function(){
      clearQueue();
      for(var i=0; i<Dashboards.components.length;i++){
        insertInQueue(Dashboards.components[i]);
      }
      restartTimer();
      return true;//dbg
    },

    //pop due items from queue, refresh components and set next timeout
    fireRefresh : function(){
      activeTimer = null;
      var currentTime = getCurrentTime();

      while(refreshQueue.length > 0 &&
          refreshQueue[0].nextRefresh <= currentTime){
        var info = refreshQueue.shift();//pop first
        //call update, which calls processComponent
        refreshComponent(info.component);
      }
      if(refreshQueue.length > 0){
        activeTimer = setTimeout("Dashboards.refreshEngine.fireRefresh()", refreshQueue[0].nextRefresh - currentTime );//ToDo: cleaner way to call
        //activeTimer = setTimeout(this.fireRefresh, refreshQueue[0].nextRefresh - currentTime );
      }
    },

    // called when a valid globalRefreshPeriod exists
    // updates all components without their own refresh period
    fireGlobalRefresh: function(){
      for(i=0;i<Dashboards.components.length;i++){
        var comp = Dashboards.components[i];
        if (!(comp.refreshPeriod > 0) //only update those without refresh
            && comp.type != "select") { //and that are not pov widgets
          refreshComponent(comp);
        }
      }
    },

    setGlobalRefresh : function(refreshPeriod){
      startGlobalRefresh(refreshPeriod);
    },

    getQueue : function(){
      return refreshQueue;
    }
  };
};

Dashboards.refreshEngine = new Dashboards.RefreshEngine();

//REFRESH ENGINE end

Dashboards.setGlobalContext = function(globalContext) {
  this.globalContext = globalContext;
};

Dashboards.showProgressIndicator = function() {
  $.blockUI && this.blockUIwithDrag();
};

Dashboards.hideProgressIndicator = function() {
  $.unblockUI && $.unblockUI();
  this.showErrorTooltip();
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

    // Ensure BaseComponent's methods
    this._castControlToComponent(control, Class);

    // Make sure we clean all events in the case we're redefining the control.
    if(typeof control.off === "function") { control.off("all"); }

    // Endow it with the Backbone event system.
    $.extend(control, Backbone.Events);

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

Dashboards.getErrorObj = function (errorCode){
  return Dashboards.ERROR_CODES[errorCode] || {};
};

Dashboards.parseServerError = function (resp, txtStatus, error){
  var out = {};
  var regexs = [
    { match: /Query timeout/ , msg: Dashboards.getErrorObj('QUERY_TIMEOUT').msg  }
  ];

  out.error = error;
  out.msg = Dashboards.getErrorObj('COMPONENT_ERROR').msg;
  var str = $('<div/>').html(resp.responseText).find('h1').text();
  _.find( regexs, function (el){
    if ( str.match( el.match )){
      out.msg = el.msg ;
      return true
    } else {
      return false
    }
  });
  out.errorStatus = txtStatus;

  return out
};

Dashboards.handleServerError = function() {
  var err = Dashboards.parseServerError.apply( this, arguments );

  Dashboards.errorNotification( err );
  Dashboards.trigger('cdf cdf:serverError', this);
  Dashboards.resetRunningCalls();
};

Dashboards.errorNotification = function (err, ph) {
  if (ph){
    wd.cdf.notifications.component.render(
        $(ph), {
          title: err.msg,
          desc: ""
        });
  } else {
    wd.cdf.notifications.growl.render({
      title: err.msg,
      desc: ''
    });
  }
};

/**
 * Default impl when not logged in
 */
Dashboards.loginAlert = function(newOpts) {
  var opts = {
    header: "Warning",
    desc: "You are no longer logged in or the connection to the server timed out",
    button: "Click to reload this page",
    callback: function(){
      window.location.reload(true);
    }
  };
  opts = _.extend( {} , opts, newOpts );

  wd.cdf.popups.okPopup.show(opts);
  this.trigger('cdf cdf:loginError', this);
};

/**
 *
 */
Dashboards.checkServer = function() {
  //check if is connecting to server ok
  //use post to avoid cache
  var retVal = false;
  $.ajax({
    type: 'GET',
    async: false,
    dataType: 'json',
    url: Dashboards.CDF_BASE_PATH + 'ping',
    success: function(ok) {
      if(ok != null){
        retVal = false;
      } else {
        retVal = true;
      }
    },
    error: function() {
      retVal = false;
    }

  });
  return retVal;
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
    $.blockUI.defaults.message = '<div style="padding: 0px;"><img src="' + webAppPath + '/api/plugins/pentaho-cdf/files/resources/style/images/processing_transparent.gif" /></div>';
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

Dashboards.createAndCleanErrorDiv = function(){
  if ($("#"+CDF_ERROR_DIV).length == 0){
    $("body").append("<div id='" +  CDF_ERROR_DIV + "'></div>");
  }
  $("#"+CDF_ERROR_DIV).empty();
};

Dashboards.showErrorTooltip = function(){
  $(function(){
    if($.tooltip) {
      $(".cdf_error").tooltip({
        delay:0,
        track: true,
        fade: 250,
        showBody: " -- "
      });
    }
  });
};

Dashboards.getComponent = function(name){
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
      case 'number':
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

  if($.isArray(components)) { this.addComponents(components); }

  $(function() { myself.initEngine(); });
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


Dashboards.initEngine = function() {
  // Should really throw an error? Or return?
  if(this.waitingForInit && this.waitingForInit.length) {
    this.log("Overlapping initEngine!", 'warn');
  }

  var myself = this;
  var components = this.components;

  this.incrementRunningCalls();
  if( this.logLifecycle && typeof console != "undefined" ){
    console.log("%c          [Lifecycle >Start] Init (Running: "+ this.getRunningCalls()  +")","color: #ddd ");
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
    this.handlePostInit();
  }

  for(var i= 0, len = updating.length; i < len; i++){
    var component = updating[i];
    component.on('cdf:postExecution cdf:preExecution cdf:error',callback,myself);
  }
  Dashboards.updateAll(updating);
  if(components.length > 0) {
    myself.handlePostInit();
  }

};

Dashboards.handlePostInit = function() {
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
      console.log("%c          [Lifecycle <End  ] Init (Running: "+ this.getRunningCalls()  +")","color: #ddd ");
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
  this.createAndCleanErrorDiv();
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
  this.createAndCleanErrorDiv();

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
      var prio = c.priority || 0;
      if(!comps[prio]) {
        comps[prio] = [];
      }
      comps[prio].push(c);
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
      }),
      i, tier;

  for(i = 0;i < keys.length;i++) {
    tier = tiers[keys[i]];
    if(tier.length > 0) {
      return {priority: keys[i], components: tier.slice()};
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

Dashboards.getHashValue = function(key) {
  var hash = window.location.hash,
      obj;
  try {
    obj = JSON.parse(hash.slice(1));
  } catch (e) {
    obj = {};
  }
  if (arguments.length === 0) {
    return obj;
  } else {
    return obj[key];
  }
}

Dashboards.setHashValue = function(key, value) {
  var obj = this.getHashValue(),json;
  if (arguments.length == 1) {
    obj = key;
  } else {
    obj[key] = value;
  }
  json = JSON.stringify(obj);
  /* We don't want to store empty objects */
  if (json != "{}") {
    window.location.hash = json;
  } else {
    if (window.location.hash) {
      window.location.hash = '';
    }
  }
}
Dashboards.deleteHashValue = function(key) {
  var obj = this.getHashValue();
  if (arguments.length === 0) {
    window.location.hash = "";
  } else {
    delete obj[key];
    this.setHashValue(obj);
  }
}
Dashboards.setBookmarkable = function(parameter, value) {
  if(!this.bookmarkables) this.bookmarkables = {};
  if (arguments.length === 1) value = true;
  this.bookmarkables[parameter] = value;
};

Dashboards.isBookmarkable = function(parameter) {
  if(!this.bookmarkables) {return false;}
  return Boolean(this.bookmarkables[parameter]);
};



Dashboards.generateBookmarkState = function() {
  var params = {},
      bookmarkables = this.bookmarkables;
  for (var k in bookmarkables) if (bookmarkables.hasOwnProperty(k)) {
    if (bookmarkables[k]) {
      params[k] = this.getParameterValue(k);
    }
  }
  return params;
};

Dashboards.persistBookmarkables = function(param) {
  var bookmarkables = this.bookmarkables,
      params = {};
  /*
   * We don't want to update the hash if we were passed a
   * non-bookmarkable parameter (why bother?), nor is there
   * much of a point in publishing changes when we're still
   * initializing the dashboard. That's just the code for
   * restoreBookmarkables doing the reverse of this!
   */
  if (!bookmarkables || !bookmarkables[param]) {
    return;
  }
  if(!this.finishedInit) {
    return;
  }
  params = this.generateBookmarkState();
  this.setBookmarkState({impl: 'client',params: params});
}

Dashboards.setBookmarkState = function(state) {
  if(window.history && window.history.replaceState) {
    var method = window.location.pathname.split('/').pop(),
        query = window.location.search.slice(1).split('&').map(function(e){
          var entry = e.split('=');
          entry[1] = decodeURIComponent(entry[1]);
          return entry;
        }),
        url;
    query = this.propertiesArrayToObject(query);
    query.bookmarkState = JSON.stringify(state);
    url = method + '?' + $.param(query);
    window.history.replaceState({},'',url);
    this.deleteHashValue('bookmark');
  } else {
    this.setHashValue('bookmark',state);
  }
};

Dashboards.getBookmarkState = function() {
  /*
   * browsers that don't support history.pushState
   * can't actually safely remove bookmarkState param,
   * so we must first check whether there is a hash-based
   * bookmark state.
   */
  if (window.location.hash.length > 1) {
    try {
      return this.getHashValue('bookmark') || {};
    } catch (e) {
      /*
       * We'll land here if the hash isn't a valid json object,
       * so we'll go on and try getting the state from the params
       */
    }
  }
  var query = window.location.search.slice(1).split('&').map(function(e){
        var pair = e.split('=');
        pair[1] = decodeURIComponent(pair[1]);
        return pair;
      }),
      params = this.propertiesArrayToObject(query);
  if(params.bookmarkState) {
    return JSON.parse(decodeURIComponent(params.bookmarkState.replace(/\+/g,' '))) || {};
  } else  {
    return {};
  }
};

Dashboards.restoreBookmarkables = function() {
  var state;
  this.bookmarkables = this.bookmarkables || {};
  try {
    state = this.getBookmarkState().params;
    for (var k in state) if (state.hasOwnProperty(k)) {
      this.setParameter(k,state[k]);
    }
  } catch (e) {
    this.log(e,'error');
  }
}

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

Dashboards.getParameterValue = function (parameterName) {
  if (this.globalContext) {
    try{
      return eval(parameterName);
    }
    catch (e){
      this.error(e);
      //return undefined;
    }
  } else {
    return this.parameters[parameterName];
  }
};

Dashboards.getQueryParameter = function ( parameterName ) {
  // Add "=" to the parameter name (i.e. parameterName=value)
  var queryString = window.location.search.substring(1);
  var parameterName = parameterName + "=";
  if ( queryString.length > 0 ) {
    // Find the beginning of the string
    var begin = queryString.indexOf ( parameterName );
    // If the parameter name is not found, skip it, otherwise return the value
    if ( begin != -1 ) {
      // Add the length (integer) to the beginning
      begin += parameterName.length;
      // Multiple parameters are separated by the "&" sign
      var end = queryString.indexOf ( "&" , begin );
      if ( end == -1 ) {
        end = queryString.length
      }
      // Return the string
      return decodeURIComponent ( queryString.substring ( begin, end ) );
    }
    // Return "" if no parameter has been found
    return "";
  }
};

Dashboards.setParameter = function(parameterName, parameterValue, isNotified) {
  if(parameterName == undefined || parameterName == "undefined"){
    this.log('Dashboards.setParameter: trying to set undefined!!','warn');
    return;
  }
  if (this.globalContext) {
    //ToDo: this should really be sanitized!
    eval( parameterName + " = " + JSON.stringify(parameterValue) );
  } else {
    if(this.escapeParameterValues) {
      this.parameters[parameterName] = encode_prepare_arr(parameterValue);
    } else {
      this.parameters[parameterName] = parameterValue;
    }
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

Dashboards.callPentahoAction = function(obj, path, parameters, callback ){
  var myself = this;

  // Encapsulate pentahoAction call
  // Dashboards.log("Calling pentahoAction for " + obj.type + " " + obj.name + "; Is it visible?: " + obj.visible);
  if(typeof callback == 'function'){
    return this.pentahoAction( path, parameters,
        function(json){
          callback(myself.parseXActionResult(obj,json));
        }
    );
  }
  else{
    return this.parseXActionResult(obj,this.pentahoAction( path, parameters, callback ));
  }
};

Dashboards.urlAction = function ( url, params, func) {
  return this.executeAjax('xml', url, params, func);
};

Dashboards.executeAjax = function( returnType, url, params, func ) {
  var myself = this;
  // execute a url
  if (typeof func == "function"){
    // async
    return $.ajax({
      url: url,
      type: "POST",
      dataType: returnType,
      async: true,
      data: params,
      complete: function (XMLHttpRequest, textStatus) {
        func(XMLHttpRequest.responseXML);
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        myself.log("Found error: " + XMLHttpRequest + " - " + textStatus + ", Error: " +  errorThrown,"error");
      }
    });
  }

  // Sync
  var result = $.ajax({
    url: url,
    type: "POST",
    dataType:returnType,
    async: false,
    data: params,
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      myself.log("Found error: " + XMLHttpRequest + " - " + textStatus + ", Error: " +  errorThrown,"error");
    }

  });
  if (returnType == 'xml') {
    return result.responseXML;
  } else {
    return result.responseText;
  }

};

Dashboards.pentahoAction = function( path, params, func ) {
  return this.pentahoServiceAction('ServiceAction', 'xml', path, params, func);
};

Dashboards.pentahoServiceAction = function( serviceMethod, returntype, path, params, func ) {
  // execute an Action Sequence on the server

  var url = webAppPath + "/api/repos/" + path.replace(/\//g, ":") + "/generatedContent";

  // Add the solution to the params
  var arr = {};
  arr.wrapper = false;
  arr.path = path;
  $.each(params,function(i,val){
    arr[val[0]]=val[1];
  });
  return this.executeAjax(returntype, url, arr, func);
};

Dashboards.parseXActionResult = function(obj,html){

  var jXML = $(html);
  var error = jXML.find("SOAP-ENV\\:Fault");
  if (error.length == 0){
    return jXML;
  }

  // error found. Parsing it
  var errorMessage = "Error executing component " + obj.name;
  var errorDetails = new Array();
  errorDetails[0] = " Error details for component execution " + obj.name + " -- ";
  errorDetails[1] = error.find("SOAP-ENV\\:faultstring").find("SOAP-ENV\\:Text:eq(0)").text();
  error.find("SOAP-ENV\\:Detail").find("message").each(function(){
    errorDetails.push($(this).text())
  });
  if (errorDetails.length > 8){
    errorDetails = errorDetails.slice(0,7);
    errorDetails.push("...");
  }

  var out = "<table class='errorMessageTable' border='0'><tr><td><img src='"+ ERROR_IMAGE + "'></td><td><span class=\"cdf_error\" title=\" " + errorDetails.join('<br/>').replace(/"/g,"'") +"\" >" + errorMessage + " </span></td></tr></table/>";

  // if this is a hidden component, we'll place this in the error div
  if (obj.visible == false){
    $("#"+CDF_ERROR_DIV).append("<br />" + out);
  }
  else{
    $('#'+obj.htmlObject).html(out);
  }


  return null;

};

Dashboards.setSettingsValue = function(name,object){

  var data = {
    method: "set",
    key: name,
    value: JSON.stringify(object)
  };
  $.post("Settings", data, function(){});
};

Dashboards.getSettingsValue = function(key,value){

  var callback = typeof value == 'function' ? value : function(json){
    value = json;
  };

  $.getJSON("Settings?method=get&key=" + key , callback);
};

Dashboards.fetchData = function(cd, params, callback) {
  this.log('Dashboards.fetchData() is deprecated. Use Query objects instead','warn');
  // Detect and handle CDA data sources
  if (cd != undefined && cd.dataAccessId != undefined) {
    for (var param in params) {
      cd['param' + params[param][0]] = this.getParameterValue(params[param][1]);
    }

    $.post(webAppPath + "/plugin/cda/api/doQuery?", cd,
        function(json) {
          callback(json);
        },'json').error(Dashboards.handleServerError);
  }
  // When we're not working with a CDA data source, we default to using jtable to fetch the data...
  else if (cd != undefined){

    var xactionFile = (cd.queryType == 'cda')? "jtable-cda.xaction" : "jtable.xaction";
    $.post(webAppPath + "/api/repos/:public:plugin-samples:pentaho-cdf:actions:"+xactionFile+"/generatedContent?", cd,
        function(result) {
          callback(result.values);
        },'json');
  }
  // ... or just call the callback when no valid definition is passed
  else {
    callback([]);
  }
};

Dashboards.escapeHtml = function(input) {
  var escaped = input
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/'/g,"&#39;")
      .replace(/"/g,"&#34;");
  return escaped;
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
    _: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
  };
  $.getJSON(webAppPath + "/plugin/pentaho-cdf/api/storage/read", args, function(json) {
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
    storageValue: JSON.stringify(this.storage),
    _: (new Date()).getTime() // Needed so IE doesn't try to be clever and retrieve the response from cache
  };
  $.getJSON(webAppPath + "/plugin/pentaho-cdf/api/storage/store", args, function(ok) {
    if(ok != null){
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
  };
  $.getJSON(webAppPath + "/plugin/pentaho-cdf/api/storage/delete", args, function(ok) {
    if(ok != null){
      myself.log("Error deleting storage", 'error');
    }
  });
};


(function (D) {

  // Conversion functions
  function _pa2obj (pArray) {
    var obj = {};
    for (var p in pArray) if (pArray.hasOwnProperty(p)) {
      var prop = pArray[p];
      obj[prop[0]] = prop[1];
    }
    return obj;
  };
  function _obj2pa (obj) {
    var pArray = [];
    for (var key in obj) if (obj.hasOwnProperty(key)) {
      pArray.push([key,obj[key]]);
    }
    return pArray;
  };

  // Exports
  // NOTE: using underscore.js predicates but we could also use Dashboards.isArray() and 
  //       Dashboards.isObject() (would need to create this one.)
  D.propertiesArrayToObject = function(pArray) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return ( _.isArray(pArray) && _pa2obj(pArray) ) || ( _.isObject(pArray) && pArray ) || undefined;
  };

  D.objectToPropertiesArray = function(obj) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return ( _.isArray(obj) && obj) || ( _.isObject(obj) && _obj2pa(obj)) || undefined;
  };

})(Dashboards);




/**
 * Traverses each <i>value</i>, <i>label</i> and <i>id</i> triple of a <i>values array</i>.
 *
 * @param {Array.<Array.<*>>} values the values array - an array of arrays.
 *   <p>
 *   Each second-level array is a <i>value specification</i> and contains
 *   a value and, optionally, a label and an id.
 *   It may have the following forms:
 *   </p>
 *   <ul>
 *     <li><tt>[valueAndLabel]</tt> - when having <i>length</i> one</li>
 *     <li><tt>[value, label,...]</tt> - when having <i>length</i> two or more and
 *         <tt>opts.valueAsId</tt> is falsy
 *     </li>
 *     <li><tt>[id, valueAndLabel,..]</tt> - when having <i>length</i> two or more and
 *         <tt>opts.valueAsId</tt> is truthy
 *     </li>
 *   </ul>
 * @param {object} opts an object with options.
 *
 * @param {?boolean=} [opts.valueAsId=false] indicates if the first element of
 *   the value specification array is the id, instead of the value.
 *
 * @param {function(string, string, string, number):?boolean} f
 * the traversal function that is to be called with
 * each value-label-id triple and with the JS content <tt>x</tt>.
 * The function is called with arguments: <tt>value</tt>, <tt>label</tt>,
 * <tt>id</tt> and <tt>index</tt>.
 * <p>
 * When the function returns the value <tt>false</tt>, traversal is stopped,
 * and <tt>false</tt> is returned.
 * </p>
 *
 * @param {object} x the JS context object on which <tt>f</tt> is to be called.
 *
 * @return {boolean} indicates if the traversal was complete, <tt>true</tt>,
 *   or if explicitly stopped by the traversal function, <tt>false</tt>.
 */
Dashboards.eachValuesArray = function(values, opts, f, x) {
  if(typeof opts === 'function') {
    x = f;
    f = opts;
    opts = null;
  }

  var valueAsId = !!(opts && opts.valueAsId);
  for(var i = 0, j = 0, L = values.length; i < L; i++) {
    var valSpec = values[i];
    if(valSpec && valSpec.length) {
      var v0 = valSpec[0];
      var value, label, id = undefined; // must reset on each iteration

      if (valSpec.length > 1) {
        if(valueAsId) { id = v0; }
        label = "" + valSpec[1];
        value = (valueAsId || v0 == null) ? label : ("" + v0);
      } else {
        value = label = "" + v0;
      }

      if(f.call(x, value, label, id, j, i) === false) { return false; }
      j++;
    }
  }

  return true;
};


/**
 * Given a parameter value obtains an equivalent values array.
 *
 * <p>The parameter value may encode multiple values in a string format.</p>
 * <p>A nully (i.e. null or undefined) input value or an empty string result in <tt>null</tt>,
 *    and so the result of this method is normalized.
 * </p>
 * <p>
 * A string value may contain multiple values separated by the character <tt>|</tt>.
 * </p>
 * <p>An array or array-like object is returned without modification.</p>
 * <p>Any other value type returns <tt>null</tt>.</p>
 *
 * @param {*} value
 * a parameter value, as returned by {@link Dashboards.getParameterValue}.
 *
 * @return {null|!Array.<*>|!{join}} null or an array or array-like object.
 *
 * @static
 */
Dashboards.parseMultipleValues = function(value) {
  if(value != null && value !== '') {
    // An array or array like?
    if(this.isArray(value)) { return value; }
    if(typeof value === "string") { return value.split("|"); }
  }

  // null or of invalid type
  return null;
};

/**
 * Normalizes a value so that <tt>undefined</tt>, empty string
 * and empty array, are all translated to <tt>null</tt>.
 * @param {*} value the value to normalize.
 * @return {*} the normalized value.
 *
 * @static
 */
Dashboards.normalizeValue = function(value) {
  if(value === '' || value == null) { return null; }
  if(this.isArray(value) && !value.length) return null;
  return value;
};

/**
 * Determines if a value is considered an array.
 * @param {*} value the value.
 * @return {boolean}
 *
 * @static
 */
Dashboards.isArray = function(value) {
  // An array or array like?
  return !!value &&
      ((value instanceof Array) ||
          (typeof value === 'object' && value.join && value.length != null));
};

/**
 * Determines if two values are considered equal.
 * @param {*} a the first value.
 * @param {*} b the second value.
 * @return {boolean}
 *
 * @static
 */
Dashboards.equalValues = function(a, b) {
  // Identical or both null/undefined?
  a = this.normalizeValue(a);
  b = this.normalizeValue(b);

  if(a === b) { return true; }

  if(this.isArray(a) && this.isArray(b)) {
    var L = a.length;
    if(L !== b.length) { return false; }
    while(L--) { if(!this.equalValues(a[L], b[L])) { return false; } }
    return true;
  }

  // Last try, give it to JS equals
  return a == b;
};

// Based on the algorithm described at http://en.wikipedia.org/wiki/HSL_and_HSV.
/**
 * Converts an HSV to an RGB color value.
 *
 * @param {number} h Hue as a value between 0 - 360 (degrees)
 * @param {number} s Saturation as a value between 0 - 100 (%)
 * @param {number} v Value as a value between 0 - 100 (%)
 * @return {string} An rgb(...) color string.
 *
 * @static
 */
Dashboards.hsvToRgb = function(h, s, v) {
  v = v / 100; // 0 - 1
  s = s / 100; // idem

  var h6 = (h % 360) /60;
  var chroma = v * s;
  var m = v - chroma;
  var h6t = Math.abs((h6 % 2) - 1);
  //var r = 1 - h6t;
  //var x = chroma * r;
  var x_m = v * (1 - s * h6t); // x + m
  var c_m = v; // chroma + m
  // floor(h6) (0, 1, 2, 3, 4, 5)

  var rgb;
  switch(~~h6) {
    case 0: rgb = [c_m, x_m, m  ]; break;
    case 1: rgb = [x_m, c_m, m  ]; break;
    case 2: rgb = [m,   c_m, x_m]; break;
    case 3: rgb = [m,   x_m, c_m]; break;
    case 4: rgb = [x_m, m,   c_m]; break;
    case 5: rgb = [c_m, m,   x_m]; break;
  }

  rgb.forEach(function(val, i) {
    rgb[i] = Math.min(255, Math.round(val * 256));
  });

  return "rgb(" + rgb.join(",") + ")";
};

/**
 * UTF-8 data encode / decode
 * http://www.webtoolkit.info/
 **/
function encode_prepare_arr(value) {
  if(typeof value == "number"){
    return value;
  } else if ($.isArray(value)){
    var a = new Array(value.length);
    $.each(value,function(i,val){
      a[i] = encode_prepare(val);
    });
    return a;
  }
  else{
    return encode_prepare(value);
  }
};

function encode_prepare( s )
{
  if (s != null) {
    s = s.replace(/\+/g," ");
    if ($.browser == "msie" || $.browser == "opera"){
      return Utf8.decode(s);
    }
  }
  return s;
};


/**
 *
 * UTF-8 data encode / decode
 * http://www.webtoolkit.info/
 *
 **/


var Utf8 = {

  // public method for url encoding
  encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }

    return utftext;
  },

  // public method for url decoding
  decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = 0, c2 = 0, c3 = 0;

    while ( i < utftext.length ) {

      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }

    }

    return string;
  }

}

function getURLParameters(sURL)
{
  if (sURL.indexOf("?") > 0){

    var arrParams = sURL.split("?");
    var arrURLParams = arrParams[1].split("&");
    var arrParam = [];

    for (var i=0;i<arrURLParams.length;i++){
      var sParam =  arrURLParams[i].split("=");

      if (sParam[0].indexOf("param",0) == 0){
        var parameter = [sParam[0].substring(5,sParam[0].length),unescape(sParam[1])];
        arrParam.push(parameter);
      }
    }

  }

  return arrParam;
}

function toFormatedString(value) {
  value += '';
  var x = value.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1))
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  return x1 + x2;
}

//quote csv values in a way compatible with CSVTokenizer
function doCsvQuoting(value, separator, alwaysEscape){
  var QUOTE_CHAR = '"';
  if(separator == null) {
    return value;
  }
  if(value == null) {
    return null;
  }
  if(value.indexOf(QUOTE_CHAR) >= 0){
    //double them
    value = value.replace(QUOTE_CHAR, QUOTE_CHAR.concat(QUOTE_CHAR));
  }
  if(alwaysEscape || value.indexOf(separator) >= 0){
    //quote value
    value =  QUOTE_CHAR.concat(value, QUOTE_CHAR);
  }
  return value;
}

/**
 *
 *  Javascript sprintf
 *  http://www.webtoolkit.info/
 *
 *
 **/
sprintfWrapper = {

  init : function () {

    if (typeof arguments == 'undefined') {
      return null;
    }
    if (arguments.length < 1) {
      return null;
    }
    if (typeof arguments[0] != 'string') {
      return null;
    }
    if (typeof RegExp == 'undefined') {
      return null;
    }

    var string = arguments[0];
    var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
    var matches = new Array();
    var strings = new Array();
    var convCount = 0;
    var stringPosStart = 0;
    var stringPosEnd = 0;
    var matchPosEnd = 0;
    var newString = '';
    var match = null;

    while ((match = exp.exec(string))) {
      if (match[9]) {
        convCount += 1;
      }

      stringPosStart = matchPosEnd;
      stringPosEnd = exp.lastIndex - match[0].length;
      strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

      matchPosEnd = exp.lastIndex;

      var negative = parseInt(arguments[convCount]) < 0;
      if(!negative) negative = parseFloat(arguments[convCount]) < 0;

      matches[matches.length] = {
        match: match[0],
        left: match[3] ? true : false,
        sign: match[4] || '',
        pad: match[5] || ' ',
        min: match[6] || 0,
        precision: match[8],
        code: match[9] || '%',
        negative: negative,
        argument: String(arguments[convCount])
      };
    }
    strings[strings.length] = string.substring(matchPosEnd);

    if (matches.length == 0) {
      return string;
    }
    if ((arguments.length - 1) < convCount) {
      return null;
    }

    match = null;
    var i = null;

    for (i=0; i<matches.length; i++) {
      var m =matches[i];
      var substitution;
      if (m.code == '%') {
        substitution = '%'
      }
      else if (m.code == 'b') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(2));
        substitution = sprintfWrapper.convert(m, true);
      }
      else if (m.code == 'c') {
        m.argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(m.argument)))));
        substitution = sprintfWrapper.convert(m, true);
      }
      else if (m.code == 'd') {
        m.argument = toFormatedString(String(Math.abs(parseInt(m.argument))));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 'f') {
        m.argument = toFormatedString(String(Math.abs(parseFloat(m.argument)).toFixed(m.precision ? m.precision : 6)));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 'o') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(8));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 's') {
        m.argument = m.argument.substring(0, m.precision ? m.precision : m.argument.length)
        substitution = sprintfWrapper.convert(m, true);
      }
      else if (m.code == 'x') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 'X') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
        substitution = sprintfWrapper.convert(m).toUpperCase();
      }
      else {
        substitution = m.match;
      }

      newString += strings[i];
      newString += substitution;
    }

    newString += strings[i];

    return newString;

  },

  convert : function(match, nosign){
    if (nosign) {
      match.sign = '';
    } else {
      match.sign = match.negative ? '-' : match.sign;
    }
    var l = match.min - match.argument.length + 1 - match.sign.length;
    var pad = new Array(l < 0 ? 0 : l).join(match.pad);
    if (!match.left) {
      if (match.pad == '0' || nosign) {
        return match.sign + pad + match.argument;
      } else {
        return pad + match.sign + match.argument;
      }
    } else {
      if (match.pad == '0' || nosign) {
        return match.sign + match.argument + pad.replace(/0/g, ' ');
      } else {
        return match.sign + match.argument + pad;
      }
    }
  }
}

sprintf = sprintfWrapper.init;



// CONTAINER begin
;(function (D){

  function Container() {

    // PUBLIC

    // register(type, what [, scope])
    // register(type, name, what [, scope])
    this.register = function(type, name, what, scope) {
      if(!type) { throw new Error("Argument 'type' is required."); }
      if(typeof type !== 'string') { throw new Error("Argument 'type' must be a string."); }

      if(name != null) {
        if(typeof name !== 'string') {
          scope = what;
          what  = name;
          name  = null;
        } else if(!name) {
          name = null;
        }
      }

      if(!what) { throw new Error("Argument 'what' is required."); }

      var holder;
      switch(typeof what) {
        case 'function': holder = new FactoryHolder (this, what, scope); break;
        case 'object':   holder = new InstanceHolder(this, what, scope); break;
        default: throw new Error("Argument 'what' is of an invalid type.");
      }

      if(!name) { name = ''; }

      var holdersByName = _typesTable[type] || (_typesTable[type] = {});
      var currHolder = holdersByName[name];
      if(currHolder) {
        // throw? log?
        currHolder.dispose();
      }
      holdersByName[name] = holder;
    };

    this.has    = function(type, name) { return !!getHolder(type, name, true); };
    this.canNew = function(type, name) { return getHolder(type, name, false) instanceof FactoryHolder; };

    this.get       = function(type, name)         { return get(type, name, null,   false, false); };
    this.tryGet    = function(type, name)         { return get(type, name, null,   false, true ); };

    this.getNew    = function(type, name, config) { return get(type, name, config, true,  false); };
    this.tryGetNew = function(type, name, config) { return get(type, name, config, true,  true ); };

    this.getAll    = function(type) { return getAll(type, false); };
    this.tryGetAll = function(type) { return getAll(type, true ); };

    this.listType = function(type) { return getType(type,false); };
    this.tryListType = function(type) { return getType(type,true); };

    this.dispose = function() {
      if(_typesTable) {
        for(var type in _typesTable) {
          var holdersByName = _typesTable[type];
          for(var name in holdersByName) {
            holdersByName[name].dispose();
          }
        }

        _typesTable = null;
      }
    };

    // PRIVATE

    var _typesTable = {}; // type -> []

    function getType(type, isTry) {
      if(!type) { throw new Error("Argument 'type' is required."); }
      if(typeof type !== 'string') { throw new Error("Argument 'type' must be a string."); }

      var holdersByName = _typesTable[type];
      if(!isTry && (!holdersByName || isOwnEmpty(holdersByName))) {
        throw new Error("There are no registrations for type '" + type + "'.");
      }
      return holdersByName;
    }

    function getHolder(type, name, isTry) {
      var holder;
      var holdersByName = getType(type, isTry);
      if(holdersByName) {
        holder = holdersByName[name || ''];
        if(!holder && !isTry) {
          throw new Error(
              "There is no registration for type '" + type + "'" +
                  (name ? (" and name '" + name + "'") : "") + ".");
        }
      }

      return holder;
    }

    function get(type, name, config, isNew, isTry) {
      if(typeof name !== 'string') {
        config = name;
        name = '';
      }

      var holder = getHolder(type, name, isTry);

      // Can't store as singletons instances with special config params
      if(config) { isNew = true;  } else
      if(!isNew) { config = {}; }

      return holder ? holder.build(config, isNew) : null;
    }

    function getAll(type, isTry) {
      var holdersByName = getType(type, isTry);

      // Includes the default (unnamed) instance
      var instances = [];
      for(var name in holdersByName) {
        instances.push(holdersByName[name].build({}, false));
      }
      return instances;
    }
  }

  // Shared/Static stuff

  // Allows creating multiple instances
  function FactoryHolder(container, factory, scope) {
    var instance;

    if(!scope) { scope = 'instance'; }

    this.build = function(config, buildNew) {
      if(instance && !buildNew) { return instance; }

      var inst = factory(container, config);

      if(!buildNew && scope === 'singleton') { instance = inst; }

      return inst;
    };

    this.dispose = function() {
      if(instance) {
        doDispose(instance);
        instance = null;
      }
    };
  }

  function InstanceHolder(container, instance, scope) {
    if(!scope) { scope = 'external'; }

    this.build = function(/*config, buildNew*/) { return instance; };

    // external scope is managed outside the container
    this.dispose = function() {
      if(instance) {
        scope === 'singleton' && doDispose(instance);
        instance = null;
      }
    };
  }

  // Fwk stuff

  function doDispose(instance) {
    if(typeof instance.dispose === 'function') { instance.dispose(); }
  }

  var hasOwn = Object.prototype.hasOwnProperty;

  function isOwnEmpty(o) {
    // tolerates o == null
    for(var n in o) { if(hasOwn.call(o, n)) { return false; } }
    return true;
  }

  // Export
  D.Container = Container;
})(Dashboards);
// CONTAINER end 



// ADDINS begin
;(function (D){
  D.addIns = new D.Container ();

  //Normalization - Ensure component does not finish with component and capitalize first letter
  D.normalizeAddInKey = function(key, subKey) {
    if (key.indexOf('Component', key.length - 'Component'.length) !== -1)
      key = key.substring(0, key.length - 'Component'.length);
    key = key.charAt(0).toUpperCase() + key.substring(1);

    if(subKey) { key += "." + subKey; }

    return key;
  }

  D.registerAddIn = function(type,subType,addIn){
    var type = this.normalizeAddInKey(type, subType),
        name = addIn.getName ? addIn.getName() : null;
    this.addIns.register(type, name, addIn);
  };

  D.hasAddIn = function(type,subType,addInName){
    var type = this.normalizeAddInKey(type, subType);
    return Boolean(this.addIns && this.addIns.has(type,addInName));
  };

  D.getAddIn = function(type,subType,addInName){
    var type = this.normalizeAddInKey(type, subType);
    try {
      var addIn = this.addIns.get(type,addInName);
      return addIn;
    } catch (e) {
      return null;
    }
  };

  D.setAddInDefaults = function(type, subType, addInName, defaults) {
    var addIn = this.getAddIn(type, subType,addInName);
    if(addIn) {
      addIn.setDefaults(defaults);
    }
  };
  D.listAddIns = function(type, subType) {
    var type = this.normalizeAddInKey(type, subType);
    var addInList = [];
    try {
      return this.addIns.listType(type);
    } catch (e) {
      return [];
    }
  };
})(Dashboards);
// ADDINS end






Dashboards.safeClone = function(){
  var options, name, src, copy, copyIsArray, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
    target = {};
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ( (options = arguments[ i ]) != null ) {
      // Extend the base object
      for ( name in options ) if (options.hasOwnProperty(name)) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : [];

          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = this.safeClone( deep, clone, copy );

          // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};



// OPTIONS MANAGER begin
;(function (D){

  // This class is intended to be used as a generic Options Manager, by providing a way to
  // keep record of the values of an options set, but also custom readers, writers and validators 
  // for each of the options.
  function OptionsManager (config ){ /* { defaults: {}, interfaces: {}, libraries: {} }*/
    var myself = this;

    // PROTECTED
    this._options = {};
    this._interfaces = {};
    this._libraries = {
      predicates: {
        tautology: function (value){ return true },
        isFunction: _.isFunction ,
        isPositive: function (value){ return (_.isNumber(value) && value > 0); },
        isObjectOrPropertiesArray : function (value){
          return _.isArray(value) || _.isObject(value);
        },
        isObject: _.isObject,
        isArray: _.isArray
      },
      mappers: {
        identity: _.identity,
        propertiesObject: function (value) {
          return (_.isArray(value)) ? D.propertiesArrayToObject(value) : value;
        }
      }
    };

    // PUBLIC
    this.mixin = function (instance){
      instance.getOption = this.getOption;
      instance.setOption = this.setOption;
    };

    this.init = function (defaults, interfaces, libraries) {
      var myself = this;

      defaults = $.extend(true, {}, defaults);
      interfaces = $.extend(true, {}, interfaces);

      this._libraries = $.extend(true, {}, this._libraries, libraries);
      _.each( interfaces, function (el,key){
        setInterfaces( key, el );
      });
      _.each( defaults, function(el, key) {
        var ifaces = ( interfaces && interfaces[key] ) || {};
        setInterfaces( key, ifaces);
        setValue( key, el );
      })
    };

    this.setOption = function (opt, value, interfaces){
      setInterfaces(opt, interfaces);
      var reader = getReader(opt),
          validator = getValidator(opt);
      if ( validator(value) ){
        value = reader(value);
        setValue( opt, value );
        return true
      } else {
        throw new Error( "Invalid Option " + opt.charAt(0).toUpperCase() + opt.slice(1) );
      }
    };

    this.getOption = function (opt){
      var writer = getWriter( opt ),
          value = getValue(opt);
      return writer( value );
    };

    // PRIVATE
    function setInterfaces (opt, interfaces){
      interfaces = interfaces || {};
      setReader(opt, interfaces['reader']);
      setWriter(opt, interfaces['writer']);
      setValidator(opt, interfaces['validator']);
    };

    function getReader(opt){
      return get( myself._interfaces, opt, 'reader', myself._libraries.mappers['identity']
      )};
    function getWriter(opt){
      return get( myself._interfaces, opt, 'writer', myself._libraries.mappers['identity']
      )};
    function getValidator(opt){
      return get( myself._interfaces, opt, 'validator', myself._libraries.predicates['tautology']
      )};
    function getValue(opt){ return get( myself._options, opt, 'value') };

    // Reader, Writer and Validator work in the same way:
    // If the value is a function, use it. 
    // Otherwise, if it is a string and a valid library key, use it.
    // Otherwise, use a default library function: for readers and writers an indentity map, 
    //    for validators a predicate that always returns true.

    function setReader(opt, fn){
      var lib = myself._libraries.mappers;
      fn = ( _.isFunction(fn) && fn ) || ( _.isString(fn) && lib[fn] ) || getReader(opt) || lib['identity'] ;
      return set( myself._interfaces , opt, 'reader', fn)
    };
    function setWriter(opt, fn){
      var lib = myself._libraries.mappers;
      fn = ( _.isFunction(fn) && fn ) || ( _.isString(fn) && lib[fn] ) || getWriter(opt) || lib['identity'] ;
      return set( myself._interfaces, opt, 'writer', fn)
    };
    function setValidator(opt, fn){
      var lib = myself._libraries.predicates;
      fn = ( _.isFunction(fn) && fn ) || ( _.isString(fn) && lib[fn] ) || getValidator(opt) || lib['tautology'] ;
      return set( myself._interfaces, opt, 'validator', fn)
    };
    function setValue(opt, value){ return set( myself._options, opt, 'value', value) };

    // Init
    this.init( config.defaults, config.interfaces, config.libraries);

  }

  // Shared / Static
  function get ( container, opt, attr, defaultValue ){
    var val = defaultValue || undefined ;
    if ( container && container[opt] && container[opt].hasOwnProperty(attr) ){
      val = container[opt][attr];
    }
    return val
  }
  function set (container, opt, attr, value){
    if (container && opt && attr){
      container[opt] = container[opt] || {};
      container[opt][attr] = value ;
    }
  }

  D.OptionsManager = OptionsManager;
})(Dashboards);
// OPTIONS MANAGER end



// QUERIES begin
(function (D){

  var _BaseQuery = Base;

  D.getBaseQuery = function (){
    return _BaseQuery;
  };
  D.setBaseQuery = function ( QueryClass ){
    if ( _.isFunction(QueryClass) && QueryClass.extend ){
      _BaseQuery = QueryClass;
    }
  };

  D.queryFactories = new D.Container ();

  D.registerQuery = function(type, query){
    var BaseQuery = this.getBaseQuery();

    // Goes a level deeper one extending these properties. Usefull to preserve defaults and
    // options interfaces from BaseQuery.
    if (!_.isFunction(query) && _.isObject(query)){
      var deepProperties = {};
      _.each( BaseQuery.prototype.deepProperties, function (prop){
        deepProperties[prop] = _.extend({} , BaseQuery.prototype[prop], query[prop]);
      });
    }

    var QueryClass  = ( _.isFunction(query) && query ) ||
        ( _.isObject(query) && BaseQuery.extend( _.extend( {}, query, deepProperties ) ) );

    // Registers a new query factory with a custom class
    this.queryFactories.register('Query', type, function (container, config){
      return new QueryClass(config);
    });
  };

  D.hasQuery = function(type){
    return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
  };

  D.getQuery = function(type, opts){
    if (_.isUndefined(type) ) {
      type = 'cda';
    } else if ( _.isObject(type) ) {
      opts = type;
      type = opts.queryType || 'cda';
    }
    var query = this.queryFactories.getNew('Query', type, opts);
    return query;
  };

  D.listQueries = function() {
    return _.keys( this.queryFactories.listType('Query') );
  };
})(Dashboards);


/*
 * Query STUFF
 * (Here for legacy reasons)
 * NOTE: The query type detection code should be kept in sync with CGG's UnmanagedComponent#detectQueryType.
 */
//Ctors:
// Query(queryString) --> DEPRECATED
// Query(queryDefinition{path, dataAccessId})
// Query(path, dataAccessId)
Query = function( cd, dataAccessId ) {

  var opts, queryType;

  if( _.isObject(cd) ){
    opts = $.extend(true, {}, cd);
    queryType = (_.isString(cd.queryType) && cd.queryType) || ( !_.isUndefined(cd.query) && 'legacy') ||
        ( !_.isUndefined(cd.path) && !_.isUndefined(cd.dataAccessId) && 'cda') || undefined ;
  } else if ( _.isString(cd) && _.isString(dataAccessId) ) {
    queryType = 'cda';
    opts = {
      path: cd,
      dataAccessId: dataAccessId
    };
  }

  if (!queryType) { throw 'InvalidQuery' }

  return Dashboards.getQuery(queryType, opts);
};
// QUERIES end



/*
 * UTILITY STUFF
 *
 *
 */

(function() {
  function accessorDescriptor(field, fun)
  {
    var desc = {
      enumerable: true,
      configurable: true
    };
    desc[field] = fun;
    return desc;
  }

  this.defineGetter = function defineGetter(obj, prop, get)
  {
    if (Object.prototype.__defineGetter__)
      return obj.__defineGetter__(prop, get);
    if (Object.defineProperty)
      return Object.defineProperty(obj, prop, accessorDescriptor("get", get));

    throw new Error("browser does not support getters");
  }

  this.defineSetter = function defineSetter(obj, prop, set)
  {
    if (Object.prototype.__defineSetter__)
      return obj.__defineSetter__(prop, set);
    if (Object.defineProperty)
      return Object.defineProperty(obj, prop, accessorDescriptor("set", set));

    throw new Error("browser does not support setters");
  }
})();





/*
 * Popups (Move somewhere else?)
 *
 *
 */


var wd = wd || {};
wd.cdf = wd.cdf || {};
wd.cdf.popups = wd.cdf.popups || {};

wd.cdf.popups.okPopup = {
  template: Mustache.compile(
      "<div class='cdfPopup'>" +
          "  <div class='cdfPopupHeader'>{{{header}}}</div>" +
          "  <div class='cdfPopupBody'>" +
          "    <div class='cdfPopupDesc'>{{{desc}}}</div>" +
          "    <div class='cdfPopupButton'>{{{button}}}</div>" +
          "  </div>" +
          "</div>"),
  defaults:{
    header: "Title",
    desc:"Description Text",
    button:"Button Text",
    callback: function (){
      return true
    }
  },
  $el: undefined,
  show: function (opts){
    if (opts || this.firstRender){
      this.render(opts);
    }
    this.$el.show();
  },
  hide: function (){
    this.$el.hide();
  },
  render: function (newOpts){
    var opts = _.extend( {} , this.defaults, newOpts );
    var myself = this;
    if (this.firstRender){
      this.$el = $('<div/>').addClass('cdfPopupContainer')
          .hide()
          .appendTo('body');
      this.firstRender = false;
    };
    this.$el.empty().html( this.template( opts ) );
    this.$el.find('.cdfPopupButton').click( function (){
      opts.callback();
      myself.hide();
    });
  },
  firstRender: true
};


/*
 * Error information divs
 *
 *
 */

wd.cdf.notifications = wd.cdf.notifications || {};

wd.cdf.notifications.component = {
  template: Mustache.compile(
      "<div class='cdfNotification component {{#isSmallComponent}}small{{/isSmallComponent}}'>" +
          "  <div class='cdfNotificationBody'>" +
          "    <div class='cdfNotificationImg'>&nbsp;</div>" +
          "    <div class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</div>" +
          "    <div class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</div>" +
          "  </div>" +
          "</div>" ),
  defaults:{
    title: "Component Error",
    desc: "Error processing component."
  },
  render: function (ph, newOpts){
    var opts = _.extend( {}, this.defaults, newOpts);
    opts.isSmallComponent = ( $(ph).width() < 300 );
    $(ph).empty().html( this.template( opts ) );
    var $nt = $(ph).find('.cdfNotification');
    $nt.css({'line-height': $nt.height() + 'px' });
  }
};

wd.cdf.notifications.growl = {
  template: Mustache.compile(
      "<div class='cdfNotification growl'>" +
          "  <div class='cdfNotificationBody'>" +
          "    <h1 class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</h1>" +
          "    <h2 class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</h2>" +
          "  </div>" +
          "</div>" ),
  defaults:{
    title: 'Title',
    desc: 'Default CDF notification.',
    timeout: 4000,
    onUnblock: function (){ return true },
    css: $.extend( {},
        $.blockUI.defaults.growlCSS,
        { position: 'absolute' , width: '100%' , top:'10px' } ),
    showOverlay: false,
    fadeIn: 700,
    fadeOut: 1000,
    centerY:false
  },
  render: function (newOpts){
    var opts = _.extend( {}, this.defaults, newOpts),
        $m = $( this.template( opts )),
        myself = this;
    opts.message = $m;
    var outerUnblock = opts.onUnblock;
    opts.onUnblock = function(){
      myself.$el.hide();
      outerUnblock.call(this);
    };
    if (this.firstRender){
      this.$el = $('<div/>').addClass('cdfNotificationContainer')
          .hide()
          .appendTo('body');
      this.firstRender = false;
    }
    this.$el.show().block(opts);
  },
  firstRender: true
};



