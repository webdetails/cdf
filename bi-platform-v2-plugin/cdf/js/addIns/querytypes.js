/*
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
    defaults: {
      successCallback: null,
      errorCallback: Dashboards.handleServerError,
      lastResultSet: null,
      page: 0,
      pageSize: 0,
      params: {}
    },
    interfaces:{
      params: { reader:'propertiesObject', validator:'isObjectOrPropertiesArray'},
      successCallback: { validator:'isFunction'},
      errorCallback: { validator:'isFunction'},
      pageSize: { validator:'isPositive'}

    },
    constructor: function (config ){
      this.base(config);
      // TODO: Rewrite this later. Right now just want it to work, somehow
      if ( Dashboards && Dashboards.OptionsManager ) {
        this._optionsManager = new Dashboards.OptionsManager( this );
        this._optionsManager.mixin( this );
      }
      this.init(config);
    },
    // Default options interface in case there is no options manager defined.
    getOption: function (prop){
      return this.defaults[prop];
    },
    setOption: function (prop, value){
      this.defaults[prop] = value;
    },
    init: function (opts){
      // Override
    },
    doQuery: function (outerCallback){ 
      // Override 
    },
    exportData: function() {
      // Override 
    },
    setAjaxOptions: function() {
      // Override 
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
          if( this.getOption('params') &&  this.getOption('successCallback') ) {
            return this.doQuery();
          }
        break;
        case 1:
          if (typeof arguments[0] == "function"){
            /* If we're receiving _only_ the callback, we're not
            * going to change the internal callback
            */
            return this.doQuery(arguments[0]);
          } else if( _.isObject(arguments[0]) || _.isArray(arguments[0]) ){
            this.setOption('params' , arguments[0] );
            return this.doQuery();
          }
          break;
        case 2:
          if (typeof arguments[0] == "function"){
            this.setParameter( arguments[0] );
            this.setOption('errorCallback'  , arguments[1] );
            return this.doQuery();
          } else {
            this.setOption('params' , arguments[0] );
            this.setOption('successCallback' , arguments[1] );
            return this.doQuery();
          }
          break;
        default:
          /* We're just going to discard anything over two params */
          this.setOption('params' , params );
          this.setOption('successCallback' , successCallback );
          this.setOption('errorCallback' , errorCallback );
          return this.doQuery();
      }
      /* If we haven't hit a return by this time,
       * the user gave us some wrong input
       */
      throw "InvalidInput";
    },

    // Result caching
    lastResults: function(){
      if ( this.getOption('lastResultSet') !== null) {
        return $.extend(true,{}, this.getOption('lastResultSet') );
      } else {
        throw "NoCachedResults";
      }
    },
    reprocessLastResults: function(outerCallback){
      if ( this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true,{}, this.getOption('lastResultSet') );
        var callback = outerCallback || this.getOption('successCallback') ;
        return callback(clone);
      } else {
        throw "NoCachedResults";
      }
    },
    reprocessResults: function(outsideCallback) {
      if ( this.getOption('lastResultSet') !== null) {
        var clone = $.extend(true,{}, this.getOption('lastResultSet') );
        var callback = (outsideCallback ? outsideCallback : this.getOption('successCallback'));
        callback( clone );
      } else {
        throw "NoCachedResults";
      }
    },
    setParameters: function (params) {
      this.setOption('params', params);
    },
    setCallback: function(callback) {
      this.setOption('successCallback' , callback);
    },
    setErrorCallback: function(callback) {
      this.setOption('errorCallback', callback);
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
      if ( pageSize > 0) {
        page += pageSize;
        this.setOption('page' , page );
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPageSize";
      }
    },
    // Gets the previous _pageSize results
    previousPage: function(outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if (page > pageSize) {
        page -= pageSize;
        this.setOption('page' , page );
        return this.doQuery(outsideCallback);
      } else if (_pageSize > 0) {
        this.setOption('page' , 0 );
        return this.doQuery(outsideCallback);
      } else {
        throw "AtBeggining";
      }
    },
    // Gets the page-th set of _pageSize results (0-indexed)
    getPage: function( targetPage, outsideCallback) {
      var page = this.getOption('page'),
          pageSize = this.getOption('pageSize');
      if (targetPage * pageSize == page) {
        return false;
      } else if (typeof targetPage == 'number' && targetPage >= 0) {
        this.setOption('page' , targetPage * pageSize );
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPage";
      }
    },

    // Gets pageSize results starting at page
    setPageStartingAt: function(targetPage) {
      if (targetPage == this.getOption('page')) {
        return false;
      } else if (typeof targetPage == 'number' && targetPage >= 0) {
        this.setOption('page' , targetPage );
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
      if (pageSize == this.getOption('pageSize') && this.getOption('page') == 0) {
        return false;
      } else if (typeof pageSize == 'number' && pageSize > 0) {
        this.setOption('page' , 0 );
        this.setOption('pageSize' , pageSize );
        return this.doQuery(outsideCallback);
      } else {
        throw "InvalidPageSize";
      }
    }
  });
  // Sets the query class that can extended to create new ones. 
  // The registered Base needs to have an extend method.
  Dashboards.setBaseQuery ( BaseQuery );


  var CpkEndpoints = BaseQuery.extend({
    name: "cpk",
    label: "CPK",
    defaults: {
      baseUrl: '/pentaho/content',
      pluginId: '',
      endpoint: '',
      systemParams: {},
      ajaxOptions: {
        dataType:'json'
      }
    },

    init: function (opts){
        if ( _.isString(opts.pluginId) && _.isString(opts.endpoint) ){
          this.setOption('pluginId' , opts.pluginId);
          this.setOption('endpoint' , opts.endpoint);
        }
    },
    
    doQuery: function(outsideCallback){
      if (typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }
      var urlArray = [ this.getOption('baseUrl') , this.getOption('pluginId') , this.getOption('endpoint') ],
          url = urlArray.join('/') ,
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback') ,
          queryDefinition = this.buildQueryDefinition(),
          myself = this;
      
      var successHandler = function(json) {
        myself.setOption('lastResultSet' , json );
        var clone = $.extend(true,{}, myself.getOption('lastResultSet') );
        callback(clone);
      };
      var errorHandler = function(resp, txtStatus, error ) {      
        if (errorCallback){
          errorCallback(resp, txtStatus, error );
        }
      };

      var settings = _.extend({}, this.getOption('ajaxOptions'), {
        data: queryDefinition,
        url: url,
        success: successHandler,
        error: errorHandler 
      });
      
      $.ajax(settings);
    },

    buildQueryDefinition: function(overrides) {
      overrides = ( overrides instanceof Array) ? Dashboards.propertiesArrayToObject(overrides) : ( overrides || {} );
      var queryDefinition = this.getOption('systemParams');
      
      var cachedParams = this.getOption('params'),
          params = $.extend( {}, cachedParams , overrides);

      _.each( params , function (value, name) {
        value = Dashboards.getParameterValue(value);
        if($.isArray(value) && value.length == 1 && ('' + value[0]).indexOf(';') >= 0){
          //special case where single element will wrongly be treated as a parseable array by cda
          value = doCsvQuoting(value[0],';');
        }
        //else will not be correctly handled for functions that return arrays
        if (typeof value == 'function') {
          value = value();
        }
        queryDefinition['param' + name] = value;
      });

      return queryDefinition;
    }

    /*
     * Public interface
     */
  });
  // Registering a class will use that class directly when getting new queries.
  Dashboards.registerQuery( "cpk", CpkEndpoints );

  var cdaQueryOpts = {
    name: 'cda',
    label: 'CDA Query',
    defaults: {
      url: "/pentaho/content/cda/doQuery?",
      file: '',
      id: '',
      outputIdx: '1',
      sortBy: '',
      ajaxOptions: { }
    },

    init: function (opts){
      if (typeof opts.path != 'undefined' && typeof opts.dataAccessId != 'undefined'){
        // CDA-style cd object
        this.setOption('file' , opts.path );
        this.setOption( 'id' , opts.dataAccessId );
        if (typeof opts.sortBy == 'string' && opts.sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          this.setOption('sortBy', opts.sortBy);
        }
        if(opts.pageSize != null){
          this.setOption('pageSize' , opts.pageSize);
        }
        if(opts.outputIndexId != null){
          this.setOption( 'outputIdx' , opts.outputIndexId );
        }     
        } else {
          throw 'InvalidQuery';
        }
    },

    doQuery: function(outsideCallback){
      if (typeof this.getOption('successCallback') != 'function') {
        throw 'QueryNotInitialized';
      }
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback') ,
          queryDefinition = this.buildQueryDefinition(),
          myself = this;
      
      var successHandler = function(json) {
        myself.setOption('lastResultSet' , json );
        var clone = $.extend(true,{}, myself.getOption('lastResultSet') );
        callback(clone);
      };
      var errorHandler = function(resp, txtStatus, error ) {      
        if (errorCallback){
          errorCallback(resp, txtStatus, error );
        }
      };

      var settings = _.extend({}, this.getOption('ajaxOptions'), {
        data: queryDefinition,
        url: url,
        success: successHandler,
        error: errorHandler 
      });
      
      $.ajax(settings);
    },

    buildQueryDefinition: function(overrides) {
      overrides = ( overrides instanceof Array) ? Dashboards.propertiesArrayToObject(overrides) : ( overrides || {} );
      var queryDefinition = {};
      
      var cachedParams = this.getOption('params'),
          params = $.extend( {}, cachedParams , overrides);

      _.each( params , function (value, name) {
        value = Dashboards.getParameterValue(value);
        if($.isArray(value) && value.length == 1 && ('' + value[0]).indexOf(';') >= 0){
          //special case where single element will wrongly be treated as a parseable array by cda
          value = doCsvQuoting(value[0],';');
        }
        //else will not be correctly handled for functions that return arrays
        if (typeof value == 'function') {
          value = value();
        }
        queryDefinition['param' + name] = value;
      });
      queryDefinition.path = this.getOption('file');
      queryDefinition.dataAccessId = this.getOption('id');
      queryDefinition.outputIndexId = this.getOption('outputIdx');
      queryDefinition.pageSize = this.getOption('pageSize');
      queryDefinition.pageStart = this.getOption('page');
      queryDefinition.sortBy = this.getOption('sortBy');
      return queryDefinition;
    },

    /*
     * Public interface
     */

    exportData: function(outputType, overrides, options) {
      if (!options) {
        options = {};
      }
      var queryDefinition = this.buildQueryDefinition(overrides);
      queryDefinition.outputType = outputType;
      if (outputType == 'csv' && options.separator) {
        queryDefinition.settingcsvSeparator = options.separator;
      }
      if (options.filename) {
        queryDefinition.settingattachmentName= options.filename ;
      }
      if (outputType == 'xls' && options.template) {
        queryDefinition.settingtemplateName= options.template ;
      }
      if( options.columnHeaders ){
        queryDefinition.settingcolumnHeaders = options.columnHeaders;
      }

      if(options.dtFilter != null){
        queryDefinition.settingdtFilter = options.dtFilter;
        if(options.dtSearchableColumns != null){
          queryDefinition.settingdtSearchableColumns = options.dtSearchableColumns;
        }
      }
      queryDefinition.wrapItUp = 'wrapit';
      
      var successCallback = function(uuid) {
        var _exportIframe = $('<iframe style="display:none">');
        _exportIframe.detach();
        //_exportIframe[0].src = webAppPath + 'content/cda/unwrapQuery?' + $.param( {"path": queryDefinition.path, "uuid": uuid});
        _exportIframe[0].src = '/pentaho/content/cda/unwrapQuery?' + $.param( {"path": queryDefinition.path, "uuid": uuid});
        _exportIframe.appendTo($('body'));
      };
      $.ajax({
        type:'POST',
        async: false,
        data: queryDefinition,
        url: this.getOption('url'),
        success: successCallback
      });
    },

    setAjaxOptions: function(newOptions) {
      if(typeof newOptions == "object") {
        _.extend( this.getOption('ajaxOptions') , newOptions);
      }
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
      var newSort;
      if (sortBy === null || sortBy === undefined || sortBy === '') {
        newSort = '';
      }
      /* If we have a string as input, we need to split it into
       * an array of sort terms. Also, independently of the parameter
       * type, we need to convert everything to upper case, since want
       * to accept 'a' and 'd' even though CDA demands capitals.
       */
      else if (typeof sortBy == "string") {
        /* Valid sortBy Strings are column numbers, optionally
         * succeeded by A or D (ascending or descending), and separated by commas
         */
        if (!sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          throw "InvalidSortExpression";
        }
        /* Break the string into its constituent terms, filter out empty terms, if any */
        newSort = sortBy.toUpperCase().split(',').filter(function(e){
          return e !== "";
        });
      } else if (sortBy instanceof Array) {
        newSort = sortBy.map(function(d){
          return d.toUpperCase();
        });
        /* We also need to validate that each individual term is valid */
        var invalidEntries = newSort.filter(function(e){
          return !e.match("^[0-9]+[adAD]?,?$")
        });
        if ( invalidEntries.length > 0) {
          throw "InvalidSortExpression";
        }
      }
        
      /* We check whether the parameter is the same as before,
       * and notify the caller on whether it changed
       */
      var same;
      if (newSort instanceof Array) {
        same = newSort.length != this.getOption('sortBy').length;
        $.each(newSort,function(i,d){
          same = (same && d == this.getOption('sortBy')[i]);
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
      if (!changed) {
        return false;
      } else if ( this.getOption('successCallback') !== null) {
        return this.doQuery(outsideCallback);
      }
    }
  };
  // Registering an object will use it to create a class by extending Dashboards.BaseQuery, 
  // and use that class to generate new queries.
  Dashboards.registerQuery( "cda", cdaQueryOpts );

  var xmlaQueryOpts = {
    name: "xmla",
    label: "XMLA",
    datasource: {}, //cache the datasource as there should be only one xmla server
    defaults: {
      url: webAppPath + "/Xmla" //defaults to Pentaho's Mondrian servlet. can be overridden in options
    },
    getDataSources: function(){
      xmla.xmla = new Xmla({
              async: false,
              url: xmla.defaults.url
      });
      var datasourceCache = [],
        rowset_ds = xmla.xmla.discoverDataSources();
      if (rowset_ds.hasMoreRows()) {
        datasourceCache = rowset_ds.fetchAllAsObject();
        xmla.datasource = datasourceCache[0];
        rowset_ds.close();
        return;
      }
    },
    getCatalogs: function(){
        var properties = {};
        xmla.catalogs = [], catalog = {};
        properties[Xmla.PROP_DATASOURCEINFO] = xmla.datasource[Xmla.PROP_DATASOURCEINFO];
        var rowset_cat = xmla.xmla.discoverDBCatalogs({
            properties: properties
        });
        if (rowset_cat.hasMoreRows()) {
            while (catalog = rowset_cat.fetchAsObject()){
              xmla.catalogs[xmla.catalogs.length] = catalog;
            }
            rowset_cat.close();
        }
    },
    init: function(){
      //TODO $.getScript('/content/xmla4js/src/Xmla.js' function(){} //only load Xmla.js when needed
      //prefetch the datasource and catalogs
      xmla.getDataSources();
      xmla.getCatalogs();
    },
    transformXMLAresults: function(results){
      var rows = results.fetchAllAsArray(),
        cols = results.getFields(), col,
        res={resultset:[], metadata:[]};

      //build metadata object for each column
      for (var i=0,j=cols.length;i<j;i++){
        col = cols[i];
        res.metadata[i] = {
          colIndex:col.index,
          colName:col.label
        }
        switch (col.jsType){
          case "string":
            res.metadata[i].colType = "string";
            break;
          case "number":
            res.metadata[i].colType = "numeric";
            break;
          //TODO addin DateTime boolean or anything else
          default:
            res.metadata[i].colType = "string";
        }
      }
      //build resultset object
      res.resultset = rows; //just use array of rows as it comes back from xmla.fetchAllAsArray
      results.close(); //clear up memory
      //TODO SafeClone?
      return res;
    },
    executeQuery: function(param, options){
      //find the requested catalog in internal array of valid catalogs
      for (var i=0,j=xmla.catalogs.length;i<j;i++){
        if (xmla.catalogs[i]["CATALOG_NAME"] == param.catalog ){
          var properties = {};
          properties[Xmla.PROP_DATASOURCEINFO] = xmla.datasource[Xmla.PROP_DATASOURCEINFO];
          properties[Xmla.PROP_CATALOG]        = param.catalog;
          properties[Xmla.PROP_FORMAT]         = Xmla.PROP_FORMAT_TABULAR;//Xmla.PROP_FORMAT_MULTIDIMENSIONAL;
          var result = xmla.xmla.execute({
              statement: param.query(),
              properties: properties
          });
          return result;
        }
      }
      //should never make it here if param.catalog is on server
      throw new Error("Catalog: " + param.catalog + " was not found on Pentaho server.");
    },
    implementation: function (tgt, st, opt) {
      //just execute the query each time, don't worry about metadata setup as it is done in init
      var result = xmla.executeQuery(st, opt);
      opt.callback(this.transformXMLAresults(result));
    }
  };
  // Dashboards.registerQuery("xmla",  xmlaQueryOpts );


  var legacyOpts = {
    name: "legacy",
    label: "Legacy",
    defaults: {
      url: webAppPath + "/ViewAction?solution=system&path=pentaho-cdf/actions&action=jtable.xaction"
    },    
    
    implementation: function (tgt, st, opt) {
      //uses the legacy way with json.values array
      $.post(opt.url, st, function(json) {
        json = eval("(" + json + ")");
        _lastResultSet = json;
        var clone = $.extend(true,{},_lastResultSet);
        opt.callback({metadata:{}, resultset:clone.values});
      });
    }
  };
  // Dashboards.registerQuery( "legacy", legacyOpts );

  var yqlOpts = {
    name: "yql",
    label: "YQL",
    defaults: {
      url: "query.yahooapis.com/v1/public/yql",
      user: "agrohe21",
      passcode: "",
      data: {
        format: 'json',
        env: 'store://datatables.org/alltableswithkeys'
      }
    },    
    init: function(){
      var myself = this;
    },
    
    implementation: function (target, state, options) {
        var json = {
          resultset:[["East", "100"],["West", "200"]],
          metadata:[{colIndex:"0", colName:"Region", colType:"string"}, {colIndex:"1", colName:"Sales", colType:"numeric"}]
        };
      var localCallback = function(results){
        //do something else here
        options.callback(results);
      }
      //$.get(options.url, options.data, localCallback, 'jsonp');
      options.callback(json);
    }
  };
  // Dashboards.registerQuery( "yql", yqlOpts );


})();