/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


/**
 * queryTypes.js
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
 * but this is a risky operation which considerable implications. Use at your own risk!
 *
 */

;
(function() {

  var BaseQuery = Base.extend({
    name: "baseQuery",
    label: "Base Query",
    deepProperties: ['defaults', 'interfaces'],
    defaults: {
      successCallback: function() {
        Dashboards.log('Query success callback not defined. Override.');
      },
      errorCallback: function(jqXHR, textStatus, errorThrown) {
        if(Dashboards && typeof Dashboards.handleServerError === 'function') {
          Dashboards.handleServerError(jqXHR, textStatus, errorThrown);
          return;
        }
        Dashboards.log('Query error callback not defined. Override.')
      },
      lastResultSet: null,
      lastProcessedResultSet: null,
      page: 0,
      pageSize: 0,
      params: {},
      pushEnabled: false,
      ajaxOptions: {
        async: false,
        type:'POST'
      },
      url: ''
    },
    interfaces:{
      params: {reader: 'propertiesObject', validator: 'isObjectOrPropertiesArray'},
      successCallback: {validator: 'isFunction'},
      errorCallback: {validator: 'isFunction'},
      pageSize: {validator: 'isPositive'}
    },

    constructor: function(config) {
      if(Dashboards && Dashboards.OptionsManager) {
        this._optionsManager = new Dashboards.OptionsManager(this);
        this._optionsManager.mixin(this);
      }
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
        myself.setOption('lastProcessedResultSet', clone);
        json = callback(clone);
        if(json !== undefined && json !== clone) {
          myself.setOption('lastProcessedResultSet', json);
        }
      };
    },

    getErrorHandler: function(callback) {
      return function(resp, txtStatus, error) {
        if(callback) {
          callback(resp, txtStatus, error);
        }
      };
    },

    doQuery: function(successCallback, errorCallback) {
      if(typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }

      var successHandler = successCallback ? successCallback : this.getOption('successCallback');
      var errorHandler = errorCallback ? errorCallback : _.bind(this.getOption('errorCallback'), this);
      var queryDefinition = this.buildQueryDefinition();

      var isFirstTime = true;

      if(this.getOption('pushEnabled')) {
        var myself = this;

        this.websocket = new WebSocket(this.getOption('websocketUrl'), 'JSON-CDA-query');

        this.websocket.onopen = function (event) {
          myself.websocket.send(JSON.stringify(queryDefinition));
        };

        this.websocket.onmessage = function (event) {
          var isDataPush = !isFirstTime;
          isFirstTime = false;

          // If instruction introduced to safeguard against IE 11 and Edge 24 not closing
          // the websocket after the CDE preview (iframe) is closed, resulting
          // in a strange window state where some should-exist objects are undefined
          if(JSON) {
            myself.getSuccessHandler(function (data) {
              return successHandler(data, isDataPush);
            })(JSON.parse(event.data));
          } else {
            // when in the strange situation where the JSON object is not defined/null
            // we give our best shot in trying to close the websocket
            try {
              //1001 - Going Away
              myself.websocket.close(1001);
            } catch(err) {
              //empty on purpose
            }
          }
        };

        this.websocket.onerror = function (event) {
          var isDataPush = !isFirstTime;
          isFirstTime = false;

          myself.getErrorHandler(function (resp, txtStatus, error) {
            errorHandler(resp, txtStatus, error, isDataPush);
          })(event.data);
        };

        this.websocket.onclose = function (event) {
          //the code 1011 (Internal Error) should be treated as an error on the server
          if( event.code === 1011 ) {
            var isDataPush = !isFirstTime;
            isFirstTime = false;

            myself.getErrorHandler(function (resp, txtStatus, error) {
              errorHandler(resp, txtStatus, error, isDataPush);
            })(event.reason);
          }
        }
      } else {
        var settings = _.extend({}, this.getOption('ajaxOptions'), {
          data: queryDefinition,
          url: this.getOption('url'),
          success: this.getSuccessHandler(successHandler),
          error: this.getErrorHandler(errorHandler)
        });

        var async = settings.async == null ? $.ajaxSettings.async : settings.async;
        if (!async && settings.xhrFields && settings.xhrFields.withCredentials) {
          Dashboards.log("Cross-domain requests are deprecated for synchronous operations.");
          delete settings.xhrFields.withCredentials;
        }

        $.ajax(settings);
      }
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
          if( this.getOption('params') &&  this.getOption('successCallback')) {
            return this.doQuery();
          }
        break;
        case 1:
          if(typeof arguments[0] == "function") {
            /* If we're receiving _only_ the callback, we're not
            * going to change the internal callback
            */
            return this.doQuery(arguments[0]);
          } else if(!_.isEmpty(arguments[0]) &&
              (_.isObject(arguments[0]) || _.isArray(arguments[0]))) {
            this.setOption('params', arguments[0] || {});
            return this.doQuery();
          }
          break;
        case 2:
          if(typeof arguments[0] == "function") {
            this.setOption('successCallback', arguments[0]);
            if(typeof arguments[1] == "function") {
              this.setOption('errorCallback', arguments[1]);
            }
            return this.doQuery();
          } else {
            this.setOption('params', arguments[0] || {});
            this.setOption('successCallback', arguments[1]);
            return this.doQuery();
          }
          break;
        default:
          /* We're just going to discard anything over three params */
          if(params) {
            this.setOption('params', params);
          }
          if(typeof arguments[1] == "function") {
            this.setOption('successCallback', successCallback);
          }
          if(typeof arguments[2] == "function") {
            this.setOption('errorCallback', errorCallback);
          }
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

    lastProcessedResults: function() {
      if(this.getOption('lastProcessedResultSet') !== null) {
        return $.extend(true, {}, this.getOption('lastProcessedResultSet'));
      } else {
        throw "NoCachedResults";
      }
    },

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

    reprocessResults: function(outsideCallback) {
      if(this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        var callback = (outsideCallback ? outsideCallback : this.getOption('successCallback'));
        callback(clone);
      } else {
        throw "NoCachedResults";
      }
    },

    setParameters: function (params) {
      this.setOption('params', params);
    },

    setCallback: function(callback) {
      this.setOption('successCallback', callback);
    },

    setErrorCallback: function(callback) {
      this.setOption('errorCallback', callback);
    },

    setSearchPattern: function(pattern){
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

    // Gets the previous pageSize results
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

    // Gets the page-th set of _pageSize results (0-indexed)
    getPage: function(targetPage, outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if(targetPage * pageSize == page) {
        return false;
      } else if(typeof targetPage == 'number' && targetPage >= 0) {
        this.setOption('page' , targetPage * pageSize);
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
        this.setOption('page' , targetPage);
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
    },

    //Dispose the query object
    dispose: function() {
      if(this.websocket) {
        //1000 - normal close by the spec
        this.websocket.close(1000);
        this.websocket = null;
      }
    }
  });
  // Sets the query class that can extended to create new ones.
  // The registered Base needs to have an extend method.
  Dashboards.setBaseQuery(BaseQuery);


  var CpkEndpointsOpts = {
    name: "cpk",
    label: "CPK",
    defaults: {
      url: '',
      pluginId: '',
      endpoint: '',
      systemParams: {},
      ajaxOptions: {
        dataType:'json',
        type:'POST',
        async: true,
        xhrFields: {withCredentials: true}
      }
    },

    init: function(opts) {
      if(_.isString(opts.pluginId) && _.isString(opts.endpoint)) {
        this.setOption('pluginId', opts.pluginId);
        this.setOption('endpoint', opts.endpoint);
        this.setOption('url', wd.cdf.endpoints.getPluginEndpoint(opts.pluginId, opts.endpoint));
      }
      this.setOption('kettleOutput', opts.kettleOutput);
      this.setOption('stepName', opts.stepName);
      this.setOption('systemParams', opts.systemParams || {});
      this.setOption('ajaxOptions', $.extend({}, this.getOption('ajaxOptions'), opts.ajaxOptions));
      var ajaxOptions = this.getOption('ajaxOptions');
      if(ajaxOptions.dataType == 'json') {
        ajaxOptions.mimeType = 'application/json; charset utf-8'; //solves "not well formed" error in Firefox 24
        this.setOption('ajaxOptions', ajaxOptions);
      }
    },

    buildQueryDefinition: function(overrides) {
      overrides = (overrides instanceof Array) ? Dashboards.propertiesArrayToObject(overrides) : (overrides || {});

      var queryDefinition = {
          kettleOutput: this.getOption('kettleOutput'),
          stepName: this.getOption('stepName')
      };
      // We clone queryDefinition to remove undefined
      queryDefinition = $.extend(true, {}, queryDefinition, this.getOption('systemParams'));

      var cachedParams = this.getOption('params'),
          params = $.extend({}, cachedParams, overrides);

      _.each(params, function(value, name) {
        var paramValue, printValue;
        try {
          paramValue = Dashboards.getParameterValue(value);
        } catch(e) {
          if(!_.isObject(value) || _.isFunction(value)) {
            printValue = value;
          } else {
            printValue = JSON.stringify(value);
          }
          Dashboards.log("BuildQueryDefinition detected static parameter " + name + "=" + printValue + ". " +
            "The parameter will be used as value instead its value obtained from getParameterValue");
          paramValue = value;
        }
        if(paramValue === undefined) {
          paramValue = value;
        }
        if(_.isFunction(paramValue)) {
          paramValue = paramValue();
        } else if(_.isObject(paramValue)) {
          // kettle does not handle arrays natively,
          // nor does it interpret multiple parameters with the same name as elements of an array,
          // nor does CPK do any sort of array handling.
          // A stringify ensures the array is passed as a string, that can be parsed using kettle.
          paramValue = JSON.stringify(paramValue);
          // Another option would be to add further:
          // value = value.split('],').join(';').split('[').join('').split(']').join('');
          // which transforms [[0,1],[2,3]] into "0,1;2,3"
        }
        queryDefinition['param' + name] = paramValue;
      });

      return queryDefinition;
    },

    getSuccessHandler: function(callback) {
      // copy-pasted from BaseQuery + added errorCallback
      var myself = this;
      return function(json) {
        myself.setOption('lastResultSet', json);
        if(json && json.result == false) {
          // the ajax call might have been successful (no network errors),
          // but the endpoint might have failed, which is signalled by json.result
          var errorCallback = myself.getErrorHandler(myself.getOption('errorCallback'));
          errorCallback(json);
        } else {
          var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
          myself.setOption('lastProcessedResultSet', clone);
          json = callback(clone);
          if(json !== undefined && json !== clone) {
            myself.setOption('lastProcessedResultSet', json);
          }
        }
      };
    }
    /*
     * Public interface
     */
  };
  // Registering a class will use that class directly when getting new queries.
  Dashboards.registerQuery("cpk", CpkEndpointsOpts);


  var cdaQueryOpts = {
    name: 'cda',
    label: 'CDA Query',
    defaults: {
      url: wd.cdf.endpoints.getDoQuery(),
      websocketUrl: wd.cdf.endpoints.getWebsocketQuery(),
      file: '',
      id: '',
      outputIdx: '1',
      sortBy: '',
      pushEnabled: false,
      ajaxOptions: {
        async: true,
        xhrFields: {withCredentials: true}
      },
      searchPattern: ''
    },

    init: function(opts) {
      if(typeof opts.path != 'undefined' && typeof opts.dataAccessId != 'undefined') {
        // CDA-style cd object
        this.setOption('file', opts.path);
        this.setOption('id', opts.dataAccessId);
        if(typeof opts.sortBy == 'string' && opts.sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          this.setOption('sortBy', opts.sortBy);
        }
        if(opts.pageSize != null) {
          this.setOption('pageSize', opts.pageSize);
        }
        if(opts.outputIndexId != null) {
          this.setOption('outputIdx', opts.outputIndexId);
        }
        if(opts.pushEnabled != null) {
          this.setOption('pushEnabled', opts.pushEnabled);
        }
      } else {
        throw 'InvalidQuery';
      }
    },

    buildQueryDefinition: function(overrides) {
      overrides = (overrides instanceof Array) ? Dashboards.propertiesArrayToObject(overrides) : (overrides || {});
      var queryDefinition = {};

      var cachedParams = this.getOption('params'),
          params = $.extend({}, cachedParams, overrides);

      _.each(params, function(value, name) {
        var paramValue;
        try {
          paramValue = Dashboards.getParameterValue(value);
        } catch(e) {
          var printValue = "";
          if(!_.isObject(value) || _.isFunction(value)) {
            printValue = value;
          } else {
            printValue = JSON.stringify(value);
          }
          Dashboards.log("BuildQueryDefinition detected static parameter " + name + "=" + printValue + ". " +
            "The parameter will be used instead the parameter value");
          paramValue = value;
        }
        if(paramValue === undefined) {
          paramValue = value;
        }
        if($.isArray(paramValue) && paramValue.length == 1 && ('' + paramValue[0]).indexOf(';') >= 0) {
          //special case where single element will wrongly be treated as a parsable array by cda
          paramValue = doCsvQuoting(paramValue[0], ';');
        }
        //else will not be correctly handled for functions that return arrays
        if(typeof paramValue == 'function') {
          paramValue = paramValue();
        }
        queryDefinition['param' + name] = paramValue;
      });
      queryDefinition.path = this.getOption('file');
      queryDefinition.dataAccessId = this.getOption('id');
      queryDefinition.outputIndexId = this.getOption('outputIdx');
      queryDefinition.pageSize = this.getOption('pageSize');
      queryDefinition.pageStart = this.getOption('page');
      queryDefinition.sortBy = this.getOption('sortBy');
      queryDefinition.paramsearchBox = this.getOption('searchPattern');
      return queryDefinition;
    },

    /*
     * Public interface
     */
    exportData: function(outputType, overrides, options) {
      if(!options) {
        options = {};
      }
      var queryDefinition = this.buildQueryDefinition(overrides);
      queryDefinition.outputType = outputType;
      if(outputType == 'csv' && options.separator) {
        queryDefinition.settingcsvSeparator = options.separator;
      }
      if(options.filename) {
        queryDefinition.settingattachmentName = options.filename;
      }
      if(outputType == 'xls' && options.template) {
        queryDefinition.settingtemplateName = options.template;
      }
      if(options.columnHeaders) {
        queryDefinition.settingcolumnHeaders = options.columnHeaders;
      }

      // only relevant for a component with server side pagination
      if(options.exportPage === false) { // only export the entire dataset when exportPage is false
        queryDefinition.pageSize = 0;
        queryDefinition.pageStart = 0;
      }

      if(options.dtFilter != null) {
        queryDefinition.settingdtFilter = options.dtFilter;
        if(options.dtSearchableColumns != null) {
          queryDefinition.settingdtSearchableColumns = options.dtSearchableColumns;
        }
      }
      queryDefinition.wrapItUp = 'true';

      $.ajax({
        type:'POST',
        dataType: 'text',
        async: true,
        data: queryDefinition,
        url: this.getOption('url'),
        xhrFields: {withCredentials: true}
      }).done(function(uuid) {
        var _exportIframe = $('<iframe style="display:none">');
        _exportIframe.detach();
        _exportIframe[0].src = wd.cdf.endpoints.getUnwrapQuery({"path": queryDefinition.path, "uuid": uuid});
        _exportIframe.appendTo($('body'));
      }).fail(function(jqXHR,textStatus,errorThrown) {
        Dashboards.log("Request failed: " + jqXHR.responseText + " :: " + textStatus + " ::: " + errorThrown);
      });
    },

    /* Sorting
     *
     * CDA expects an array of terms consisting of a number and a letter
     * that's either 'A' or 'D'. Each term denotes, in order, a column
     * number and sort direction: 0A would then be sorting the first column
     * ascending, and 1D would sort the second column in descending order.
     * This function accepts either an array with the search terms, or
     * a comma-separated string with the terms:  "0A,1D" would then mean
     * the same as the array ["0A","1D"], which would sort the results
     * first by the first column (ascending), and then by the second
     * column (descending).
     */
    setSortBy: function(sortBy) {
      var newSort,
          myself = this;
      if(sortBy === null || sortBy === undefined || sortBy === '') {
        newSort = '';
      }
      /* If we have a string as input, we need to split it into
       * an array of sort terms. Also, independently of the parameter
       * type, we need to convert everything to upper case, since want
       * to accept 'a' and 'd' even though CDA demands capitals.
       */
      else if(typeof sortBy == "string") {
        /* Valid sortBy Strings are column numbers, optionally
         * succeeded by A or D (ascending or descending), and separated by commas
         */
        if(!sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          throw "InvalidSortExpression";
        }
        /* Break the string into its constituent terms, filter out empty terms, if any */
        newSort = sortBy.toUpperCase().split(',').filter(function(e) {
          return e !== "";
        });
      } else if(sortBy instanceof Array) {
        newSort = sortBy.map(function(d) {
          return d.toUpperCase();
        });
        /* We also need to validate that each individual term is valid */
        var invalidEntries = newSort.filter(function(e) {
          return !e.match("^[0-9]+[adAD]?,?$");
        });
        if(invalidEntries.length > 0) {
          throw "InvalidSortExpression";
        }
      }

      /* We check whether the parameter is the same as before,
       * and notify the caller on whether it changed
       */
      var same;
      if(newSort instanceof Array) {
        same = newSort.length != myself.getOption('sortBy').length;
        $.each(newSort,function(i, d) {
          same = (same && d == myself.getOption('sortBy')[i]);
          if(!same) {
            return false;
          }
        });
      } else {
        same = (newSort === this.getOption('sortBy'));
      }
      this.setOption('sortBy' , newSort);
      return !same;
    },

    sortBy: function(sortBy,outsideCallback) {
      /* If the parameter is not the same, and we have a valid state,
       * we can fire the query.
       */
      var changed = this.setSortBy(sortBy);
      if(!changed) {
        return false;
      } else if(this.getOption('successCallback') !== null) {
        return this.doQuery(outsideCallback);
      }
    }
  };
  // Registering an object will use it to create a class by extending Dashboards.BaseQuery,
  // and use that class to generate new queries.
  Dashboards.registerQuery("cda", cdaQueryOpts);
})();
