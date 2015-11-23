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
