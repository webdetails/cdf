/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
   * @class cdf.dashboard."Dashboard.lifecycle"
   * @amd cdf/dashboard/Dashboard.lifecycle
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for lifecycle.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for lifecycle.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @summary Init counter.
     * @description Counter which stores the number of components in the dashboard being initialized. 
     *              This counter is incremented for every component in the dashboard that is initialized
     *              and decremented afterwards. The end result after the initialization process
     *              should be zero.
     *
     * @type {Number}
     * @protected
     * @deprecated
     */
    initCounter: undefined,

    /**
     * @summary Running calls counter.
     * @description Running calls counter used to control the progress indicator in asynchronous calls.
     *
     * @type {Number}
     * @protected
     */
    runningCalls: undefined,

    /**
     * @summary Last server response timestamp.
     * @description Last server response timestamp in milliseconds, which used to know if the session expired.
     *
     * @type {Number}
     * @protected
     */
    lastServerResponse: undefined,

    /**
     * @summary Timeout value in milliseconds.
     * @description Timeout value in milliseconds. If `serverCheckResponseTimeout` passes between ajax
     *              communications, then when the next {@link cdf.dashboard.Dashboard#updateComponent|updateComponent}
     *              is called, the dashboard will first {@link cdf.dashboard.Dashboard#checkServer|checkServer},
     *              showing a {@link cdf.dashboard.Dashboard#loginAlert|loginAlert} if it is unable to connect
     *              to the server.
     *
     * @type {Number}
     * @protected
     */
    serverCheckResponseTimeout: undefined,

    /**
     * @summary Initializes the lifecycle.
     * @description Initializes the lifecycle, setting the default values for
     *              {@link cdf.dashboard.Dashboard#initCounter|initCounter},
     *              {@link cdf.dashboard.Dashboard#runningCalls|runningCalls},
     *              {@link cdf.dashboard.Dashboard#lastServerResponse|lastServerResponse} and
     *              {@link cdf.dashboard.Dashboard#serverCheckResponseTimeout|serverCheckResponseTimeout}.
     *
     * @private
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
     * @summary Resets the running calls counter and hides the progress indicator.
     * @description Resets the running calls counter and hides the progress indicator.
     */
    resetRunningCalls: function() {
      this.runningCalls = 0;
      setTimeout(_.bind(function() {
        this.hideProgressIndicator();
      }, this), 10);
    },

    /**
     * @summary Returns the number of running calls.
     * @description Returns the number of running calls.
     *
     * @return {number} Number of actual running calls to the server
     */
    getRunningCalls: function() {
      return this.runningCalls;
    },

    /**
     * @summary Increments the running calls counter.
     * @description Increments the running calls counter.
     */
    incrementRunningCalls: function() {
      this.runningCalls++;
      this.showProgressIndicator();
      Logger.log("+Running calls incremented to: " + this.getRunningCalls());
    },

    /**
     * @summary Decrements the running calls counter.
     * @description Decrements the running calls counter and if it reaches 0, hides the progress indicator.
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
     * @summary Dashboard's initialization function.
     * @description Dashboard's initialization function. Calling this method will trigger the dashboard execution and render.
     *
     * @param {Array<cdf.components.BaseComponent>} [components] List of components to be added to the dashboard.
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
        .filter(function(c) { return typeof c.initInstance === "undefined"; })
        .each(function(c) { c.initInstance = initInstance; });

      $(function() { myself._initEngine(initInstance); });
    },

    /**
     * @summary Part of the initialization procedure.
     * @description Part of the initialization procedure. This supports some deprecated functionality.
     *
     * @private
     * @param {Number} initInstance A number identifying the instance.
     * @fires cdf.event:cdf
     * @fires cdf.dashboard.Dashboard#event:"cdf:preInit"
     *
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
      if(!myself.getComponent("PostInitMarker")) {
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
      }

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
     * @summary Handles the postInit section of the dashboard initialization.
     * @description Handles the postInit section of the dashboard initialization.
     *
     * @private
     * @param {Number} initInstance A number identifying the instance.
     * @fires cdf.event:cdf
     * @fires cdf.dashboard.Dashboard#event:"cdf:postInit"
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
     * @summary Update algorithm for a managed component.
     * @description Update algorithm for a managed component. Calls `preExecution`, `update` and `postExecution`.
     *
     * @private
     * @param {cdf.components.BaseComponent} object The component to update.
     * @fires cdf.event:cdf
     * @fires cdf.components.BaseComponent#event:"cdf:preExecution"
     * @fires cdf.components.BaseComponent#event:"cdf:postExecution"
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
     * @summary Update components by priority.
     * @description <p>Expects as parameter an object where the keys
     *              are the priorities, and the values are arrays of components that should be
     *              updated at that priority level:</p>
     *
     *     {
     *       0: [c1,c2],
     *       2: [c3],
     *       10: [c4]
     *     }
     *
     * <p>Alternatively, you can pass an array of components, `[c1, c2, c3]`, in which
     * case the priority-keyed object will be created internally from the priority
     * values the components declare for themselves.</p>
     *
     * <p>Note that even though `updateAll` expects `components` to have numerical
     * keys, and that it does work if you pass it an array, `components` should be
     * an object, rather than an array, so as to allow negative keys (and so that
     * we can use it as a sparse array of sorts).</p>
     *
     * @private
     * @param {Array<cdf.components.BaseComponent>} components The list of components to update
     * @see {@link cdf.dashboard.Dashboard#updateComponent|updateComponent}
     */
    updateAll: function(components) {
      /*
       * Add all components in priority list 'source' into priority list 'target'.
       */
      var _mergePriorityLists = function(target, source) {
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
          current: null,
          updatingInFlight: []
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
          this.updating.updatingInFlight = _.without(this.updating.updatingInFlight, component);
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
          if(this.updating.updatingInFlight.indexOf(component) == -1) {
            this.updating.updatingInFlight.push(component);
          }
        }
      }

    },

    /**
     * @summary Adds a component to the "to be updated" queue.
     * @description Adds a component to the "to be updated" queue and starts a timer.
     *              If the timer finishes before this method is called again, the
     *              {@link cdf.dashboard.Dashboard#updateAll|updateAll} method is called, 
     *              updating all the components in the queue.
     *
     * @param {cdf.components.BaseComponent} component The component to update.
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
     * @summary Updates a specific component.
     * @description Updates a specific component.
     *
     * @param {cdf.components.BaseComponent} object The component to update.
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
     * @summary Gets the first tier from a list of component priority tiers.
     * @description Given a `tiers` object like:
     *
     *     {
     *       0: [c1,c2],
     *       2: [c3],
     *       10: [c4]
     *     }
     *
     * Where `key: value` are `priority: components-array`, returns the highest priority non-empty
     * tier of components awaiting update, or null if no such tier exists.
     *
     * @private
     * @param {Object} tiers The component priority tiers map.
     * @return {?Array<cdf.components.BaseComponent>} The highest priority components or null.
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
     * @summary Resets the dashboard.
     * @description Resets the dashboard, clearing all the components, and re-updating them.
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
     * @summary Processes a change in a component.
     * @description <p>Given the component with name `object_name`, a change is processed as follows:</p>
     *              <p>We get the `parameter` and the `value` from the component (`getValue()`). Then
     *              we do the actual processing:</p>
     *              <ol><li>component.{@link cdf.components.BaseComponent#preChange|`preChange(value)`}</li>
     *              <li>dashboard.{@link cdf.dashboard.Dashboard#fireChange|fireChange(`parameter`,`value`)}</li>
     *              <li>component.{@link cdf.components.BaseComponent#postChange|`postChange(value)`}</li></ol>
     *
     * @param {string} object_name The component name.
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
     * @summary Changes the value of a parameter, triggering a
     *          {@link cdf.dashboard.Dashboard#event:"parameterName:fireChange"|<em>parameter</em>:fireChange} event.
     * @description <p>Changes the value of a parameter with the provided name. Triggers the
     *              {@link cdf.dashboard.Dashboard#event:"parameterName:fireChange"|<em>parameter</em>:fireChange}
     *              event and updates the components which listen for changes on the aforementioned parameter.</p>
     *              <p>Because some browsers will not draw the blockUI widgets until the script has finished, we
     *              find the list of components to update, then execute the actual update in a function wrapped
     *              in a setTimeout so the running script has the opportunity to finish.</p>
     *
     * @param {string} parameter The name of the parameter on which to fire the change.
     * @param {Object} value Value for the parameter.
     * @fires cdf.event:cdf
     * @fires cdf.dashboard.Dashboard#event:"parameterName:fireChange"
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

    /**
     * @summary Checks if there are other components awaiting execution.
     * @description Checks if there are any other components of equal or higher
     *              priority than the one that is currently being executed awaiting execution.
     *
     * @private
     * @param {Object} tiers The list of component priority tiers.
     * @param {Object} current The current component.
     * @return {boolean} `true` if the first tier has components with equal or higher priority
     *                   than the current component, `false` otherwise.
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

      // componentsToUpdate has components with equal or higher priority than the component
      // that is currently being executed, that await execution themselves
      return true;
    },

    /**
     * @summary Cheks if a component is being updated in the dashboard lifecycle.
     * @description When a component is upodated in the dashboard it goes through a series of states,
     *              and tracking all those states can be difficult. This function eases that by checking in all the
     *              appropriate lifecycle states if the component is being updated.
     *
     * @param {cdf.components.BaseComponent} the component to check if is being updated.
     */
    isComponentUpdating: function(component) {
      if(this.updateQueue && this.updateQueue.indexOf(component) != -1) {
        return true;
      }

      if(this.updating) {
        if (this.updating.current && this.updating.current.components) {
          var isRunningCurrent = _.some(this.updating.current.components, function (updatingComp) {
            if (updatingComp === component) {
              return true;
            }
          });
          if (isRunningCurrent) {
            return isRunningCurrent;
          }
        }

        if (this.updating.tiers) {
          var isRunningTier = _.some(this.updating.tiers, function (tier) {
            return _.some(tier, function (tierComponent) {
              return tierComponent === component;
            });
          });
          if (isRunningTier) {
            return isRunningTier;
          }
        }

        if (this.updating.updatingInFlight) {
          return _.some(this.updating.updatingInFlight, function (inFlightComponent) {
            return inFlightComponent === component;
          });
        }
      }

      return false;
    }

  });
});
