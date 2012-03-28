/*
 Purpose: Provide extensible datasources via Dashboard Addins
 Author: Andy Grohe
 Contact: agrohe21@gmail.com
*/

(function() {
  /*
    XMLA Query
    requires queryType="xmla" in chartDefintion of CDF object
  */
  var xmla = {
    name: "xmla",
    label: "XMLA",
    xmla: null,
    datasource: null, //cache the datasource as there should be only one xmla server
    catalogs: null,
    defaults: {
      url: webAppPath + "/Xmla" //defaults to Pentaho's Mondrian servlet. can be overridden in options
    },
    getDataSources: function(){
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
      if (xmla.xmla == null) {
        xmla.xmla = new Xmla({
                async: false,
                url: xmla.defaults.url
        });
      }
      if (xmla.datasource == null) {
        xmla.getDataSources();
      }
      if (xmla.catalogs == null) {
        xmla.getCatalogs();
      }

      try {      
        var result = xmla.executeQuery(st, opt);
      } catch (e) {
        Dashboards.log('unable to execute xmla addin query: ' +e+' :', 'error')
      }
      opt.callback(this.transformXMLAresults(result));
    }
  };
  try {
    Dashboards.registerAddIn("Query", "queryType", new AddIn(xmla));
  } catch (e) {
    Dashboards.log(e, 'error')
  }

  /*
    XMLA Metadata Query
    requires queryType="xmla_discover" in chartDefintion of CDF object
  */
 var xmla_discover = {
    name: "xmla_discover",
    label: "XMLA Discover",
    xmla: null,
    datasource: null, //cache the datasource as there should be only one xmla datasource with Pentaho
    defaults: {
      url: webAppPath + "/Xmla" //defaults to Pentaho's Mondrian servlet. can be overridden in options
    },
    getDataSources: function(){
      var datasourceCache = [],
        rowset_ds = xmla_discover.xmla.discoverDataSources();
      if (rowset_ds.hasMoreRows()) {
        datasourceCache = rowset_ds.fetchAllAsObject();
        xmla_discover.datasource = datasourceCache[0]; //cache this object for later usage
        rowset_ds.close();
        return;
      }
    },
    discover: function(param, options){
        var properties = {}, rows =[], restrictions={}, qry=param.query(); //user must pass in valid XMLA requestTypes
        properties[Xmla.PROP_DATASOURCEINFO] = xmla_discover.datasource[Xmla.PROP_DATASOURCEINFO];
        if (param.catalog) {
          properties[Xmla.PROP_CATALOG] = param.catalog;
        }
        var rowset_discover = xmla_discover.xmla.discover({properties:properties, requestType:qry});
        return rowset_discover;
    },
    init: function(){
    },
    transformDiscoverresults: function(results){ //format results into standard format with metadata and resultset.
      var 
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
      res.resultset = results.fetchAllAsArray(); //just use array of rows as it comes back from xmla.fetchAllAsObject
      results.close(); //clear up memory
      //TODO SafeClone?
      return res;
    },
    implementation: function (tgt, st, opt) {
      if (xmla_discover.xmla == null) { //lazily load object when needed only
        xmla_discover.xmla = new Xmla({
                async: false,
                url: xmla_discover.defaults.url
        });
      }
      if (xmla_discover.datasource == null){
        xmla_discover.getDataSources(); //another lazy load
      }
      
      try {      
        var result = xmla_discover.discover(st, opt);
      } catch (e) {
        Dashboards.log('unable to execute xmla_discover discover query: ' +e+' :', 'error')
      }
      opt.callback(this.transformDiscoverresults(result));
    }
  };
  try {
    Dashboards.registerAddIn("Query", "queryType", new AddIn(xmla_discover));
  } catch (e) {
    Dashboards.log(e, 'error xmla_discover')
  }
  
  var cda = {
    name: "cda",
    label: "cda",
    defaults: {
      url: webAppPath + "/content/cda/doQuery?"
    },    
    implementation: function (tgt, st, opt) {
        $.post(opt.url, opt.func(), function(json) {
          _lastResultSet = json;
          var clone = Dashboards.safeClone(true,{},_lastResultSet);
          opt.callback(clone);
        });
    }
  };
  Dashboards.registerAddIn("Query", "queryType", new AddIn(cda));

  var legacy = {
    name: "legacy",
    label: "Legacy",
    defaults: {
      url: webAppPath + "/ViewAction?solution=cdf&path=components&action=jtable.xaction"
    },    
    
    implementation: function (tgt, st, opt) {
      //uses the legacy way with json.values array
      $.post(opt.url, st, function(json) {
        json = eval("(" + json + ")");
        _lastResultSet = json;
        var clone = Dashboards.safeClone(true,{},_lastResultSet);
        opt.callback({metadata:{}, resultset:clone.values});
      });
    }
  };
  
  Dashboards.registerAddIn("Query", "queryType", new AddIn(legacy));

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
        //do something here to format results
        options.callback(results);
      }
      //$.get(options.url, options.data, localCallback, 'jsonp');
      options.callback(json);
    }
  };
  
  try {
    Dashboards.registerAddIn("Query", "queryType", new AddIn(yql));
  } catch (e) {
    Dashboards.log(e, 'error')
  }

})();
