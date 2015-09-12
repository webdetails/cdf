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

define([
  './Dashboard',
  '../Logger',
  'amd!../lib/underscore',
  '../components/UnmanagedComponent',
  '../lib/jquery'
], function(Dashboard, Logger, _, UnmanagedComponent, $) {

  /**
   * A module representing an extension to the Dashboard module for lifecycle.
   *
   * @module Dashboard.lifecycle
   */
  Dashboard.implement({

    /**
     * Inits the lifecycle module.
     *
     * @method _initLifecycle
     * @private
     * @for Dashboard
     */
    _initLifecycle: function() {
      // Init Counter, for subdashboards
      this.initCounter = 0;

      // Used to control progress indicator for async mode
      this.runningCalls = 0;

      // Object properties used to keep the server track and identify if the session did expired
      this.lastServerResponse = Date.now ? Date.now() : new Date().getTime();
      // [BACKLOG-5131] default disabled, value in milliseconds, will be overridden during init via dashboard context
      this.serverCheckResponseTimeout = Infinity;
    },

    /**
     * Resets the running calls counter and hides the progress indicator.
     *
     * @method resetRunningCalls
     * @for Dashboard
     */
    resetRunningCalls: function() {
      this.runningCalls = 0;
      setTimeout(_.bind(function() {
        this.hideProgressIndicator();
      }, this), 10);
    },

    /**
     * Returns the number of running calls.
     *
     * @return {number} Number of actual running calls to the server
     *
     * @method getRunningCalls
     * @for Dashboard
     */
    getRunningCalls: function() {
      return this.runningCalls;
    },

    /**
     * Increments the running calls counter.
     *
     * @method incrementRunningCalls
     * @for Dashboard
     */
    incrementRunningCalls: function() {
      this.runningCalls++;
      this.showProgressIndicator();
      Logger.log("+Running calls incremented to: " + this.getRunningCalls());
    },

    /**
     * Decrements the running calls counter. If the counter reaches 0, hides the progress indicator.
     *
     * @method decrementRunningCalls
     * @for Dashboard
     */
    decrementRunningCalls: function() {
      this.runningCalls--;
      Logger.log("-Running calls decremented to: " + this.getRunningCalls());
      setTimeout(_.bind(function() {
        if(this.runningCalls <= 0) {
          this.hideProgressIndicator();
          this.runningCalls = 0; // Just in case
        }
      }, this), 10);
    },

    /**
     * Init function for the dashboard. Calling this method will trigger the dashboard execution and render.
     *
     * @method init
     * @param components - Components to be added to the dashboard
     * @for Dashboard
     */
    init: function(components) {
      var myself = this;

      // We're now adding support for multiple inits. This part is only relevant for
      // the first execution.

      var initInstance = myself.initCounter++;
      Logger.log("InitInstance " + initInstance);

      if(initInstance == 0) {

        myself.syncDebugLevel();

        if(myself.initialStorage) {
          _.extend(myself.storage, myself.initialStorage);
        } else {
          myself.loadStorage();
        }

        if(myself.context != null && myself.context.sessionTimeout != null) {
          //defaulting to 90% of ms value of sessionTimeout
          myself.serverCheckResponseTimeout = myself.context.sessionTimeout * 900;
        }

        myself.restoreBookmarkables();
        myself.restoreView();
        myself.syncParametersInit();

      }

      if(_.isArray(components)) {
        myself.addComponents(components);
      }

      // Now we need to go through all components we have and attach this
      // initInstance to all
      _.chain(myself.components)
        .where({initInstance: undefined})
        .each(function(c) { c.initInstance = initInstance; });

      $(function() { myself._initEngine(initInstance); });
    },

    /**
     * Part of the initialization procedure. This supports some deprecated functionality.
     *
     * @method _initEngine
     * @for Dashboard
     * @param initInstance
     * @private
     * @deprecated
     */
    _initEngine: function(initInstance) {
      var myself = this;

      // Should really throw an error? Or return?
      if(myself.waitingForInit && myself.waitingForInit.length) {
        Logger.log("Overlapping initEngine!", 'warn');
      }

      var components = initInstance != null
        ? _.where(myself.components, {initInstance: initInstance})
        : myself.components;

      if((!myself.waitingForInit || myself.waitingForInit.length === 0) && !myself.finishedInit) {
        myself.incrementRunningCalls();
      }

      Logger.log("          [Lifecycle >Start] Init[" + initInstance + "] (Running: " + myself.getRunningCalls() + ")",
                 "log",
                 "color: #ddd");

      myself.createAndCleanErrorDiv();
      // Fire all pre-initialization events
      if(typeof myself.preInit == 'function') {
        myself.preInit();
      }

      myself.trigger("cdf cdf:preInit", myself);
      /* Legacy Event -- don't rely on this! */
      $(window).trigger('cdfAboutToLoad');
      var myself = myself;
      var updating = [],i;
      for(i = 0; i < components.length; i++) {
        if(components[i].executeAtStart) {
          updating.push(components[i]);
        }
      }

      if(!updating.length) {
        myself._handlePostInit();
        return;
      }

      // Since we can get into racing conditions between last component's
      // preExecution and dashboard.postInit, we'll add a last component with very
      // low priority who's function is only to act as a marker.
      var postInitComponent = new UnmanagedComponent({
        name: "PostInitMarker",
        type: "unmanaged",
        lifecycle: {
          silent: true
        },
        executeAtStart: true,
        priority: 999999999
      });
      myself.addComponent(postInitComponent);  //TODO: check this!!!!
      updating.push(postInitComponent);

      myself.waitingForInit = updating.slice();

      var callback = function(comp, isExecuting) {
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
        myself.waitingForInit = _(myself.waitingForInit).without(comp);
        comp.off('cdf:postExecution', callback);
        comp.off('cdf:preExecution', callback);
        comp.off('cdf:error', callback);
        myself._handlePostInit(initInstance);
      };

      for(var i = 0, len = updating.length; i < len; i++) {
        var component = updating[i];
        component.on('cdf:postExecution cdf:preExecution cdf:error', callback, myself);
      }
      myself.updateAll(updating);
      if(components.length > 0) {
        myself._handlePostInit(initInstance);
      }
    },

    /**
     * Handles the postInit section of the dashboard initialization.
     *
     * @method _handlePostInit
     * @param initInstance
     * @private
     * @for Dashboard
     */
    _handlePostInit: function(initInstance) {
      var myself = this;

      var _restoreDuplicates = function() {
        /*
         * We mark duplicates by appending an _nn suffix to their names.
         * This means that, when we read the parameters from bookmarks,
         * we can look for the _nn suffixes, and infer from those suffixes
         * what duplications were triggered, allowing us to reproduce that
         * state as well.
         */
        var dupes = _.filter(myself.components, function(c) { return c.type == 'duplicate'; }),
          suffixes = {},
          params = myself.getBookmarkState().params || {};
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
        _.map(_.filter(Object.keys(params), function(e) {
          return /(_[0-9]+)+$/.test(e);
        }), function(e) {
          var parts = e.match(/(.*?)((_[0-9]+)+)$/),
              name = parts[1],
              suffix = parts[2];
          if(!suffixes[suffix]) {
            suffixes[suffix] = {};
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
        for(var s in suffixes) {
          if(suffixes.hasOwnProperty(s)) {
            var params = suffixes[s];
            $.each(dupes, function(i, e) {
              var p;
              for(p = 0; p < e.parameters.length; p++) {
                if(!params.hasOwnProperty(e.parameters[p]) && myself.isBookmarkable(e.parameters[p])) {
                  return;
                }
              }
              e.duplicate(params);
            });
          }
        }
      };

      if((!myself.waitingForInit || myself.waitingForInit.length === 0) && !myself.finishedInit) {
        myself.trigger("cdf cdf:postInit", myself);
        /* Legacy Event -- don't rely on this! */
        $(window).trigger('cdfLoaded');

        if(typeof myself.postInit == "function") {
          myself.postInit();
        }
        _restoreDuplicates();
        myself.finishedInit = true;

        myself.decrementRunningCalls();
        Logger.log("          [Lifecycle <End  ] Init[" + initInstance + "] (Running: " + myself.getRunningCalls() + ")",
                   "log",
                   "color: #ddd");
      }
    },

    /**
     * Update algorithm for a managed component. Calls preExecution, update and postExecution.
     *
     * @method updateLifecycle
     * @param object Component to update
     *
     * @for Dashboard
     * @private
     */
    updateLifecycle: function(object) {
      var silent = object.lifecycle ? !!object.lifecycle.silent : false;

      if(object.disabled) {
        return;
      }
      if(!silent) {
        this.incrementRunningCalls();
      }
      var handler = _.bind(function() {
        try {
          var shouldExecute;
          if(!(typeof(object.preExecution) == 'undefined')) {
            shouldExecute = object.preExecution.apply(object);
          }
          /*
           * If `preExecution` returns anything, we should use its truth value to
           * determine whether the component should execute. If it doesn't return
           * anything (or returns `undefined`), then by default the component
           * should update.
           */
          shouldExecute = (typeof shouldExecute != "undefined") ? !!shouldExecute : true;
          object.trigger('cdf cdf:preExecution', object, shouldExecute);
          if(!shouldExecute) {
            return; // if preExecution returns false, we'll skip the update
          }
          if(object.tooltip != undefined) {
            object._tooltip = (typeof object["tooltip"] == 'function') ? object.tooltip() : object.tooltip;
          }
          // first see if there is an objectImpl
          if((object.update != undefined) && (typeof object['update'] == 'function')) {
            object.update();

            // check if component has periodic refresh and schedule next update
            this.refreshEngine.processComponent(object);

          } else {
            // unsupported update call
          }

          if(!(typeof(object.postExecution) == 'undefined')) {
            object.postExecution.apply(object);
          }
          // if we have a tooltip component, how is the time.
          if(object._tooltip != undefined) {
            $("#" + object.htmlObject).attr("title", object._tooltip).tooltip({
              delay: 0,
              track: true,
              fade: 250
            });
          }
        } catch(e) {
          var ph = (object.htmlObject) ? $('#' + object.htmlObject) : undefined,
            msg = this.getErrorObj('COMPONENT_ERROR').msg + ' (' + object.name.replace('render_', '') + ')';
          this.errorNotification({msg: msg}, ph);
          Logger.error("Error updating " + object.name + ":");
          Logger.exception(e);
        } finally {
          if(!silent) {
            this.decrementRunningCalls();
          }
        }

        // Triggering the event for the rest of the process
        object.trigger('cdf cdf:postExecution', object);

      }, this);
      setTimeout(handler, 1);
    },

    /**
     * Update components by priority. Expects as parameter an object where the keys
     * are the priorities, and the values are arrays of components that should be
     * updated at that priority level:
     *
     *  {
     *    0: [c1,c2],
     *    2: [c3],
     *    10: [c4]
     *  }
     *
     * Alternatively, you can pass an array of components, `[c1, c2, c3]`, in which
     * case the priority-keyed object will be created internally from the priority
     * values the components declare for themselves.
     *
     * Note that even though `updateAll` expects `components` to have numerical
     * keys, and that it does work if you pass it an array, `components` should be
     * an object, rather than an array, so as to allow negative keys (and so that
     * we can use it as a sparse array of sorts).
     *
     * @method updateAll
     * @param components Components to update
     *
     * @for Dashboard
     * @private
     */
    updateAll: function(components) {
      /*
       * Add all components in priority list 'source' into priority list 'target'
       */
      var _mergePriorityLists = function(target,source) {
        if(!source) {
          return;
        }
        for(var key in source) if(source.hasOwnProperty(key)) {
          if(_.isArray(target[key])) {
            target[key] = _.union(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      };

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
            if(!comps[prio]) {
              comps[prio] = [];
            }
            comps[prio].push(c);
          }
        });
        components = comps;
      }
      _mergePriorityLists(this.updating.tiers, components);

      var updating = this.updating.current;
      var othersAwaitExecution = false;
      if(updating === null || updating.components.length == 0
        || (othersAwaitExecution = this.othersAwaitExecution(_.clone(this.updating.tiers), this.updating.current))) {

        var toUpdate = this.getFirstTier(this.updating.tiers);
        if(!toUpdate) { return; }

        if(othersAwaitExecution) {
          var tiers = this.updating.tiers;
          tiers[updating.priority] = _.difference(tiers[updating.priority], updating.components);
          toUpdate.components = _.union(tiers[updating.priority], this.getFirstTier(tiers).components); 
        }

        this.updating.current = toUpdate;

        var postExec = function(component, isExecuting) {
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
          component.off("cdf:postExecution", postExec);
          component.off("cdf:preExecution", postExec);
          component.off("cdf:error", postExec);
          var current = this.updating.current;
          current.components = _.without(current.components, component);
          var tiers = this.updating.tiers;
          tiers[current.priority] = _.without(tiers[current.priority], component);
          this.updateAll();
        };
        /*
         * Any synchronous components we update will edit the `current.components`
         * list midway through this loop, so we need a separate copy of that list
         * so as to avoid messing up the indices.
         */
        var comps = this.updating.current.components.slice();
        for(var i = 0; i < comps.length; i++) {
          var component = comps[i];
          // Start timer

          component.startTimer();
          component.on("cdf:postExecution cdf:preExecution cdf:error", postExec, this);

          // Logging this.updating. Uncomment if needed to trace issues with lifecycle
          // Logger.log("Processing "+ component.name +" (priority " + this.updating.current.priority +"); Next in queue: " +
          //  _(this.updating.tiers).map(function(v,k) {return k + ": [" + _(v).pluck("name").join(",") + "]"}).join(", "));
          this.updateComponent(component);
        }
      }

    },

    /**
     * Adds a component to the "to be updated" queue and starts a timer.
     * If the timer finishes before this method is called again, the
     * {{#crossLink "Dashboard/updateAll:method"}}updateAll{{/crossLink}} method is called
     * updating all the components in the queue.
     *
     * @method update
     * @param component Component to update
     *
     * @for Dashboard
     */
    update: function(component) {
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
      if(!this.updateQueue) {
        this.updateQueue = [];
      }
      this.updateQueue.push(component);
      if(this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }

      var handler = _.bind(function() {
        this.updateAll(this.updateQueue);
        delete this.updateQueue;
      },this);
      this.updateTimeout = setTimeout(handler, 5);
    },

    /**
     * Updates a specific component.
     *
     * @method updateComponent
     * @param object component to update
     *
     * @for Dashboard
     */
    updateComponent: function(object) {
      if((Date.now ? Date.now() : new Date().getTime()) - this.lastServerResponse > this.serverCheckResponseTimeout) {
        //too long in between ajax communications
        if(!this.checkServer()) {
          this.hideProgressIndicator();
          this.loginAlert();
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
    },

    /**
     * Given a list of component priority tiers, returns the highest priority
     * non-empty tier of components awaiting update, or null if no such tier exists.
     *
     * @method getFirstTier
     * @param tiers
     * @return {*}
     * @for Dashboard
     * @private
     */
    getFirstTier: function(tiers) {
      var keys = _.keys(tiers).sort(function(a, b) {
        return parseInt(a, 10) - parseInt(b, 10);
      });

      var tier;
      for(var i = 0;i < keys.length; i++) {
        tier = tiers[keys[i]];
        if(tier.length > 0) {
          return { priority: keys[i], components: tier.slice() };
        }
      }
      return null;
    },

    /**
     * Resets the dashboard.
     *
     * @method resetAll
     * @for Dashboard
     */
    resetAll: function() {
      this.createAndCleanErrorDiv(); //Dashboard.legacy
      var compCount = this.components.length;
      for(var i = 0, len = this.components.length; i < len; i++) {
        this.components[i].clear();
      }
      var compCount = this.components.length;
      for(var i = 0, len = this.components.length; i < len; i++) {
        if(this.components[i].executeAtStart) {
          this.update(this.components[i]);
        }
      }
    },

    /**
     * Forces a process change on a component's parameter.
     *
     * @method processChange
     * @param object_name Component name on which the fireChange should be triggered
     *
     * @for Dashboard
     */
    processChange: function(object_name) {
      //Logger.log("Processing change on " + object_name);

      var object = this.getComponentByName(object_name);
      var parameter = object.parameter;
      var value;
      if(typeof object['getValue'] == 'function') {
        value = object.getValue();
      }
      if(value == null) {// We won't process changes on null values
        return;
      }
      if(!(typeof(object.preChange) == 'undefined')) {
        var preChangeResult = object.preChange(value);
        value = preChangeResult != undefined ? preChangeResult : value;
      }
      if(parameter) {
        this.fireChange(parameter, value);
      }
      if(!(typeof(object.postChange) == 'undefined')) {
        object.postChange(value);
      }
    },

    /**
     * fireChange must accomplish two things:
     * first, we must change the parameters
     * second, we execute the components that listen for
     * changes on that parameter.
     *
     * Because some browsers won't draw the blockUI widgets
     * until the script has finished, we find the list of
     * components to update, then execute the actual update
     * in a function wrapped in a setTimeout, so the running
     * script has the opportunity to finish.
     *
     * @method fireChange
     * @param parameter parameter on which to fire change
     * @param value Value for the parameter
     *
     * @for Dashboard
     */
    fireChange: function(parameter, value) {
      var myself = this;
      myself.createAndCleanErrorDiv(); //Dashboard.Legacy

      myself.setParameter(parameter, value, true);
      myself.trigger("cdf " + parameter + ":fireChange", {parameter: parameter, value: value});
      var toUpdate = [];
      var workDone = false;
      for(var i= 0, len = myself.components.length; i < len; i++) {
        if(_.isArray(myself.components[i].listeners)) {
          for(var j= 0 ; j < myself.components[i].listeners.length; j++) {
            var comp = myself.components[i];
            if(comp.listeners[j] == parameter && !comp.disabled) {
              toUpdate.push(comp);
              break;
            }
          }
        }
      }
      myself.updateAll(toUpdate);
    },

    /*
     * Checks if there are any other components of equal or higher 
     * priority than the one that is currently being executed.
     *
     * @method othersAwaitExecution
     * @for Dashboard
     *
     * @private
     */
    othersAwaitExecution: function(tiers, current) {

      if(!tiers || !current || !current.components) {
        return false;
      }

      // first thing is to discard 'current.components' from the calculations, as we are only 
      // interested in checking if there are *other components* that await execution
      tiers[current.priority] = _.difference(tiers[current.priority], current.components);

      var componentsToUpdate = this.getFirstTier(tiers);
      
      if(!componentsToUpdate || !componentsToUpdate.components || componentsToUpdate.components.length == 0) { 

        return false; // no other components await execution

      } else if(parseInt(componentsToUpdate.priority) > parseInt(current.priority)) {

        // recall: 1 - utmost priority , 999999 - lowest priority
        // those who await execution are lower in priority that the current component
        return false;
      } 

      // compToUpdate has components with equal or higher priority than the component 
      // that is currently being executed, that await execution themselves
      return true;
    }
  });
});
