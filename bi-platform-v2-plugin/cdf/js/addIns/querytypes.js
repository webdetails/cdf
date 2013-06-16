/*
 Purpose: Provide extensible datasources via Dashboard Addins
 Author: Andy Grohe
 Contact: agrohe21@gmail.com
*/
;
(function() {


var baseQuery = new AddIn({
  // AddIn stuff
  name: "baseQuery",
  label: "Base Query",
  defaults: {
    successCallback: null,
    errorCallback: Dashboards.handleServerError,
    lastResultSet: null,
    page: 0,
    pageSize: 0
  },
  validators: {
    successCallback: '_function',
    errorCallback: '_function',
    pageSize: '_positive',
    params: '_objectOrPropertiesArray'
  },
  readers: {
    params: '_propertiesObject'
  },
  writers: {

  },

  init: function (){
    this.properties = $.extend( true, {}, this.properties, this.defaults);

    function bindLibraryFunctions ( library ){
      _.each( library , function(el, key){
        if (typeof el == 'string'){
          library[key] = library[el];
        }
      });
    };

    bindLibraryFunctions( this.validators );
    bindLibraryFunctions( this.setters );
    bindLibraryFunctions( this.getters );

  },
  implementation: function (opts){
    var QueryCreator = Base.extend( this ),
        query = new QueryCreator;
    query.initOpts(opts);
    return query
  },
  initOpts: function(opts){

  },

  // Query stuff
  properties: {
  },
  validators: {
    _default: function (value){
      return true
    },
    _function: function (value){
      return (typeof value == "function");
    },
    _positive: function (value){
      return (typeof pageSize == 'number' && pageSize > 0); 
    },
    _objectOrPropertiesArray : function (value){
      return (value instanceof Array) || (typeof value == 'object')
    },

    successCallback: '_function',
    errorCallback: '_function',
    pageSize: '_positive',
    params: '_objectOrPropertiesArray'
  },
  setters: {
    _default: function (prop, value){
      this.properties[prop] = value;
    },
    _propertiesObject: function (prop, value) {
      value = (value instanceof Array) ? Dashboards.propertiesArrayToObject(value) : value;
      this.properties[prop] = value;
    },

    params: '_propertiesObject'
  },
  getters: {
    _default: function (prop){
      return this.properties[prop];
    }
  },

  setProperty: function (prop, value){
    var setter = _.bind( this.setters[prop] || this.setters['_default'], this ),
        validator = _.bind( this.validators[prop] || this.validators['_default'] , this );
    if ( validator(value) ){
      setter(prop, value);
    } else {
      throw "Invalid" + prop.charAt(0).toUpperCase() + prop.slice(1);;
    }
  },
  getProperty: function (prop){
    var getter = _.bind( this.getters[prop] || this.getters['_default'] , this );
    return getter(prop);
  },

  doQuery: function (outerCallback){

  },

  /*
   * Public interface
   */

  exportData: function() {

  },

  setAjaxOptions: function() {

  },

  fetchData: function(params, successCallback, errorCallback) {
  
  },

  // Result caching
  lastResults: function(){
    if ( this.getProperty('lastResultSet') !== null) {
      return $.extend(true,{}, this.getProperty('lastResultSet') );
    } else {
      throw "NoCachedResults";
    }
  },

  reprocessLastResults: function(outerCallback){
    if ( this.getProperty('lastResultSet') !== null) {
      var clone = $.extend(true,{}, this.getProperty('lastResultSet') );
      var callback = outerCallback || this.getProperty('successCallback') ;
      return callback(clone);
    } else {
      throw "NoCachedResults";
    }
  },

  reprocessResults: function(outsideCallback) {
    if ( this.getProperty('lastResultSet') !== null) {
      var clone = $.extend(true,{}, this.getProperty('lastResultSet') );
      var callback = (outsideCallback ? outsideCallback : this.getProperty('successCallback'));
      callback( clone );
    } else {
      throw "NoCachedResults";
    }
  },


  setSortBy: function(sortBy) {

  },

  sortBy: function(sortBy,outsideCallback) {

  },


  setParameters: function (params) {
    this.setProperty('params', params);
  },

  setCallback: function(callback) {
    this.setProperty('successCallback' , callback);
  },

  setErrorCallback: function(callback) {
    this.setProperty('errorCallback', callback);
  },



  /* Pagination
   *
   * We paginate by having an initial position ( page ) and page size ( pageSize )
   * Paginating consists of incrementing/decrementing the initial position by
   * the page size. All paging operations change the paging cursor.
   */

  // Gets the next _pageSize results
  nextPage: function(outsideCallback) {
    var page = this.getProperty('page'),
        pageSize = this.getProperty('pageSize');
    if ( pageSize > 0) {
      page += pageSize;
      this.setProperty('page' , page );
      return this.doQuery(outsideCallback);
    } else {
      throw "InvalidPageSize";
    }
  },

  // Gets the previous _pageSize results
  prevPage: function(outsideCallback) {
    var page = this.getProperty('page'),
        pageSize = this.getProperty('pageSize');
    if (page > pageSize) {
      page -= pageSize;
      this.setProperty('page' , page );
      return this.doQuery(outsideCallback);
    } else if (_pageSize > 0) {
      this.setProperty('page' , 0 );
      return this.doQuery(outsideCallback);
    } else {
      throw "AtBeggining";
    }
  },

  // Gets the page-th set of _pageSize results (0-indexed)
  getPage: function( targetPage, outsideCallback) {
    var page = this.getProperty('page'),
        pageSize = this.getProperty('pageSize');
    if (targetPage * pageSize == page) {
      return false;
    } else if (typeof targetPage == 'number' && targetPage >= 0) {
      this.setProperty('page' , targetPage * pageSize );
      return this.doQuery(outsideCallback);
    } else {
      throw "InvalidPage";
    }
  },

  // Gets pageSize results starting at page
  setPageStartingAt: function(targetPage) {
    if (targetPage == this.getProperty('page')) {
      return false;
    } else if (typeof targetPage == 'number' && targetPage >= 0) {
      this.setProperty('page' , targetPage );
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
    this.setProperty('pageSize', pageSize);
  },

  // sets _pageSize to pageSize, and gets the first page of results
  initPage: function(pageSize,outsideCallback) {
    if (pageSize == this.getProperty('pageSize') && this.getProperty('page') == 0) {
      return false;
    } else if (typeof pageSize == 'number' && pageSize > 0) {
      this.setProperty('page' , 0 );
      this.setProperty('pageSize' , pageSize );
      return this.doQuery(outsideCallback);
    } else {
      throw "InvalidPageSize";
    }
  }
});

Dashboards.registerAddIn("Query", "queryTypes", baseQuery);



//Ctors:
// Query(queryString) --> DEPRECATED
// Query(queryDefinition{path, dataAccessId})
// Query(path, dataAccessId)
var cdaQuery = baseQuery.clone({
  name: 'cda',
  label: 'CDA Query',
  defaults: {
    url: "/pentaho/content/cda/doQuery?",
    file: '',
    id: '',
    outputIdx: '1',
    sortBy: '',
    ajaxOptions: {

    }
  },

  initOpts: function (opts){
    if (typeof opts.path != 'undefined' && typeof opts.dataAccessId != 'undefined'){
      // CDA-style cd object
      this.setProperty('file' , opts.path );
      this.setProperty( 'id' , opts.dataAccessId );
      if (typeof opts.sortBy == 'string' && opts.sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
        this.setProperty('sortBy', opts.sortBy);
      }
      if(opts.pageSize != null){
        this.setProperty('pageSize' , opts.pageSize);
      }
      if(opts.outputIndexId != null){
        this.setProperty( 'outputIdx' , opts.outputIndexId );
      }     
      } else {
        throw 'InvalidQuery';
      }
  },

  doQuery: function(outsideCallback){
    if (typeof this.getProperty('successCallback') != 'function') {
      throw 'QueryNotInitialized';
    }
    var url = this.getProperty('url'),
        callback = (outsideCallback ? outsideCallback : this.getProperty('successCallback')),
        errorCallback = this.getProperty('errorCallback') ,
        queryDefinition = this.buildQueryDefinition(),
        myself = this;
    
    var successHandler = function(json) {
      myself.setProperty('lastResultSet' , json );
      var clone = $.extend(true,{}, myself.getProperty('lastResultSet') );
      callback(clone);
    };
    var errorHandler = function(resp, txtStatus, error ) {      
      if (errorCallback){
        errorCallback(resp, txtStatus, error );
      }
    };

    var settings = _.extend({}, this.getProperty('ajaxOptions'), {
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
    
    var cachedParams = this.getProperty('params'),
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
    queryDefinition.path = this.getProperty('file');
    queryDefinition.dataAccessId = this.getProperty('id');
    queryDefinition.outputIndexId = this.getProperty('outputIdx');
    queryDefinition.pageSize = this.getProperty('pageSize');
    queryDefinition.pageStart = this.getProperty('page');
    queryDefinition.sortBy = this.getProperty('sortBy');
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
      url: this.getProperty('url'),
      success: successCallback
    });
  },

  setAjaxOptions: function(newOptions) {
    if(typeof newOptions == "object") {
      _.extend( this.getProperty('ajaxOptions') , newOptions);
    }
  },

  fetchData: function(params, successCallback, errorCallback) {
    switch(arguments.length) {
      case 0:
        if( this.getProperty('params') &&  this.getProperty('successCallback') ) {
          return this.doQuery();
        }
        break;
      case 1:
        if (typeof arguments[0] == "function"){
          /* If we're receiving _only_ the callback, we're not
           * going to change the internal callback
           */
          return this.doQuery(arguments[0]);
        } else if( arguments[0] instanceof Array){
          this.setProperty('params' , arguments[0] );
          return this.doQuery();
        }
        break;
      case 2:
        if (typeof arguments[0] == "function"){
          this.setParameter( arguments[0] );
          this.setProperty('errorCallback'  , arguments[1] );
          return this.doQuery();
        } else {
          this.setProperty('params' , arguments[0] );
          this.setProperty('successCallback' , arguments[1] );
          return this.doQuery();
        }
        break;
      default:
        /* We're just going to discard anything over two params */
        this.setProperty('params' , params );
        this.setProperty('successCallback' , successCallback );
        this.setProperty('errorCallback' , errorCallback );
        return this.doQuery();
    }
    /* If we haven't hit a return by this time,
     * the user gave us some wrong input
     */
    throw "InvalidInput";
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
      same = newSort.length != this.getProperty('sortBy').length;
      $.each(newSort,function(i,d){
        same = (same && d == this.getProperty('sortBy')[i]);
        if(!same) {
          return false;
        }
      });
    } else {
      same = (newSort === this.getProperty('sortBy'));
    }
    this.setProperty('sortBy' , newSort);
    return !same;
  },

  sortBy: function(sortBy,outsideCallback) {
    /* If the parameter is not the same, and we have a valid state,
     * we can fire the query.
     */
    var changed = this.setSortBy(sortBy);
    if (!changed) {
      return false;
    } else if ( this.getProperty('successCallback') !== null) {
      return this.doQuery(outsideCallback);
    }
  }

});

Dashboards.registerAddIn("Query", "queryTypes", cdaQuery );





  /*
    XMLA Query
    requires queryType="xmla" in chartDefintion of CDF object
  */
  var XmlaQuery = {
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
  // Dashboards.registerAddIn("Query", "queryType", new AddIn(xmla));


  // Dashboards.registerAddIn("Query", "queryType", new AddIn(cda));

  var legacy = {
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
  
  // Dashboards.registerAddIn("Query", "queryType", new AddIn(legacy));

  var yql = {
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
  
  // Dashboards.registerAddIn("Query", "queryType", new AddIn(yql));


})();