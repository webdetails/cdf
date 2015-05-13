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
        Dashboards.log('Query callback not defined. Override.');
      },
      errorCallback: Dashboards.handleServerError,
      lastResultSet: null,
      page: 0,
      pageSize: 0,
      params: {},
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
        callback(clone);
      };
    },

    getErrorHandler: function(callback) {
      return function(resp, txtStatus, error) {
        if(callback) {
          callback(resp, txtStatus, error);
        }
      };
    },

    doQuery: function(outsideCallback) {
      if(typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback'),
          queryDefinition = this.buildQueryDefinition();

      var settings = _.extend({}, this.getOption('ajaxOptions'), {
          data: queryDefinition,
          url: url,
          success: this.getSuccessHandler(callback),
          error: this.getErrorHandler(errorCallback)
      });

      var async = settings.async == null ?  $.ajaxSettings.async : settings.async;
      if(!async && settings.xhrFields && settings.xhrFields.withCredentials) {
        Dashboards.log("Cross-domain requests are deprecated for synchronous operations.");
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

    // Gets the previous _pageSize results
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
        var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
        if(json && json.result == false) {
          // the ajax call might have been successful (no network errors),
          // but the endpoint might have failed, which is signalled by json.result
          var errorCallback = myself.getErrorHandler(myself.getOption('errorCallback'));
          errorCallback(clone);
        } else {
          callback(clone);
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
      file: '',
      id: '',
      outputIdx: '1',
      sortBy: '',
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


  function makeMetadataElement(idx, name, type) {
    return {"colIndex": idx || 0, "colType": type || "String", "colName": name || "Name"};
  }

  var legacyOpts = {
    name: "legacy",
    label: "Legacy",
    defaults: {
      url: wd.cdf.endpoints.getCdfXaction("pentaho-cdf/actions", "jtable.xaction"),
      queryDef: {}
    },
    interfaces: {
      lastResultSet: {
        reader: function(json) {
          json = eval("(" + json + ")");
          var result = {metadata: [makeMetadataElement(0)], resultset:json.values || []};
          _.each(json.metadata, function(el, idx) {
            return result.metadata.push(makeMetadataElement(idx + 1, el));
          });
          return result
        }
      }
    },

    init: function(opts) {
      this.setOption('queryDef', opts);
    },

    getSuccessHandler: function(callback) {
      var myself = this;
      return function(json) {
        try{
          myself.setOption('lastResultSet', json);
        } catch(e) {
          if(this.async) {
            // async + legacy errors while parsing json response aren't caught
            var msg = Dashboards.getErrorObj('COMPONENT_ERROR').msg + ":" + e.message;
            Dashboards.error(msg);
            json = {"metadata": [msg], "values": []};
          }else{
            //exceptions while parsing json response are
            //already being caught+handled in updateLifecycle()
            throw e;
          }
        }
        var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
        callback(clone);
      }
    },

    //TODO: is this enough?
    buildQueryDefinition: function(overrides) {
      return _.extend({}, this.getOption('queryDef'), overrides);
    }

  };
  Dashboards.registerQuery("legacy", legacyOpts);

  // TODO: Temporary until CDE knows how to write queryTypes definitions, with all these old queries
  // falling under the 'legacy' umbrella.
  Dashboards.registerQuery("mdx", legacyOpts);
  Dashboards.registerQuery("sql", legacyOpts);

})();
