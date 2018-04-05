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
  'amd!../lib/underscore'
], function(_) {

  /**
   * @description Builds a new refresh engine for the provided dashboard.
   *
   * @class cdf.dashboard.RefreshEngine
   * @amd cdf/dashboard/RefreshEngine
   * @summary Class that manages the periodic refresh of components.
   * @classdesc Class that manages the periodic refresh of components.
   * @param {cdf.dashboard.Dashboard} dashboard The dashboard instance to be managed by the refresh engine.
   */
  return function(dashboard) {
    /**
     * @summary Default value for the refresh period.
     * @description Default value for the refresh period.
     *              Currently no distinction between explicitly disabled or not set.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @type {number}
     * @readonly
     * @const
     * @default 0
     * @private
     */
    var NO_REFRESH = 0;
    /**
     * @summary The component refresh queue.
     * @description The component refresh queue.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @type {Array<cdf.dashboard.RefreshEngine#QueueItem>}
     * @default []
     * @private
     */
    var refreshQueue = new Array();
    /**
     * @summary Timer for the individual component refresh.
     * @description Timer for the individual component refresh.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @type {string}
     * @default null
     * @private
     */
    var activeTimer = null;
  
    /**
     * @summary The global refresh period.
     * @description The global refresh period.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @type {number}
     * @default 0
     * @private
     */
    var globalRefreshPeriod = NO_REFRESH;

    /**
     * @summary The global timer.
     * @description The global timer.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @type {number}
     * @default null
     * @private
     */
    var globalTimer = null;

    /**
     * @summary A container for the queue items.
     * @classdesc A container for the queue items.
     *
     * @class
     * @memberof cdf.dashboard.RefreshEngine#
     * @description Creates a new queue item.
     * @private
     */
    var QueueItem = function() {
      return /** @lends cdf.dashboard.RefreshEngine#QueueItem# */ {
        /**
         * @summary The next refresh value.
         * @description The next refresh value. This value is used to sort the refresh queue.
         * @type {Number}
         * @default 0
         */
        nextRefresh: 0,
        /**
         * @summary The component to be refreshed.
         * @description The component to be refreshed.
         * @type {cdf.components.BaseComponent}
         * @default null
         */
        component: null
      };
    };

    /**
     * @summary Set {@link cdf.dashboard.RefreshEngine#globalTimer|globalTimer} and (re)start interval.
     * @description Set {@link cdf.dashboard.RefreshEngine#globalTimer|globalTimer} and (re)start interval.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {number} refreshPeriod The refresh interval.
     * @private
     */
    var startGlobalRefresh = function(refreshPeriod) {
      if(globalTimer != null) {
        clearInterval(globalTimer);
        globalTimer = null;
      }
      globalRefreshPeriod = (refreshPeriod > 0) ? refreshPeriod : NO_REFRESH;
      if(globalRefreshPeriod != NO_REFRESH) {
        globalTimer = setInterval(dashboard.refreshEngine.fireGlobalRefresh, globalRefreshPeriod * 1000);
      }
    };

    /**
     * @summary Removes a component from the refresh queue.
     * @description Removes a component from the refresh queue.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {cdf.components.BaseComponent} component The component to remove from the refresh queue.
     * @private
     */
    var clearFromQueue = function(component) {
      for(var i = 0; i < refreshQueue.length; i++) {
        if(refreshQueue[i].component == component) {
          refreshQueue.splice(i, 1);
          i--;
        }
      }
    };

    /**
     * @summary Clears the refresh queue.
     * @description Removes all components from the refresh queue.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @private
     */
    var clearQueue = function() {
      if(refreshQueue.length > 0) {
        refreshQueue.splice(0, refreshQueue.length);
      }
    };

    /**
     * @summary Gets the index at which the queue item `elem` should be
     *          added to the `coll` sorted array.
     * @description Gets the index at which the queue item `elem` should
     *              be added to the `coll` ascending sorted array. The array is sorted
     *              using the queue items `nextRefresh` property.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {Array<cdf.dashboard.RefreshEngine#QueueItem>} coll An array of queue items sorted in ascending order.
     * @param {cdf.dashboard.RefreshEngine#QueueItem} elem The queue item to add to the array.
     * @return {Number} The index position where `elem` should be inserted.
     * @private
     */
    var getSortedInsertPosition = function(coll, elem) {
      var high = coll.length - 1;
      var low = 0;
      var mid;

      while(low <= high) {
        mid = parseInt((low + high) / 2);
        if(coll[mid].nextRefresh > elem.nextRefresh) {
          high = mid - 1;
        } else if(coll[mid].nextRefresh < elem.nextRefresh) {
          low = mid + 1;
        } else {
          return mid;
        }
      }
      return low;
    };

    /**
     * @summary Adds the queue item `rtInfo` to the sorted array `rtArray`.
     * @description Adds the queue item `rtInfo` to the sorted array `rtArray`.
     *              The array is sorted using the queue items `nextRefresh` property.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {Array<cdf.dashboard.RefreshEngine#QueueItem>} rtArray An array of queue items sorted in ascending order.
     * @param {cdf.dashboard.RefreshEngine#QueueItem} rtInfo The queue item to add to the array.
     * @private
     */
    var sortedInsert = function(rtArray, rtInfo) {
      var pos = getSortedInsertPosition(rtArray,rtInfo);
      rtArray.splice(pos, 0, rtInfo);
    };

    /**
     * @summary Removes the current active timer.
     * @description Removes the current active timer.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @private
     */
    var stopTimer = function() {
      if(activeTimer != null) {
        clearTimeout(activeTimer);
        activeTimer = null;
      }
    };

    /**
     * @summary Stops the current active timer and starts a refresh cycle.
     * @description Stops the current active timer and starts a refresh cycle
     *              by executing {@link cdf.dashboard.RefreshEngine#fireRefresh|fireRefresh}.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @private
     */
    var restartTimer = function() {
      stopTimer();
      dashboard.refreshEngine.fireRefresh();
    };

    /**
     * @summary Gets the current time in milliseconds according to universal time.
     * @description Gets the current time in milliseconds according to universal time.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @return {Number} The current time in milliseconds according to universal time.
     * @private
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime|Date.prototype.getTime()}
     */
    var getCurrentTime = function() {
      return (new Date()).getTime();
    };

    /**
     * @summary Checks if `component` is the first in the refresh queue.
     * @description Checks if `component` is the first in the refresh queue.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {cdf.components.BaseComponent} component The target component.
     * @return {Boolean} `true` if `component` is the first in the refresh queue, `false` otherwise.
     * @private
     */
    var isFirstInQueue = function(component) {
      return refreshQueue.length > 0 && refreshQueue[0].component == component;
    };

    /**
     * @summary Executes {@link cdf.dashboard.Dashboard#updateComponent|updateComponent} using the provided component.
     * @description Executes {@link cdf.dashboard.Dashboard#updateComponent|updateComponent} using the provided component.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {cdf.components.BaseComponent} component The component to update.
     * @private
     * @see {@link cdf.dashboard.Dashboard#updateComponent|updateComponent}
     */
    var refreshComponent = function(component) {
      dashboard.update(component);
    };

    /**
     * @summary Inserts the provided component into the sorted refresh queue.
     * @description Creates a new {@link cdf.dashboard.RefreshEngine#QueueItem|QueueItem} instance
     *              using the provided component and inserts it into the sorted refresh queue.
     *
     * @memberof cdf.dashboard.RefreshEngine#
     * @param {cdf.components.BaseComponent} component The target component.
     * @private
     * @see {@link cdf.dashboard.RefreshEngine#sortedInsert|sortedInsert}
     */
    var insertInQueue = function(component) {
      var time = getCurrentTime();
      // normalize invalid refresh
      if(!(component.refreshPeriod > 0)) {
        component.refreshPeriod = NO_REFRESH;

        //tries to fetch the component refresh rate from the data source definition
        var dataSourceId = component.chartDefinition && component.chartDefinition.dataSource ? dataSourceId = component.chartDefinition.dataSource :
            (component.queryDefinition && component.queryDefinition.dataSource ? component.queryDefinition.dataSource : null);
        if(dataSourceId !== null) {
          if(dashboard.dataSources && dashboard.dataSources[dataSourceId]) {
            if(!isNaN(+dashboard.dataSources[dataSourceId].componentRefreshPeriod) &&
              (+dashboard.dataSources[dataSourceId].componentRefreshPeriod) > 0) {
              component.refreshPeriod = +dashboard.dataSources[dataSourceId].componentRefreshPeriod;
            }
          }
        }

      }
      if(component.refreshPeriod != NO_REFRESH) {
        //get next refresh time for component
        var info = new QueueItem();
        info.nextRefresh = time + (component.refreshPeriod * 1000);
        info.component = component;
        sortedInsert(refreshQueue, info);
      }
    };

    /**
     * @summary Removes and inserts the component in the refresh queue.
     * @description Removes and inserts the component in the refresh queue.
     *
     * @param {cdf.components.BaseComponent} component The target component.
     */
    var reinsertInQueue = function(component) {
      clearFromQueue(component);
      insertInQueue(component);
    };

    return /** @lends cdf.dashboard.RefreshEngine# */ {

      /**
       * @summary Sets a components refresh period and clears it from the queue.
       * @description Sets a components refresh period and clears it from the queue.
       *              {@link cdf.dashboard.RefreshEngine#processComponent|processComponent}
       *              must be called to activate the refresh timer for the component.
       *
       * @param {cdf.components.BaseComponent} component The component to register.
       * @param {number} refreshPeriod The associated refresh period.
       * @return {boolean} `true` if registration succeeds, `false` otherwise.
       */
      registerComponent: function(component, refreshPeriod) {
        if(!component) { return false; }

        component.refreshPeriod = (refreshPeriod > 0) ? refreshPeriod : NO_REFRESH;
        var wasFirst = isFirstInQueue(component);
        clearFromQueue(component);
        if(wasFirst) { restartTimer(); }

        return true;
      },

      /**
       * @summary Gets the refresh period for a component.
       * @description Gets the refresh period for a component.
       *
       * @param {cdf.components.BaseComponent} component The target component.
       * @return {number} The components refresh period value or the value of {@link cdf.dashboard.RefreshEngine#NO_REFRESH|NO_REFRESH}.
       */
      getRefreshPeriod: function(component) {
        if(component && component.refreshPeriod > 0) {
          return component.refreshPeriod;
        } else {
          return NO_REFRESH;
        }
      },

      /**
       * @summary Removes and adds the given component into the refresh queue restarting the timer if it is the first in the queue.
       * @description Removes and adds the given component into the refresh queue. If the component is the first
       *              in the sorted queue, {cdf.dashboard.RefreshEngine.restartTimer|restartTimer} is executed.
       *
       * @param {cdf.components.BaseComponent} component The component to process.
       * @return {boolean} `true` after the component was correctly processed.
       */
      processComponent: function(component) {
        reinsertInQueue(component);
        if(isFirstInQueue(component)) {
          restartTimer();
        }
        return true;//dbg
      },

      /**
       * @summary Clears the queue, adds all the dashboard components into the queue, and restarts the timer.
       * @description Clears the queue, adds all the dashboard components into the queue, and restarts the timer.
       *
       * @return {boolean} `true` after the components are processed.
       */
      processComponents: function() {
        clearQueue();
        for(var i = 0; i < dashboard.components.length; i++) {
          insertInQueue(dashboard.components[i]);
        }
        restartTimer();
        return true;//dbg
      },

      /**
       * @summary Pops up due items from the queue, refreshes components and sets the next timeout.
       * @description Pops up due items from the queue, refreshes components and sets the next timeout.
       */
      fireRefresh: function() {
        activeTimer = null;
        var currentTime = getCurrentTime();
        var component = null;

        while(refreshQueue.length > 0 && refreshQueue[0].nextRefresh <= currentTime) {
          var info = refreshQueue.shift();//pop first
          component = info.component;

          //call update, which calls processComponent, but only if not updating
          //if the component is updating we reinsert it into the queue
          if(!dashboard.isComponentUpdating(component)) {
            refreshComponent(component);
          }else {
            insertInQueue(component);
          }
        }

        if(refreshQueue.length > 0) {
          activeTimer = setTimeout(dashboard.refreshEngine.fireRefresh, refreshQueue[0].nextRefresh - currentTime);
        }
      },

      /**
       * @summary Updates all components that do not have a valid refresh period.
       * @description Called when a valid {@link cdf.dashboard.RefreshEngine#globalRefreshPeriod|globalRefreshPeriod}
       *              exists. It updates all components that do not have a valid refresh period.
       */
      fireGlobalRefresh: function() {
        for(var i = 0; i < dashboard.components.length; i++) {
          var comp = dashboard.components[i];
          if(!(comp.refreshPeriod > 0) //only update those without refresh
            && comp.type != "select") { //and that are not pov widgets

            refreshComponent(comp);
          }
        }
      },

      /**
       * @summary Sets the global refresh period.
       * @description Sets the global refresh period.
       *
       * @param {number} refreshPeriod Refresh period to set.
       */
      setGlobalRefresh: function(refreshPeriod) {
        startGlobalRefresh(refreshPeriod);
      },

      /**
       * @summary Gets the current refresh queue.
       * @description Gets the current refresh queue.
       *
       * @return {Array<cdf.dashboard.RefreshEngine#QueueItem>} An array with the components that need to be refreshed.
       * @private
       */
      getQueue: function() {
        return refreshQueue;
      }
    };
  };
});
