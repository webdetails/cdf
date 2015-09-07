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

define(['./Dashboard', '../Logger', './Utils'],
  function(Dashboard, Logger, Utils) {

  /**
   * A module representing an extension to the Dashboard module for bookmarkable parameters.
   *
   * @module Dashboard.bookmarkable
   */
  Dashboard.implement({
  
    /**
     * Method used by the Dashboard constructor for bookmarkable parameters initialization.
     *
     * @method _initBookmarkables
     * @private
     */
    _initBookmarkables: function() {
      this.bookmarkables = {};
    },

    /**
     *
     * @method getHashValue
     * @for Dashboard
     * @param key
     * @return {*}
     * @private
     */
    getHashValue: function(key) {
      var hash = window.location.hash;
      var obj;
      try {
        obj = JSON.parse(hash.slice(1));
      } catch(e) {
        obj = {};
      }
      if(arguments.length === 0) {
        return obj;
      } else {
        return obj[key];
      }
    },

    /**
     *
     * @method setHashValue
     * @for Dashboard
     * @param key
     * @param value
     * @private
     */
    setHashValue: function(key, value) {
      var obj = this.getHashValue(),json;
      if(arguments.length == 1) {
        obj = key;
      } else {
        obj[key] = value;
      }
      json = JSON.stringify(obj);
      /* We don't want to store empty objects */
      if(json != "{}") {
        window.location.hash = json;
      } else {
        if(window.location.hash) {
          window.location.hash = '';
        }
      }
    },

    /**
     *
     * @method deleteHashValue
     * @for Dashboard
     * @param key
     * @private
     */
    deleteHashValue: function(key) {
      var obj = this.getHashValue();
      if(arguments.length === 0) {
        window.location.hash = "";
      } else {
        delete obj[key];
        this.setHashValue(obj);
      }
    },

    /**
     * Sets a pair parameter/value as bookmarkable.
     *
     * @method setBookmarkable
     * @for Dashboard
     * @param parameter the name of the parameter to be stored
     * @param value of the parameter
     */
    setBookmarkable: function(parameter, value) {
      if(arguments.length === 1) { value = true; }
      this.bookmarkables[parameter] = value;
    },

    /**
     * Checks if a parameter is bookmarkable.
     *
     * @method isBookmarkable
     * @for Dashboard
     * @param parameter
     * @return {boolean} describing if a parameter is bookmarkable
     */
    isBookmarkable: function(parameter) {
      return Boolean(this.bookmarkables[parameter]);
    },

    /**
     * Generates a bookmark state using values stored.
     *
     * @method generateBookmarkState
     * @for Dashboard
     * @return an object with the state of the parameters previously marked as bookmarkable
     */
    generateBookmarkState: function() {
      var params = {},
          bookmarkables = this.bookmarkables;
      for(var k in bookmarkables) if(bookmarkables.hasOwnProperty(k)) {
        if(bookmarkables[k]) {
          params[k] = this.getParameterValue(k);
        }
      }
      return params;
    },

    /**
     * Persists a bookmark state.
     *
     *
     * @method persistBookmarkables
     * @for Dashboard
     * @param param
     */
    persistBookmarkables: function(param) {
      var bookmarkables = this.bookmarkables,
          params = {};
      /*
       * We don't want to update the hash if we were passed a
       * non-bookmarkable parameter (why bother?), nor is there
       * much of a point in publishing changes when we're still
       * initializing the dashboard. That's just the code for
       * restoreBookmarkables doing the reverse of this!
       */
      if(!bookmarkables[param]) {
        return;
      }
      if(!this.finishedInit) {
        return;
      }
      params = this.generateBookmarkState();
      this.setBookmarkState({impl: 'client', params: params});
    },

    /**
     * Overrides a bookmark state with a given state.
     *
     * @method setBookmarkState
     * @for Dashboard
     * @param state to override the existing state
     */
    setBookmarkState: function(state) {
      if(window.history && window.history.replaceState) {
        var method = window.location.pathname.split('/').pop(),
            query = window.location.search.slice(1).split('&').map(function(e) {
              var entry = e.split('=');
              entry[1] = decodeURIComponent(entry[1]);
              return entry;
            }),
            url;
        query = Utils.propertiesArrayToObject(query);
        query.bookmarkState = JSON.stringify(state);
        url = method + '?' + $.param(query);
        window.history.replaceState({}, '', url);
        this.deleteHashValue('bookmark');
      } else {
        this.setHashValue('bookmark', state);
      }
    },

    /**
     * Gets the bookmark state url decoded.
     *
     * @method getBookmarkState
     * @for Dashboard
     * @return an object with the current bookmark state
     */
    getBookmarkState: function() {
      /*
       * browsers that don't support history.pushState
       * can't actually safely remove bookmarkState param,
       * so we must first check whether there is a hash-based
       * bookmark state.
       */
      if(window.location.hash.length > 1) {
        try {
          return this.getHashValue('bookmark') || {};
        } catch(e) {
          /*
           * We'll land here if the hash isn't a valid json object,
           * so we'll go on and try getting the state from the params
           */
        }
      }
      var query = window.location.search.slice(1).split('&').map(function(e) {
            var pair = e.split('=');
            pair[1] = decodeURIComponent(pair[1]);
            return pair;
          }),
          params = Utils.propertiesArrayToObject(query);
      if(params.bookmarkState) {
        return JSON.parse(decodeURIComponent(params.bookmarkState.replace(/\+/g, ' '))) || {};
      } else {
        return {};
      }
    },

    /**
     * Restores the bookmark state.
     *
     * @method restoreBookmarkables
     * @for Dashboard
     */
    restoreBookmarkables: function() {
      var state;
      try {
        state = this.getBookmarkState().params;
        for(var k in state) if(state.hasOwnProperty(k)) {
          this.setParameter(k, state[k]);
        }
      } catch(e) {
        Logger.log(e, 'error');
      }
    }

  });

});
