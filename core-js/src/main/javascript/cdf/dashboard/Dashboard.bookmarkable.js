/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  './Utils',
  '../lib/jquery'
], function(Dashboard, Logger, Utils, $) {

  /**
   * @class cdf.dashboard."Dashboard.bookmarkable"
   * @amd cdf/dashboard/Dashboard.bookmarkable
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for bookmarkable parameters.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for bookmarkable parameters.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @summary Method used by the Dashboard constructor for bookmarkable parameters initialization.
     * @description Method used by the Dashboard constructor for bookmarkable parameters initialization.
     *
     * @private
     */
    _initBookmarkables: function() {
      this.bookmarkables = {};
    },

    /**
     * @summary Gets an object representation of `window.location.hash`.
     * @description <p>If a `key` parameter is provided, the value for the URL parameter
     *              with name equal to the value of `key` is returned.</p>
     *
     * @private
     * @param {string} key The key corresponding to the value being obtained.
     * @return {Object} The key value or an empty object.
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
     * @summary Sets the hash value of `window.location`.
     * @description <p>If `value` is provided, the parameter with name equal to the value of `key`
     *              has its value set to `value` before the `window.location.hash` is set.</p>
     *              <p>If the object representation of `window.location.hash` is an empty object,
     *              the value of `window.location.hash` is set to an empty string.</p>
     *
     * @private
     * @param {object|string} key     The object representation of `window.location.hash` or a parameter name.
     * @param {Object}             [value] The value for the parameter named `key`.
     */
    setHashValue: function(key, value) {
      var obj;
      if(arguments.length == 1) {
        obj = key;
      } else {
        obj = this.getHashValue();
        obj[key] = value;
      }
      var json = JSON.stringify(obj);
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
     * @summary Deletes a value from `window.location.hash`.
     * @description <p>If no `key` is provided it clears `window.location.hash`, otherwise
     *              it sets the new hash value with the parameter named `key` removed.</p>
     *
     * @private
     * @param {string} [key] The value of the key.
     */
    deleteHashValue: function(key) {
      if(arguments.length === 0) {
        window.location.hash = "";
      } else {
        var obj = this.getHashValue();
        delete obj[key];
        this.setHashValue(obj);
      }
    },

    /**
     * @summary Sets a pair parameter/value as bookmarkable.
     * @description <p>It sets `parameter` as bookmarkable, with value equal to `true` or `value` if
     *              provided.</p>
     *
     * @param {string} parameter The name of the parameter to be stored.
     * @param {Object}      [value]     The value for the parameter.
     */
    setBookmarkable: function(parameter, value) {
      if(arguments.length === 1) {
        this.bookmarkables[parameter] = true;
      } else {
        this.bookmarkables[parameter] = value;
      }
    },

    /**
     * @summary Checks if a `parameter` is bookmarkable.
     * @description Checks if a `parameter` is bookmarkable.
     *
     * @param {string} parameter The parameter name.
     * @return {boolean} `true` if `parameter` is bookmarkable, `false` otherwise.
     */
    isBookmarkable: function(parameter) {
      return Boolean(this.bookmarkables[parameter]);
    },

    /**
     * @summary Generates a bookmark state using stored values.
     * @description Generates a bookmark state using stored values.
     *
     * @return {Object} An object with the state of the parameters previously marked as bookmarkable.
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
     * @summary Persists a bookmark state.
     * @description <p>If `param` is a bookmarkable parameter, this method uses
     *              {@link cdf.dashboard.Dashboard#generateBookmarkState|generateBookmarkState}
     *              to generate a bookmark state with the values stored and
     *              {@link cdf.dashboard.Dashboard#setBookmarkState|setBookmarkState} to persist them.</p>
     *
     * @param {string} param The name of the parameter.
     */
    persistBookmarkables: function(param) {
      /*
       * We don't want to update the hash if we were passed a
       * non-bookmarkable parameter (why bother?), nor is there
       * much of a point in publishing changes when we're still
       * initializing the dashboard. That's just the code for
       * restoreBookmarkables doing the reverse of this!
       */
      if(!this.bookmarkables[param]) {
        return;
      }
      if(!this.finishedInit) {
        return;
      }
      this.setBookmarkState({impl: 'client', params: this.generateBookmarkState()});
    },

    /**
     * @summary Overrides a bookmark state with a given `state`.
     * @description Overrides a bookmark state with a given `state`.
     *
     * @param {Object} state The new state to override the existing state.
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
     * @summary Gets the bookmark state URL decoded.
     * @description Gets the bookmark state URL decoded.
     *
     * @return {Object} An object with the current bookmark state.
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
           * so we'll go on and try getting the state from the params.
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
     * @summary Restores the bookmark state.
     * @description <p>This method uses {@link cdf.dashboard.Dashboard#getBookmarkState|getBookmarkState} to read the bookmark state
     *              and then {@link cdf.dashboard.Dashboard#setParameter|setParameter} to set each parameter/value read in the dashboard.</p>
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
