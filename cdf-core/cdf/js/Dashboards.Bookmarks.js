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

/**
 * Bookmarks-related definitions
 **/ 

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
};
