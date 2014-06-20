/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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
 Purpose: Provide extensible datasources via Dashboard Addins
 Author: Andy Grohe
 Contact: agrohe21@gmail.com
*/

(function() {

  SharedXmla = Base.extend({
    xmla: null,
    datasource: null, //cache the datasource as there should be only one xmla server
    catalogs: null,

    getDataSources: function(){
      var datasourceCache = [],
        rowset_ds = this.xmla.discoverDataSources();
      if (rowset_ds.hasMoreRows()) {
        datasourceCache = rowset_ds.fetchAllAsObject();
        this.datasource = datasourceCache[0];
        rowset_ds.close();
        return;
      }
    },
    getCatalogs: function(){
        var properties = {};
        this.catalogs = [], catalog = {};
        properties[Xmla.PROP_DATASOURCEINFO] = this.datasource[Xmla.PROP_DATASOURCEINFO];
        var rowset_cat = this.xmla.discoverDBCatalogs({
            properties: properties
        });
        if (rowset_cat.hasMoreRows()) {
            while (catalog = rowset_cat.fetchAsObject()){
              this.catalogs[this.catalogs.length] = catalog;
            }
            rowset_cat.close();
        }
    },
    discover: function(param){
        var properties = {}, rows =[], restrictions={}, qry=param.query(); //user must pass in valid XMLA requestTypes
        properties[Xmla.PROP_DATASOURCEINFO] = this.datasource[Xmla.PROP_DATASOURCEINFO];
        if (param.catalog) {
          properties[Xmla.PROP_CATALOG] = param.catalog;
        }
        var rowset_discover = this.xmla.discover({properties:properties, requestType:qry});
        return rowset_discover;
    },
    execute: function(param){
      //find the requested catalog in internal array of valid catalogs
      for (var i=0,j=_sharedXmla.catalogs.length;i<j;i++){
        if (_sharedXmla.catalogs[i]["CATALOG_NAME"] == param.catalog ){
          var properties = {};
          properties[Xmla.PROP_DATASOURCEINFO] = _sharedXmla.datasource[Xmla.PROP_DATASOURCEINFO];
          properties[Xmla.PROP_CATALOG]        = param.catalog;
          properties[Xmla.PROP_FORMAT]         = _sharedXmla.PROP_FORMAT_TABULAR;//Xmla.PROP_FORMAT_MULTIDIMENSIONAL;
          var result = this.xmla.execute({
              statement: param.query(),
              properties: properties
          });
          return result;
        }
      }
      //should never make it here if param.catalog is on server
      throw new Error("Catalog: " + param.catalog + " was not found on Pentaho server.");
    }
  });

  
  var _sharedXmla = new SharedXmla();
  var _scriptName = 'Xmla.js';
  var _isScriptLoaded = false;
  var _scriptLocation = wd.cdf.endpoints.getCdfBase() + '/js/queries/';


  function loadXmlaScript (){
    if (!_isScriptLoaded){
      $.ajax({
        url: _scriptLocation + _scriptName,
        dataType: "script",
        success: function (){
          _isScriptLoaded = true;
        },
        async: false
      });
    }
  }


  /*
    XMLA Query
    requires queryType="xmla" in chartDefintion of CDF object
  */
  var xmlaOpts = {
    name: "xmla",
    label: "XMLA",
    defaults: {
      url: wd.cdf.endpoints.getXmla() //defaults to Pentaho's Mondrian servlet. can be overridden in options
    },
    init: function(){
      loadXmlaScript();
      if (_sharedXmla.xmla == null) {
        _sharedXmla.xmla = new Xmla({
                async: false,
                url: this.getOption('url')
        });
      }
      if (_sharedXmla.datasource == null) {
        _sharedXmla.getDataSources();
      }
      if (_sharedXmla.catalogs == null) {
        _sharedXmla.getCatalogs();
      }
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

    doQuery: function(outsideCallback){
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback'),
          params = this.getOption('params');

      try {      
        var result = _sharedXmla.execute(params);
      } catch (e) {
        Dashboards.log('unable to execute xmla addin query: ' +e+' :', 'error')
      }
      callback(this.transformXMLAresults(result));
    
    }

  };
  Dashboards.registerQuery("xmla", xmlaOpts );




  /*
    XMLA Metadata Query
    requires queryType="xmla_discover" in chartDefintion of CDF object
  */
 var xmlaDiscoverOpts = {
    name: "xmlaDiscover",
    label: "XMLA Discover",
    defaults: {
      url: wd.cdf.endpoints.getXmla() //defaults to Pentaho's Mondrian servlet. can be overridden in options
    },
    init: function(){
      loadXmlaScript();
      if (_sharedXmla.xmla == null) { //lazily load object when needed only
        _sharedXmla.xmla = new Xmla({
                async: false,
                url: this.getOption('url')
        });
      }
      if (_sharedXmla.datasource == null){
        _sharedXmla.getDataSources(); //another lazy load
      }
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
    doQuery: function(outsideCallback){
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback'),
          params = this.getOption('params');

      try {      
        var result = _sharedXmla.discover(params);
      } catch (e) {
        Dashboards.log('unable to execute xmla addin query: ' +e+' :', 'error')
      }
      callback(this.transformDiscoverresults(result));
    }
  };
  Dashboards.registerQuery("xmlaDiscover", xmlaDiscoverOpts);


})();















