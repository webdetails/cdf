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

/*
 * Purpose: Provide extensible datasources via Dashboard Addins
 * Author: Andy Grohe
 * Contact: agrohe21@gmail.com
 */

/**
 * Module that holds query related objects.
 *
 * @module Query
 */
define([
  'amd!../lib/xmla',
  './XmlaQuery.ext',
  '../lib/Base',
  './BaseQuery',
  '../dashboard/Dashboard.query',
  '../Logger',
  '../lib/jquery'
], function(Xmla, XmlaQueryExt, Base, BaseQuery, Dashboard, Logger, $) {

  /**
   * Class that will be used by both XML/A and XML/A Discover classes.
   *
   * @class SharedXmla
   * @extends Base
   */
  var SharedXmla = Base.extend({
    xmla: null,
    //cache the datasource as there should be only one xmla server
    datasource: null,
    catalogs: null,

    /**
     * Fetches the available datasources from the server.
     *
     * @method getDataSources
     */
    getDataSources: function() {
      var datasourceCache = [],
          rowset_ds = this.xmla.discoverDataSources();
      if(!rowset_ds) {
        Logger.warn("XML/A DISCOVER_DATASOURCES request failed");
        return;
      }
      if(rowset_ds.hasMoreRows()) {
        datasourceCache = rowset_ds.fetchAllAsObject();
        this.datasource = datasourceCache[0];
        // use DataSourceInfo property with DataSourceName value
        // http://jira.pentaho.com/browse/MONDRIAN-2338
        // http://jira.pentaho.com/browse/MONDRIAN-2263
        var dataSourceName = this.datasource[Xmla.PROP_DATASOURCENAME];
        if(dataSourceName && dataSourceName.length > 0) {
          this.datasource[Xmla.PROP_DATASOURCEINFO] = dataSourceName;
        }
        rowset_ds.close();
      }
    },

    /**
     * Fetches the available catalogs from the server.
     *
     * @method getCatalogs
     */
    getCatalogs: function() {
      var properties = {}, catalog = {};

      if(!this.datasource || !this.datasource[Xmla.PROP_DATASOURCEINFO]) {
        Logger.warn("XML/A DBSCHEMA_CATALOGS request failed, missing " + Xmla.PROP_DATASOURCEINFO);
        return;
      }
      properties[Xmla.PROP_DATASOURCEINFO] = this.datasource[Xmla.PROP_DATASOURCEINFO];

      var rowset_cat = this.xmla.discoverDBCatalogs({properties: properties});
      if(!rowset_cat) {
        Logger.warn("XML/A DISCOVER_DATASOURCES request failed");
        return;
      }
      if(rowset_cat.hasMoreRows()) {
        this.catalogs = [];
        while(catalog = rowset_cat.fetchAsObject()) {
          this.catalogs[this.catalogs.length] = catalog;
        }
        rowset_cat.close();
      }
    },

    /**
     * Executes a XML/A Discover query.
     *
     * @method discover
     * @param queryDefinition Object with the following properties: queryType, catalog, query
     */
    discover: function(queryDefinition) {
      var properties = {},
          //user must pass in a valid XML/A request type for Discover requests (e.g. Xmla.DISCOVER_DATASOURCES)
          qry = queryDefinition.query();

      properties[Xmla.PROP_DATASOURCEINFO] = this.datasource[Xmla.PROP_DATASOURCEINFO];
      if(queryDefinition.catalog) {
        properties[Xmla.PROP_CATALOG] = queryDefinition.catalog;
      }
      var rowset_discover = this.xmla.discover({properties: properties, requestType: qry});
      return rowset_discover;
    },

    /**
     * Executes a XML/A query.
     *
     * @method execute
     * @param queryDefinition Object with the following properties: queryType, catalog, query
     * @throws Error if the catalog is not found in the catalogs array previously retrieved from the server.
     */
    execute: function(queryDefinition) {
      //find the requested catalog in internal array of valid catalogs
      for(var i = 0, j = _sharedXmla.catalogs.length; i < j; i++) {
        if(_sharedXmla.catalogs[i]["CATALOG_NAME"] == queryDefinition.catalog) {
          var properties = {};
          properties[Xmla.PROP_DATASOURCEINFO] = _sharedXmla.datasource[Xmla.PROP_DATASOURCEINFO];
          properties[Xmla.PROP_CATALOG]        = queryDefinition.catalog;
          properties[Xmla.PROP_FORMAT]         = _sharedXmla.PROP_FORMAT || Xmla.PROP_FORMAT_TABULAR; // Xmla.PROP_FORMAT_MULTIDIMENSIONAL;
          var result = this.xmla.execute({
            statement: queryDefinition.query(),
            properties: properties
          });
          return result;
        }
      }
      //should never make it here if queryDefinition.catalog is on server
      throw new Error("Catalog: " + queryDefinition.catalog + " was not found on Pentaho server.");
    }
  });

  var _sharedXmla = new SharedXmla();

  /**
   * Class that represents a XML/A query.
   *
   * @class XmlaQuery
   * @extends BaseQuery
   */
  var xmlaOpts = {
    name: "xmla",
    label: "XML/A Query",
    queryDefinition: {},
    defaults: {
      //defaults to Pentaho's Mondrian servlet. can be overridden in options
      url: XmlaQueryExt.getXmla()
    },

    /**
     * Init method for the XML/A query.
     *
     * @method init
     * @param queryDefinition Object with the following properties: queryType, catalog, query
     */
    init: function(queryDefinition) {
      // store query definition
      this.queryDefinition = $.extend({}, this.getOption('params'), queryDefinition);

      if(_sharedXmla.xmla == null) {
        _sharedXmla.xmla = new Xmla({
          async: false,
          url: this.getOption('url')
        });
      }
      if(_sharedXmla.datasource == null) {
        _sharedXmla.getDataSources();
      }
      if(_sharedXmla.catalogs == null) {
        _sharedXmla.getCatalogs();
      }
    },

    /**
     * Formats the XML/A query result as an object with metadata and resultset properties.
     *
     * @method transformXMLAresults
     * @param results Object with the XML/A query result.
     * @return {{}} Object with the XML/A query metadata and resultset as properties.
     */
    transformXMLAresults: function(results) {
      var rows,
          cols,
          col,
          res = {resultset: [], metadata: []};
      // Xmla.PROP_FORMAT_TABULAR
      if(results instanceof Xmla.Rowset) {
        rows = results.fetchAllAsArray();
        cols = results.getFields();
      }
      // Xmla.PROP_FORMAT_MULTIDIMENSIONAL
      else if(results instanceof Xmla.Dataset) {
        // TODO support multi dimensional datasets
      }

      //build metadata object for each column
      for(var i = 0, j = cols.length; i < j; i++) {
        col = cols[i];
        res.metadata[i] = {colIndex: col.index, colName: col.label};
        switch(col.jsType) {
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

    /**
     * Executes a XML/A query.
     *
     * @method doQuery
     * @param outsideCallback Function to be called with the XML/A query result.
     */
    doQuery: function(outsideCallback) {
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback');

      try {      
        var result = _sharedXmla.execute(this.queryDefinition);
      } catch(e) {
        Logger.error('unable to execute the XML/A query: ' + e + ' :');
      }
      callback(this.transformXMLAresults(result));
    }
  };
  // Registering an object that will be used to create a class, by extending BaseQuery,
  // that will allow to generate new XML/A queries.
  Dashboard.registerGlobalQuery("xmla", xmlaOpts);


  /**
   * Class that represents a XML/A Discover query.
   *
   * @class XmlaQuery
   * @extends BaseQuery
   */
  var xmlaDiscoverOpts = {
    name: "xmlaDiscover",
    label: "XML/A Discover Query",
    queryDefinition: {},
    defaults: {
      //defaults to Pentaho's Mondrian servlet. can be overridden in options
      url: XmlaQueryExt.getXmla()
    },

    /**
     * Init method for the XML/A Discover query.
     *
     * @method init
     * @param queryDefinition Object with the following properties: queryType, catalog, query
     */
    init: function(queryDefinition) {
      // store query definition
      this.queryDefinition = $.extend({}, this.getOption('params'), queryDefinition);

      //lazily load object when needed only
      if(_sharedXmla.xmla == null) {
        _sharedXmla.xmla = new Xmla({
          async: false,
          url: this.getOption('url')
        });
      }
      if(_sharedXmla.datasource == null) {
        _sharedXmla.getDataSources(); //another lazy load
      }
    },

    /**
     * Formats the XML/A Discover query result as an object with metadata and resultset properties.
     *
     * @method transformDiscoverresults
     * @param results Object with the XML/A Discover query result.
     * @return {{}} Object with the XML/A Discover query metadata and resultset as properties.
     */
    transformDiscoverresults: function(results) {
      var cols = results.getFields(),
          col,
          res = {resultset: [], metadata: []};

      //build metadata object for each column
      for(var i = 0, j = cols.length; i < j; i++) {
        col = cols[i];
        res.metadata[i] = {colIndex: col.index, colName: col.label};
        switch(col.jsType) {
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
      //build resultset object, use array of rows as it comes back from xmla.fetchAllAsObject
      res.resultset = results.fetchAllAsArray();
      results.close(); //clear up memory
      //TODO SafeClone?
      return res;
    },

    /**
     * Executes a XML/A Discover query.
     *
     * @method doQuery
     * @param outsideCallback Function to be called with the XML/A Discover query result.
     */
    doQuery: function(outsideCallback) {
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback');

      try {      
        var result = _sharedXmla.discover(this.queryDefinition);
      } catch(e) {
        Logger.error('unable to execute the XML/A Discover query: ' + e + ' :');
      }
      callback(this.transformDiscoverresults(result));
    }
  };

  // Registering an object that will be used to create a class, by extending BaseQuery,
  // that will allow to generate new XML/A Discover queries.
  Dashboard.registerGlobalQuery("xmlaDiscover", xmlaDiscoverOpts);
});
