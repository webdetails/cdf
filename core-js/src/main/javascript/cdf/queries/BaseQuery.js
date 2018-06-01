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
  '../lib/jquery',
  '../lib/Base',
  'amd!../lib/underscore',
  '../Logger',
  '../dashboard/Utils',
  '../dashboard/OptionsManager',
  '../dashboard/Dashboard.query'
], function($, Base, _, Logger, Utils, OptionsManager, DashboardQuery) {
 
  var BaseQuery = Base.extend(/** @lends cdf.queries.BaseQuery# */{
    /**
     * @summary The class name.
     * @description The class name.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "baseQuery"
     */
    _name: "baseQuery",
    get name() {
      return this._name;
    },

    /**
     * @summary The class label.
     * @description The class label.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "Base Query"
     */
    _label: "Base Query",
    get label() {
      return this._label;
    },

    /**
     * @summary A list of properties to be extended to the registered queries.
     * @description A list of properties to be extended to the registered queries that do not
     *              provide their own constructor function.
     *
     * @see {@link cdf.dashboard.Dashboard#registerQuery|registerQuery}
     * @type {Array<string>}
     * @const
     * @readonly
     * @protected
     * @default
     */
    deepProperties: ['defaults', 'interfaces'],

    /**
     * @summary A reference to the dashboard instance.
     * @description A reference to the dashboard instance.
     *
     * @type {cdf.dashboard.Dashboard}
     * @protected
     */
    dashboard: undefined,

    /**
     * @summary The default properties.
     * @description The default properties.
     *
     * @type {Object}
     * @property {function} successCallback Default success callback.
     * @property {function} errorCallback Default error callback.
     * @property {Object} lastResultSet=null The last resultset returned by the query.
     * @property {Object} lastProcessedResultSet=null The last resultset returned by the query and processed.
     * @property {number} page=0 The page number.
     * @property {number} pageSize=0 The page size.
     * @property {Object} params={} The query parameters.
     * @property {Object} ajaxOptions={async:false,type:"POST"} The {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options for the query.
     * @property {string} url="" The target URL.
     * @protected
     */
    defaults: {
      successCallback: function() {
        Logger.log('Query success callback not defined. Override.');
      },
      errorCallback: function(jqXHR, textStatus, errorThrown) {
        if(this.dashboard && Utils.isFunction(this.dashboard.handleServerError)) {
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
        type: "POST"
      },

      url: ""
    },

    /**
     * @summary The default interfaces.
     * @description The default interfaces.
     *
     * @type {Object}
     * @property {Object} params Parameter interfaces.
     * @property {string} params.reader="propertiesObject" Parameter reader.
     * @property {string} params.validator="isObjectOrPropertiesArray" Parameter validator.
     * @property {Object} successCallback Success callback interfaces.
     * @property {string} successCallback.validator="isFunction" Success callback validator.
     * @property {Object} errorCallback Error callback interfaces.
     * @property {string} errorCallback.validator="isFunction" Error callback validator.
     * @property {Object} pageSize Page size interfaces.
     * @property {string} pageSize.validator="isPositive" Page size validator.
     * @readonly
     * @protected
     */
    interfaces: {
      params: {
        reader: "propertiesObject",
        validator: "isObjectOrPropertiesArray"
      },
      successCallback: {
        validator: "isFunction"
      },
      errorCallback: {
        validator: "isFunction"
      },
      pageSize: {
        validator: "isPositive"
      }
    },

    /**
     * @constructs
     * @description Please use the dashboard function
     *              {@link cdf.dashboard.Dashboard#getQuery|getQuery}
     *              to create new queries.
     * @summary Defines the base query type used by default by any dashboard.
     * @classdesc <p>Defines the base query type used by default by any dashboard.</p>
     *            <p>While loading this class's module, the static function
     *            {@link cdf.dashboard.Dashboard.setBaseQuery|setBaseQuery}
     *            is executed in order to make this class the default base query class for any dashboard.</p>
     *            <p>Additional query types might extend from this class, if no
     *            valid constructor is provided during the new query type registration.</p>
     * @param {Object} config The query configuration `object`.
     * @staticClass
     * @abstract
     */
    constructor: function(config) {
      this._optionsManager = new OptionsManager(this);
      this._optionsManager.mixin(this);
      this.init(config);
    },

    /**
     * @summary Gets an option (fallback for when the OptionManager is not available).
     * @description Gets an option (fallback for when the OptionManager is not available).
     *
     * @param {string} prop The property from where to get the options.
     * @return {Object} Value for the option.
     */
    getOption: function(prop) {
      return this.defaults[prop];
    },

    /**
     * @summary Sets an option (fallback for when the OptionManager is not available).
     * @description Sets an option (fallback for when the OptionManager is not available).
     *
     * @param {string} prop  The property for which the value will be set.
     * @param {Object} value Value for the property.
     */
    setOption: function(prop, value) {
      // Fallback for when OptionManager is not available
      this.defaults[prop] = value;
    },

    /**
     * @summary Initialization function.
     * @description Initialization function.
     *
     * @param {Object} opts The query definition options.
     * @abstract
     */
    init: function(opts) {
      // Override
    },

    /**
     * @summary Builds the query definition `object`.
     * @description Builds the query definition `object`.
     *
     * @param {object} [overrides] Options that override the existing ones.
     * @abstract
     */
    buildQueryDefinition: function(overrides) {
      // Override
    },

    /**
     * @summary Gets the success callback handler.
     * @description Gets the success callback handler that executes the provided callback
     *              when the query executes successfully.
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
     * @summary Gets the error callback handler.
     * @description Gets the error callback handler that executes the provided callback
     *              when the query fails to execute.
     *
     * @param {function} callback Callback to call if the query fails.
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
     * @summary Executes a server-side query.
     * @description Executes a server-side query.
     *
     * @param {function} [successCallback] Success callback.
     * @param {function} [errorCallback]   Error callback.
     */
    doQuery: function(successCallback, errorCallback) {
      if(!Utils.isFunction(this.getOption('successCallback'))) {
        throw 'QueryNotInitialized';
      }

      var settings = _.extend({}, this.getAjaxOptions(), {
        data: this.buildQueryDefinition(),
        url: this.getOption('url'),
        success: this.getSuccessHandler(successCallback ? successCallback : this.getOption('successCallback')),
        error: this.getErrorHandler(errorCallback ? errorCallback : _.bind(this.getOption('errorCallback'), this))
      });

      $.ajax(settings);
    },

    /**
     * @summary Exports the data represented by the query.
     * @description Exports the data represented by the query.
     *
     * @abstract
     */
    exportData: function() {
      // Override
    },

    /**
     * @summary Sets the {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options for the query.
     * @description Sets the {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options for the query.
     *
     * @param {Object} newOptions Ajax options to be added.
     */
    setAjaxOptions: function(newOptions) {
      this.setOption('ajaxOptions', _.extend({}, this.getOption('ajaxOptions'), newOptions));
    },

    getAjaxOptions: function() {
      var options = this.getOption('ajaxOptions');

      var async = options.async == null ? $.ajaxSettings.async : options.async;
      if(!async && options.xhrFields && options.xhrFields.withCredentials) {
        Logger.log("Cross-domain requests are deprecated for synchronous operations.");
        delete options.xhrFields.withCredentials;
      }

      return options;
    },

    /**
     * @summary Sets the sorting options.
     * @description Sets the sorting options.
     *
     * @param {string} sortBy Sorting options.
     * @abstract
     */
    setSortBy: function(sortBy) {
      // Override
    },

    /**
     * @summary Sorts the data and executes a callback.
     * @description Sorts the data, specifying a callback that will be called after the sorting takes place.
     *
     * @param {string}   sortBy          Sorting options.
     * @param {function} outsideCallback Post-sort callback.
     * @abstract
     */
    sortBy: function(sortBy, outsideCallback) {
      // Override
    },

    /**
     * @summary Fetches the data.
     * @description Fetches the data.
     *
     * @param {Object}   params          Parameters for the query.
     * @param {function} successCallback Success callback.
     * @param {function} errorCallback   Error callback.
     *
     * @return {Object} The result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery} with the specified arguments.
     *
     * @throws {InvalidInput} If the arguments are not correct.
     */
    fetchData: function(params, successCallback, errorCallback) {
      var firstArgument = arguments[0];
      var secondArgument = arguments[1];
      var thirdArgument = arguments[2];

      switch(arguments.length) {
        case 0:
          if(this.getOption('params') &&  this.getOption('successCallback')) {
            return this.doQuery();
          }
          break;

        case 1:
          if(Utils.isFunction(firstArgument)) {
            // If we're receiving _only_ the callback, we're not going to change the internal callback
            return this.doQuery(firstArgument);

          } else if(!_.isEmpty(firstArgument) && (_.isObject(firstArgument) || Array.isArray(firstArgument))) {
            this.setParameters(firstArgument || {});

            return this.doQuery();
          }
          break;

        case 2:
          if(Utils.isFunction(firstArgument)) {
            this.setCallback(firstArgument);

            if(Utils.isFunction(secondArgument)) {
              this.setErrorCallback(secondArgument);
            }
          } else {
            this.setParameters(firstArgument || {});
            this.setCallback(secondArgument);
          }

          return this.doQuery();

        default:
          // We're just going to discard anything over three params
          if(params) {
            this.setParameters(params);
          }

          if(Utils.isFunction(secondArgument)) {
            this.setCallback(successCallback);
          }

          if(Utils.isFunction(thirdArgument)) {
            this.setErrorCallback(errorCallback);
          }

          return this.doQuery();
      }

      // If we haven't hit a return by this time, the user gave us some wrong input
      throw "InvalidInput";
    },

    /**
     * @summary Gets the last retrieved result.
     * @description Gets the last retrieved result.
     *
     * @return {Object} A deep copy of the last result set obtained from the server.
     * @throws {NoCachedResults} If there have not been previous calls to the server.
     */
    lastResults: function() {
      if(this.getOption('lastResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * @summary Gets the last retrieved result after being processed by postFetch.
     * @description Gets the last retrieved result after being processed by postFetch.
     *
     * @return {Object} A deep copy of the the last result set obtained from the server
     *                  after being processed by postFetch.
     * @throws {NoCachedResults} If there have not been previous calls to the server.
     */
    lastProcessedResults: function() {
      if(this.getOption('lastProcessedResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastProcessedResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * @summary Reruns the success callback on the last retrieved result set from the server.
     * @description Reruns the success callback on the last retrieved result set from the server.
     *
     * @param {function} outerCallback Success callback.
     * @return {Object} The result of calling the specified callback.
     * @throws {NoCachedResults} If there have not been previous calls to the server.
     * @see {@link cdf.queries.BaseQuery#reprocessResults|reprocessResults}
     */
    reprocessLastResults: function(outerCallback) {
      if(this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        var callback = outerCallback || this.getOption('successCallback');

        this.setOption('lastProcessedResultSet', clone);
        var result = callback(clone);
        if(result !== undefined && result !== clone) {
          this.setOption('lastProcessedResultSet', result);
        }
        return result;
      } else {
        throw "NoCachedResults";
      }
    },

    /**
     * @summary Alias for {@link cdf.queries.BaseQuery#reprocessLastResults|reprocessLastResults}.
     * @description Alias for {@link cdf.queries.BaseQuery#reprocessLastResults|reprocessLastResults}.
     *
     * @param {function} outsideCallback Success callback.
     * @return {Object} The result of calling the specified callback.
     * @throws {NoCachedResults} If there have not been previous calls to the server.
     * @see {@link cdf.queries.BaseQuery#reprocessLastResults|reprocessLastResults}
     */
    reprocessResults: function(outsideCallback) {
      return this.reprocessLastResults(outsideCallback);
    },

    /**
     * @summary Sets query parameters.
     * @description Sets query parameters.
     *
     * @param {Object} params The query parameters.
     */
    setParameters: function(params) {
      this.setOption('params', params);
    },

    /**
     * @summary Sets the success callback for the query.
     * @description Sets the success callback for the query.
     *
     * @param {function} callback The success callback function.
     */
    setCallback: function(callback) {
      this.setOption('successCallback', callback);
    },

    /**
     * @summary Sets the error callback for the query.
     * @description Sets the error callback for the query.
     *
     * @param {function} callback The error callback function.
     */
    setErrorCallback: function(callback) {
      this.setOption('errorCallback', callback);
    },

    /**
     * @summary Sets the search pattern for the query.
     * @description Sets the search pattern for the query.
     *
     * @param {string} pattern The search pattern.
     */
    setSearchPattern: function(pattern) {
      this.setOption('searchPattern', pattern);
    },

    // region Pagination
    /*
     * We paginate by having an initial position (page) and page size (pageSize).
     * Paginating consists of incrementing/decrementing the initial position by
     * the page size. All paging operations change the paging cursor.
     */

    /**
     * @summary Gets the next page of results, as controlled by the `pageSize` option.
     * @description Gets the next page of results, as controlled by the `pageSize` option.
     *
     * @param {function} outsideCallback Success callback to execute when the
     *                                   next page of results is retrieved.
     * @return {Object} The result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
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
     * @summary Gets the previous page of results, as controlled by the `pageSize` option.
     * @description Gets the previous page of results, as controlled by the `pageSize` option.
     *
     * @param {function} outsideCallback Success callback to execute when the
     *                                   previous page of results is retrieved.
     * @return {Object} The result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws {AtBeginning} If current page is the first one.
     */
    previousPage: function(outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(page > pageSize) {
        page -= pageSize;
        this.setOption('page', page);
        return this.doQuery(outsideCallback);
      } else if(pageSize > 0) {
        this.setOption('page', 0);
        return this.doQuery(outsideCallback);
      } else {
        throw "AtBeginning";
      }
    },

    /**
     * @summary Gets the set of results for the page at index `targetPage` (0-indexed).
     * @description Gets the set of results for the page at index `targetPage` (0-indexed).
     *
     * @param {number}   targetPage      Index of the page to get, starting at index 0.
     * @param {function} outsideCallback Success callback to execute when the page is retrieved.
     * @return {boolean|Object} `false` if the page is already the current one,
     *                   otherwise returns the result of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws {InvalidPage} If `targetPage` is not a positive number.
     */
    getPage: function(targetPage, outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(targetPage * pageSize == page) {
        return false;
      } else if(Utils.isNumber(targetPage) && targetPage >= 0) {
        this.setOption('page', targetPage * pageSize);
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPage";
      }
    },

    /**
     * @summary Sets the starting page for later executions of the query.
     * @description Sets the starting page for later executions of the query.
     *
     * @param {number} targetPage Index of the page to get.
     * @return {boolean} `true` if the page is correctly set,
     *                   `false` if the target page is already the selected one.
     * @throws {InvalidPage} If the page number is not a positive number.
     */
    setPageStartingAt: function(targetPage) {
      if(targetPage == this.getOption('page')) {
        return false;
      } else if(Utils.isNumber(targetPage) && targetPage >= 0) {
        this.setOption('page', targetPage);
      } else {
        throw "InvalidPage";
      }
    },

    /**
     * @summary Runs the query, setting a starting page before doing so.
     * @description Runs the query, setting a starting page before doing so.
     *              If the starting page matches the already selected one,
     *              the query run is canceled and `false` is returned.
     *
     * @param {number}   page            Starting page index.
     * @param {function} outsideCallback Success callback to execute after the
     *                                   server-side query is processed.
     * @return {boolean|Object} `false` if the query run is canceled,
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
     * @summary Sets the page size.
     * @description Sets the page size.
     *
     * @param {number} pageSize Page size to set.
     */
    setPageSize: function(pageSize) {
      this.setOption('pageSize', pageSize);
    },

    /**
     * @summary Sets the page size and gets the first page of results.
     * @description Sets the page size and gets the first page of results.
     *
     * @param {number}   pageSize        Page Size.
     * @param {function} outsideCallback Success callback to execute after query is retrieved.
     * @return {boolean|Object} `false` if pageSize is invalid, otherwise the result
     *                          of calling {@link cdf.queries.BaseQuery#doQuery|doQuery}.
     * @throws {InvalidPageSize} If the page size is not a positive number.
     */
    initPage: function(pageSize, outsideCallback) {
      if(pageSize == this.getOption('pageSize') && this.getOption('page') == 0) {
        return false;
      } else if(Utils.isNumber(pageSize) && pageSize > 0) {
        this.setOption('page', 0);
        this.setOption('pageSize', pageSize);
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPageSize";
      }
    },
    // endregion

    __getDashboardParameterValue: function(name, value) {
      var paramValue;

      try {
        paramValue = this.dashboard.getParameterValue(value);

      } catch(e) {
        var printValue = !_.isObject(value) || Utils.isFunction(value) ? value : JSON.stringify(value);

        Logger.log(
          "BuildQueryDefinition detected static parameter " + name + "=" + printValue + ". " +
          "The parameter will be used instead the parameter value"
        );
      }

      return paramValue !== undefined ? paramValue : value;
    }
  });

  // Sets the query class that can be extended to create new ones.
  // The registered Base needs to have an extend method.
  DashboardQuery.setBaseQuery(BaseQuery);

  return BaseQuery;
});
