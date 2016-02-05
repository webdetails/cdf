/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  '../lib/jquery',
  '../lib/Base',
  'amd!../lib/underscore',
  '../Logger',
  '../dashboard/OptionsManager',
  '../dashboard/Dashboard.query'
], function($, Base, _, Logger, OptionsManager, DashboardQuery) {
 
  var BaseQuery = Base.extend(/** @lends cdf.queries.BaseQuery# */{
    name: "baseQuery",
    label: "Base Query",
    deepProperties: ['defaults' , 'interfaces'],
    dashboard: undefined,
    defaults: {
      successCallback: function() {
        Logger.log('Query success callback not defined. Override.');
      },
      errorCallback: function(jqXHR, textStatus, errorThrown) {
        if(this.dashboard && typeof this.dashboard.handleServerError === "function") {
          this.dashboard.handleServerError(jqXHR, textStatus, errorThrown);
          return;
        }
        Logger.log('Query error callback not defined. Override.');
      },
      lastResultSet: null,
      lastProcessedResultSet: null,
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
     * @constructs
     * @classdesc Defines the base query type used by default by any dashboard
     *             {@link cdf.dashboard.Dashboard~_BaseQuery.query|Dashboard.query}.
     *            Additional query types can be registered at any time using the
     *             {@link cdf.dashboard."Dashboard.query"#registerQuery|registerQuery} method:
     *            The second argument, the query definition, can be one of two things:
     *            An object, which will be used to extend the BaseQuery class, and the resulting class used to create new query instances.
     *            A class constructor function, which will be used directly to create new query instances without depending on BaseQuery.
     *            Additionally, the BaseQuery class can be set to something other than the default by using
     *             {@link cdf.dashboard."Dashboard.query".setBaseQuery|setBaseQuery} method:
     *            DashboardQuery.setBaseQuery(constructor)
     *            but this is a risky operation with considerable implications. Use at your own risk!
     * @param {object} config The query configuration object.
     */
    constructor: function(config) {
      this._optionsManager = new OptionsManager(this);
      this._optionsManager.mixin(this);
      this.init(config);
    },

    /**
     * Gets an option (fallback for when the OptionManager is not available).
     *
     * @param {string} prop The property from where to get the options from.
     * @return {*} Value for the option.
     */
    getOption: function(prop) {
      return this.defaults[prop];
    },

    /**
     * Sets an option (fallback for when the OptionManager is not available).
     *
     * @param {string} prop  The property for which the value will be set.
     * @param {*}      value Value for the property.
     */
    setOption: function(prop, value) {
      // Fallback for when OptionManager is not available
      this.defaults[prop] = value;
    },

    /**
     * Initialization function.
     *
     * @param {object} opts The query definition options.
     * @abstract
     */
    init: function(opts) {
      // Override
    },

    /**
     * Gets the success callback handler that executes the provided callback
     * when the query executes successfully.
     *
     * @param {function} callback Callback to call after the query is successful.
     * @return {function} Success callback handler.
     *
     */
    getSuccessHandler: function(callback) {
      var myself = this;
      return function(json) {
        myself.setOption('lastResultSet', json);
        
        var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
        myself.setOption('lastProcessedResultSet', clone);

        json = callback(clone);
        if(json !== undefined && json !== clone) {
          myself.setOption('lastProcessedResultSet', json);
        }
      };
    },

    /**
     * Gets the error callback handler that executes the provided callback
     * when the query fails to execute.
     *
     * @param {function} callback Callback to call if the query fails
     * @return {function} Error callback handler.
     */
    getErrorHandler: function(callback) {
      return function(resp, txtStatus, error) {
        if(callback) {
          callback(resp, txtStatus, error);
        }
      };
    },

    /**
     * Executes a server-side query.
     *
     * @param {function} successCallback Success callback.
     * @param {function} errorCallback   Error callback.
     */
    doQuery: function(successCallback, errorCallback) {
      if(typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }

      var settings = _.extend({}, this.getOption('ajaxOptions'), {
        data: this.buildQueryDefinition(),
        url: this.getOption('url'),
        success: this.getSuccessHandler(successCallback ? successCallback : this.getOption('successCallback')),
        error: this.getErrorHandler(errorCallback ? errorCallback : _.bind(this.getOption('errorCallback'), this))
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
     * @abstract
     */
    exportData: function() {
      // Override
    },

    /**
     * Sets the {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options for the query.
     *
     * @param {object} newOptions Ajax options to be added.
     */
     setAjaxOptions: function(newOptions) {
      this.setOption('ajaxOptions', _.extend({}, this.getOption('ajaxOptions'), newOptions));
    },

    /**
     * Sets the sorting options.
     *
     * @param {string} sortBy Sorting options.
     * @abstract
     */
    setSortBy: function(sortBy) {
      // Override
    },

    /**
     * Sorts the data, specifying a callback that'll be called after the sorting takes place.
     *
     * @param {string}   sortBy          Sorting options.
     * @param {function} outsideCallback Post-sort callback.
     * @abstract
     */
    sortBy: function(sortBy, outsideCallback) {
      // Override
    },

    /**
     * Fetches the data.
     *
     * @param {object}   params          Parameters for the query.
     * @param {function} successCallback Success callback.
     * @param {function} errorCallback   Error callback.
     * @return {*} The result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery} with the specified arguments.
     * @throws {InvalidInput} If the arguments are not correct.
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
     * Gets the last retrieved result.
     *
     * @return {object} A deep copy of the last result set obtained from the server.
     * @throws {NoCachedResults} If there haven't been previous calls to the server.
     */
    lastResults: function() {
      if(this.getOption('lastResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * Gets the last retrieved result after being processed by postFetch.
     *
     * @return {object} A deep copy of the the last result set obtained from the server
     *                  after being processed by postFetch.
     * @throws {NoCachedResults} If there haven't been previous calls to the server.
     */
    lastProcessedResults: function() {
      if(this.getOption('lastProcessedResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastProcessedResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * Reruns the success callback on the last retrieved result set from the server.
     *
     * @param {function} outerCallback Success callback.
     * @return {object} The result of calling the specified callback.
     * @throws {NoCachedResults} If there haven't been previous calls to the server.
     */
    reprocessLastResults: function(outerCallback) {
      if(this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        var callback = outerCallback || this.getOption('successCallback');

        myself.setOption('lastProcessedResultSet', clone);
        var result = callback(clone);
        if(result !== undefined && result !== clone) {
          myself.setOption('lastProcessedResultSet', result);
        }
        return result;
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * Alias for {@link cdf.queries.BaseQuery#reprocessLastResults|reprocessLastResults}.
     *
     * @param {function} outsideCallback Success callback.
     * @return {object} The result of calling the specified callback.
     * @throws {NoCachedResults} If there haven't been previous calls to the server.
     */
    reprocessResults: function(outsideCallback) {
      return this.reprocessLastResults(outsideCallback);
    },

    /**
     * Sets query parameters.
     *
     * @param {object} params The query parameters.
     */
    setParameters: function(params) {
      this.setOption('params', params);
    },

    /**
     * Sets the success callback for the query.
     *
     * @param {function} callback The success callback function.
     */
    setCallback: function(callback) {
      this.setOption('successCallback', callback);
    },

    /**
     * Sets the error callback for the query.
     *
     * @param {function} callback The error callback function.
     */
    setErrorCallback: function(callback) {
      this.setOption('errorCallback', callback);
    },

    /**
     * Sets the search pattern for the query.
     *
     * @param {string} pattern The search pattern.
     */
    setSearchPattern: function(pattern) {
      this.setOption('searchPattern', pattern);
    },

    /* Pagination
     *
     * We paginate by having an initial position (page) and page size (pageSize).
     * Paginating consists of incrementing/decrementing the initial position by
     * the page size. All paging operations change the paging cursor.
     */

    /**
     * Gets the next page of results, as controlled by the _pageSize_ option.
     *
     * @param {function} outsideCallback Success callback to execute when the
     *                                   next page of results is retrieved.
     * @return {*} The result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws {InvalidPageSize} If the page size option is not a positive number.
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
     * Gets the previous page of results, as controlled by the _pageSize_ option.
     *
     * @param {function} outsideCallback Success callback to execute when the
     *                                   previous page of results is retrieved.
     * @return {*} The result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws {AtBeginning} If current page is the first one.
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
     * Gets the set of results for the page at index _targetPage_ (0-indexed).
     *
     * @param {number}   targetPage      Index of the page to get, starting at index 0.
     * @param {function} outsideCallback Success callback to execute when the page is retrieved.
     * @return {boolean|*} _false_ if the page is already the current one,
     *                   otherwise returns the result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws {InvalidPage} If targetPage is not a positive number.
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
     * @param {number} targetPage Index of the page to get.
     * @return {boolean} _true_ if the page is correctly set,
     *                   _false_ if the target page is already the selected one.
     * @throws {InvalidPage} If the page number is not a positive number.
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
     * Runs the query, setting a starting page before doing so.
     * If the starting page matches the already selected one,
     * the query run is cancelled and _false_ is returned.
     *
     * @param {number}   page            Starting page index.
     * @param {function} outsideCallback Success callback to execute after the
     *                                   server side query is processed.
     * @return {boolean|*} _false_ if the query run is cancelled,
     *                   otherwise the result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
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
     * @param {number} pageSize Page size to set.
     */
    setPageSize: function(pageSize) {
      this.setOption('pageSize', pageSize);
    },

    /**
     * Sets the page size and gets the first page of results.
     *
     * @param {number}   pageSize        Page Size.
     * @param {function} outsideCallback Success callback to execute after query is retrieved.
     * @return {boolean|*} _false_ if pageSize is invalid,
     *                   otherwise the result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws InvalidPageSize If the page size is not a positive number.
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

  // Sets the query class that can be extended to create new ones.
  // The registered Base needs to have an extend method.
  DashboardQuery.setBaseQuery(BaseQuery);

  return BaseQuery;

});
