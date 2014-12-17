/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
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

/*
 * BaseQuery.js
 *
 * Registers several query types and sets the base query class.
 *
 * Additional query types can be registered at any time using the Dashboards method:
 *    Dashboards.registerQuery( name, query )
 * The second argument, the query definition, can be one of two things:
 *    1. An object, which will be used to extend the BaseQuery class, and the resulting class used
 *       to create new query instances.
 *    2. A class constructor function, which will be used directly to create new query instances
 *       without depending on BaseQuery.
 *
 * Additionally, the BaseQuery class can be set to something other than the default by using:
 *    Dashboards.setBaseQuery( constructor )
 * but this is a risky operation whith considerable implications. Use at your own risk!
 *
 */
 
 define(['../lib/jquery', '../lib/Base', '../lib/underscore', '../Logger', '../dashboard/OptionsManager', '../dashboard/Dashboard.query'],
  function($, Base, _, Logger, OptionsManager, DashboardQuery) {
 
   var BaseQuery = Base.extend({
    name: "baseQuery",
    label: "Base Query",
    deepProperties: ['defaults' , 'interfaces'],
    defaults: {
      successCallback: function() {
        Logger.log('Query callback not defined. Override.');
      },
//          errorCallback: Dashboards.handleServerError,
      lastResultSet: null,
      page: 0,
      pageSize: 0,
      params: {},
      ajaxOptions: {
        async: false,
        type: 'POST'
      },
      url: ''
    },

    interfaces: {
      params: {reader: 'propertiesObject', validator: 'isObjectOrPropertiesArray'},
      successCallback: {validator: 'isFunction'},
      errorCallback: {validator: 'isFunction'},
      pageSize: {validator: 'isPositive'}

    },

    constructor: function(config) {          
      this._optionsManager = new OptionsManager(this);
      this._optionsManager.mixin(this);          
      this.init(config);
    },

    // Default options interface in case there is no options manager defined.
    getOption: function(prop) {
      // Fallback for when Dashboards.OptionManager is not available
      return this.defaults[prop];
    },

    setOption: function(prop, value) {
      // Fallback for when Dashboards.OptionManager is not available
      this.defaults[prop] = value;
    },

    init: function(opts) {
      // Override
    },

    getSuccessHandler: function(callback) {
      var myself = this;
      return function(json) {
        myself.setOption('lastResultSet', json);
        var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
        callback(clone);
      }
    },

    getErrorHandler: function(callback) {
      return function(resp, txtStatus, error) {
        if(callback) {
          callback(resp, txtStatus, error);
        }
      }
    },

    doQuery: function(outsideCallback, errorCallback) {
      if(typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }
      var url = this.getOption('url');
      var callback = (outsideCallback ? outsideCallback : this.getOption('successCallback'));
      var queryDefinition = this.buildQueryDefinition();

      var settings = _.extend({}, this.getOption('ajaxOptions'), {
        data: queryDefinition,
        url: url,
        success: this.getSuccessHandler(callback),
        error: this.getErrorHandler(errorCallback)
      });

      var async = settings.async == null ?  $.ajaxSettings.async : settings.async;
      if ( !async && settings.xhrFields && settings.xhrFields.withCredentials) {
        Logger.log("Cross-domain requests are deprecated for synchronous operations.");
        delete settings.xhrFields.withCredentials;
      }

      $.ajax(settings);
    },

    exportData: function() {
      // Override
    },

    setAjaxOptions: function(newOptions) {
      this.setOption('ajaxOptions', _.extend({}, this.getOption('ajaxOptions'), newOptions));
    },

    setSortBy: function(sortBy) {
      // Override
    },

    sortBy: function(sortBy,outsideCallback) {
      // Override
    },

    fetchData: function(params, successCallback, errorCallback) {
      switch(arguments.length) {
        case 0:
          if(this.getOption('params') &&  this.getOption('successCallback')) {
            return this.doQuery();
          }
        break;
        case 1:
          if(typeof arguments[0] == "function") {
            /* If we're receiving _only_ the callback, we're not
            * going to change the internal callback
            */
            return this.doQuery(arguments[0]);
          } else if(!_.isEmpty(arguments[0])
            && (_.isObject(arguments[0]) || _.isArray(arguments[0]))) {

            this.setOption('params' , arguments[0] || {});
            return this.doQuery();
          }
          break;
        case 2:
          if(typeof arguments[0] == "function") {
            this.setOption('successCallback', arguments[0]);
            this.setOption('errorCallback', arguments[1]);
            return this.doQuery();
          } else {
            this.setOption('params', arguments[0] || {});
            this.setOption('successCallback', arguments[1]);
            return this.doQuery();
          }
          break;
        default:
          /* We're just going to discard anything over two params */
          if(params) {
            this.setOption('params', params);
          }

          this.setOption('successCallback', successCallback);
          this.setOption('errorCallback', errorCallback);
          return this.doQuery();
      }
      /* If we haven't hit a return by this time,
       * the user gave us some wrong input
       */
      throw "InvalidInput";
    },

    // Result caching
    lastResults: function() {
      if(this.getOption('lastResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

    reprocessLastResults: function(outerCallback) {
      if(this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        var callback = outerCallback || this.getOption('successCallback');
        return callback(clone);
      } else {
        throw "NoCachedResults";
      }
    },

    reprocessResults: function(outsideCallback) {
      if(this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        var callback = (outsideCallback ? outsideCallback : this.getOption('successCallback'));
        callback(clone);
      } else {
        throw "NoCachedResults";
      }
    },

    setParameters: function(params) {
      this.setOption('params', params);
    },

    setCallback: function(callback) {
      this.setOption('successCallback', callback);
    },

    setErrorCallback: function(callback) {
      this.setOption('errorCallback', callback);
    },

    setSearchPattern: function (pattern) {
      this.setOption('searchPattern', pattern);
    },

    /* Pagination
     *
     * We paginate by having an initial position ( page ) and page size ( pageSize )
     * Paginating consists of incrementing/decrementing the initial position by
     * the page size. All paging operations change the paging cursor.
     */

    // Gets the next _pageSize results
    nextPage: function(outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(pageSize > 0) {
        page += pageSize;
        this.setOption('page', page);
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPageSize";
      }
    },

    // Gets the previous _pageSize results
    previousPage: function(outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(page > pageSize) {
        page -= pageSize;
        this.setOption('page', page );
        return this.doQuery(outsideCallback);
      } else if(_pageSize > 0) {
        this.setOption('page', 0);
        return this.doQuery(outsideCallback);
      } else {
        throw "AtBeggining";
      }
    },

    // Gets the page-th set of _pageSize results (0-indexed)
    getPage: function( targetPage, outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(targetPage * pageSize == page) {
        return false;
      } else if(typeof targetPage == 'number' && targetPage >= 0) {
        this.setOption('page', targetPage * pageSize);
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPage";
      }
    },

    // Gets pageSize results starting at page
    setPageStartingAt: function(targetPage) {
      if(targetPage == this.getOption('page')) {
        return false;
      } else if(typeof targetPage == 'number' && targetPage >= 0) {
        this.setOption('page', targetPage);
      } else {
        throw "InvalidPage";
      }
    },

    pageStartingAt: function(page,outsideCallback) {
      if(this.setPageStartingAt(page) !== false) {
        return this.doQuery(outsideCallback);
      } else {
        return false;
      }
    },

    // Sets the page size
    setPageSize: function(pageSize) {
      this.setOption('pageSize', pageSize);
    },

    // sets _pageSize to pageSize, and gets the first page of results
    initPage: function(pageSize,outsideCallback) {
      if(pageSize == this.getOption('pageSize') && this.getOption('page') == 0) {
        return false;
      } else if(typeof pageSize == 'number' && pageSize > 0) {
        this.setOption('page', 0);
        this.setOption('pageSize', pageSize);
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPageSize";
      }
    }
  });

  // Sets the query class that can extended to create new ones.
  // The registered Base needs to have an extend method.
  DashboardQuery.setBaseQuery(BaseQuery);
  
  return BaseQuery;
 
 });
