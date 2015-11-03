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
 * Module that holds query related objects.
 *
 * @module Query
 */
define([
  '../lib/jquery',
  '../lib/Base',
  'amd!../lib/underscore',
  '../Logger',
  '../dashboard/OptionsManager',
  '../dashboard/Dashboard.query'
], function($, Base, _, Logger, OptionsManager, DashboardQuery) {
 
  var BaseQuery = Base.extend({
    name: "baseQuery",
    label: "Base Query",
    deepProperties: ['defaults' , 'interfaces'],
    dashboard: undefined,
    defaults: {
      successCallback: function() {
        Logger.log('Query callback not defined. Override.');
      },
      errorCallback: function() {
        if(dashboard != undefined && dashboard.handleServerError != undefined) {
          dashboard.handleServerError();
        }
      },
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
      params: {
        reader: 'propertiesObject',
        validator: 'isObjectOrPropertiesArray'
      },
      successCallback: {
        validator: 'isFunction'
      },
      errorCallback: {
        validator: 'isFunction'
      },
      pageSize: {
        validator: 'isPositive'
      }
    },

    /**
     * Defines the base query type and sets it as the base query class in
     * {{#crossLink "DashboardQuery"}}DashboardQuery{{/crossLink}}.
     *
     * Additional query types can be registered at any time using the
     * {{#crossLink "Dashboard/registerQuery:method"}}registerQuery{{/crossLink}} method:
     * The second argument, the query definition, can be one of two things:
     *
     *     An object, which will be used to extend the BaseQuery class, and the resulting class used to create new query instances.
     *
     *     A class constructor function, which will be used directly to create new query instances without depending on BaseQuery.
     *
     * Additionally, the BaseQuery class can be set to something other than the default by using
     * {{#crossLink "DashboardQuery/setBaseQuery:method"}}setBaseQuery{{/crossLink}} method:
     *    DashboardQuery.setBaseQuery( constructor )
     * but this is a risky operation with considerable implications. Use at your own risk!
     *
     * @constructor
     * @class BaseQuery
     * @param config Query configuration object
     */
    constructor: function(config) {
      this._optionsManager = new OptionsManager(this);
      this._optionsManager.mixin(this);
      this.init(config);
    },

    /**
     * Gets an option (fallback for when the OptionManager is not available).
     *
     * @method getOption
     * @param prop The property from where to get the options from
     * @return {*} Value for the option
     */
    getOption: function(prop) {
      return this.defaults[prop];
    },

    /**
     * Sets an option (fallback for when the OptionManager is not available).
     *
     * @method setOption
     * @param prop The property for which the value will be set
     * @param value Value for the property
     */
    setOption: function(prop, value) {
      // Fallback for when OptionManager is not available
      this.defaults[prop] = value;
    },

    /**
     * Initialization function.
     *
     * @method init
     * @param opts
     *
     * @abstract
     */
    init: function(opts) {
      // Override
    },

    /**
     * Gets the success handler for the query, given a callback to call.
     *
     * @method getSuccessHandler
     * @param callback Callback to call after the query is successful
     * @return Success handler
     *
     */
    getSuccessHandler: function(callback) {
      var myself = this;
      return function(json) {
        myself.setOption('lastResultSet', json);
        var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
        callback(clone);
      };
    },

    /**
     * Gets the error handler for the query, given a callback to call.
     *
     * @method getErrorHandler
     * @param callback Callback to call if the query fails
     * @return Error handler
     */
    getErrorHandler: function(callback) {
      return function(resp, txtStatus, error) {
        if(callback) {
          callback(resp, txtStatus, error);
        }
      };
    },

    /**
     * Calls the server-side query.
     *
     * @method doQuery
     * @param successCallback Success callback
     * @param errorCallback Error callback
     */
    doQuery: function(successCallback, errorCallback) {
      if(typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }

      var settings = _.extend({}, this.getOption('ajaxOptions'), {
        data: this.buildQueryDefinition(),
        url: this.getOption('url'),
        success: this.getSuccessHandler(successCallback ? successCallback : this.getOption('successCallback')),
        error: this.getErrorHandler(errorCallback ? errorCallback : this.getOption('errorCallback'))
      });

      var async = settings.async == null ? $.ajaxSettings.async : settings.async;
      if(!async && settings.xhrFields && settings.xhrFields.withCredentials) {
        Logger.log("Cross-domain requests are deprecated for synchronous operations.");
        delete settings.xhrFields.withCredentials;
      }

      $.ajax(settings);
    },

    /**
     * Exports the data represented by the query.
     *
     * @method exportData
     * @abstract
     */
    exportData: function() {
      // Override
    },

    /**
     * Sets the ajax options for the query.
     *
     * @method setAjaxOptions
     * @param newOptions Options to set
     */
     setAjaxOptions: function(newOptions) {
      this.setOption('ajaxOptions', _.extend({}, this.getOption('ajaxOptions'), newOptions));
    },

    /**
     * Sets the sort by columns.
     *
     * @method setSortBy
     * @param sortBy Sort by columns
     *
     * @abstract
     */
    setSortBy: function(sortBy) {
      // Override
    },

    /**
     * Sorts the data, specifying a callback that'll be called after the sorting takes place.
     *
     * @method sortBy
     * @param sortBy Sort By columns
     * @param outsideCallback Post-sort callback
     *
     * @abstract
     */
    sortBy: function(sortBy, outsideCallback) {
      // Override
    },

    /**
     * Fetches the data.
     *
     * @method fetchData
     * @param params params for the query
     * @param successCallback Success callback
     * @param errorCallback Error callback
     * @return the result of calling doQuery with the specified arguments
     * @throws InvalidInput error if the arguments are not correct
     */
    fetchData: function(params, successCallback, errorCallback) {
      switch(arguments.length) {
        case 0:
          if(this.getOption('params') &&  this.getOption('successCallback')) {
            return this.doQuery();
          }
          break;
        case 1:
          if(typeof arguments[0] == "function") {
            // If we're receiving _only_ the callback, we're not going to change the internal callback
            return this.doQuery(arguments[0]);
          } else if(!_.isEmpty(arguments[0])
            && (_.isObject(arguments[0]) || _.isArray(arguments[0]))) {

            this.setOption('params', arguments[0] || {});
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
          // We're just going to discard anything over two params
          if(params) {
            this.setOption('params', params);
          }

          this.setOption('successCallback', successCallback);
          this.setOption('errorCallback', errorCallback);
          return this.doQuery();
      }
      // If we haven't hit a return by this time, the user gave us some wrong input
      throw "InvalidInput";
    },

    /**
     * Gets last retrieved results.
     *
     * @method lastResults
     * @return {*} the last result set obtained from the server
     * @throws  NoCachedResults error if there haven't been previous calls to the server
     */
    lastResults: function() {
      if(this.getOption('lastResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * Reruns the success callback on the last retrieved result set from the server.
     *
     * @method  reprocessLastResults
     * @param outerCallback Success callback
     * @return the result of calling the specified callback
     * @throws NoCachedResults error if there haven't been previous calls to the server
     */
    reprocessLastResults: function(outerCallback) {
      if(this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        var callback = outerCallback || this.getOption('successCallback');
        return callback(clone);
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * Alias for {{#crossLink "BaseQuery/reprocessLastResults:method"}}reprocessLastResults{{/crossLink}}.
     *
     * @method reprocessResults
     * @param outsideCallback Success callback
     * @return the result of calling the specified callback
     * @throws  NoCachedResults error if there haven't been previous calls to the server
     */
    reprocessResults: function(outsideCallback) {
      return this.reprocessLastResults(outsideCallback);
    },

    /**
     * Sets query parameters.
     *
     * @method setParameters
     * @param params Query parameters
     */
    setParameters: function(params) {
      this.setOption('params', params);
    },

    /**
     * Sets the success callback for the query.
     *
     * @method setCallback
     * @param callback Callback function
     */
    setCallback: function(callback) {
      this.setOption('successCallback', callback);
    },

    /**
     * Sets the error callback for the query.
     *
     * @method setErrorCallback
     * @param callback Error callback to set
     */
    setErrorCallback: function(callback) {
      this.setOption('errorCallback', callback);
    },

    /**
     * Sets the search pattern for the query.
     *
     * @method setSearchPattern
     * @param pattern Search Pattern
     */
    setSearchPattern: function(pattern) {
      this.setOption('searchPattern', pattern);
    },

    /* Pagination
     *
     * We paginate by having an initial position ( page ) and page size ( pageSize )
     * Paginating consists of incrementing/decrementing the initial position by
     * the page size. All paging operations change the paging cursor.
     */

    /**
     * Gets the next page of results, as controlled by the @_pageSize option.
     *
     * @method nextPage
     * @param outsideCallback Callback to execute when the page of results is retrieved
     * @return the result of calling doQuery
     * @throws InvalidPageSize if the page size option is not a positive number
     */
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

    /**
     * Gets the previous page of results, as controlled by the _pageSize option.
     *
     * @method previousPage
     * @param outsideCallback Callback to execute when the page of results is retrieved
     * @return the result of calling doQuery
     * @throws AtBeginning error if current page is the first one
     */
    previousPage: function(outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(page > pageSize) {
        page -= pageSize;
        this.setOption('page', page);
        return this.doQuery(outsideCallback);
      } else if(_pageSize > 0) {
        this.setOption('page', 0);
        return this.doQuery(outsideCallback);
      } else {
        throw "AtBeginning";
      }
    },

    /**
     * Gets the page-th set of results (0-indexed).
     *
     * @method getPage
     * @param targetPage Page to get
     * @param outsideCallback Callback to execute when the page is retrieved
     * @return the result of calling doQuery
     * @throws InvalidPage if targetPage is not a positive number
     */
    getPage: function(targetPage, outsideCallback) {
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

    /**
     * Sets the starting page for later executions of the query.
     *
     * @method setPageStartingAt
     * @param targetPage index for the target page
     * @return {boolean} _true_ if the page is correctly set, _false_ if the target page is already the selected one
     * @throws InvalidPage if the page number is not a positive number
     */
    setPageStartingAt: function(targetPage) {
      if(targetPage == this.getOption('page')) {
        return false;
      } else if(typeof targetPage == 'number' && targetPage >= 0) {
        this.setOption('page', targetPage);
      } else {
        throw "InvalidPage";
      }
    },

    /**
     * Runs the query, setting a starting page before doing so. If the starting page matches the already selected
     * one, the query run is cancelled and _false_ is returned.
     *
     * @method pageStartingAt
     * @param page Starting page index
     * @param outsideCallback Callback to execute after server side query is processed
     * @return {*} _false_ if the query run is cancelled, null otherwise
     */
    pageStartingAt: function(page, outsideCallback) {
      if(this.setPageStartingAt(page) !== false) {
        return this.doQuery(outsideCallback);
      } else {
        return false;
      }
    },

    /**
     * Sets the page size.
     *
     * @method setPageSize
     * @param pageSize Page size to set
     */
    setPageSize: function(pageSize) {
      this.setOption('pageSize', pageSize);
    },

    /**
     * Sets the page size and gets the first page of results.
     *
     * @method initPage
     * @param pageSize Page Size
     * @param outsideCallback Callback to run after query is ran
     * @return the result of calling doQuery
     * @throws InvalidPageSize if the page size is not a positive number
     */
    initPage: function(pageSize, outsideCallback) {
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
