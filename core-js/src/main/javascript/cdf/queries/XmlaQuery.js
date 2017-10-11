/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
   * @class cdf.queries.SharedXmla
   * @summary Helper class used by both XML/A and XML/A Discover query classes.
   * @classdesc Helper class used by both XML/A and XML/A Discover query classes.
   * @private
   */
  var SharedXmla = Base.extend(/** @lends cdf.queries.SharedXmla# */{
    /**
     * @summary The XML/A `object`.
     * @description The XML/A `object`.
     *
     * @type {object}
     * @protected
     * @default null
     */
    xmla: null,

    /**
     * @summary The target data source.
     * @description The target data source. Serves as cache,
     *              as there should be only one XML/A server.
     *
     * @type {object}
     * @protected
     * @default null
     */
    datasource: null,

    /**
     * @summary The array of available catalogs.
     * @description The array of available catalogs.
     *
     * @type {Array<object>}
     * @protected
     * @default null
     */
    catalogs: null,

    /**
     * @summary Fetches the available data sources from the server.
     * @description Fetches the available data sources from the server.
     *              Stores the first retrieved data source at
     *              {@link cdf.queries.SharedXmla#datasource|datasource}
     *              as there should be only one XML/A server.
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
     * @summary Fetches the available catalogs from the server.
     * @description Fetches the available catalogs from the server and stores
     *              them at {@link cdf.queries.SharedXmla#catalogs|catalogs}.
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
     * @summary Executes an XML/A Discover query.
     * @description Executes an XML/A Discover query.
     *
     * @param {object}   queryDefinition           An object containing the query definitions.
     * @param {string}   queryDefinition.queryType The type of query.
     * @param {string}   queryDefinition.catalog   The target catalog.
     * @param {function} queryDefinition.query     The query to execute.
     * @return {Object} The XML/A Discover query result.
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
     * @summary Executes an XML/A query.
     * @description Executes an XML/A query.
     *
     * @param {object}   queryDefinition           An object containing the query definitions.
     * @param {string}   queryDefinition.queryType The type of query.
     * @param {string}   queryDefinition.catalog   The target catalog.
     * @param {function} queryDefinition.query     The query to execute.
     * @return {Object} The XML/A query result.
     * @throws {Error} If the catalog is not found in the catalogs array previously retrieved from the server.
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

  /**
   * @summary The {@link cdf.queries.SharedXmla|SharedXmla} instance.
   * @description The {@link cdf.queries.SharedXmla|SharedXmla} instance.
   *
   * @type {cdf.queries.SharedXmla}
   * @private
   */
  var _sharedXmla = new SharedXmla();

  /**
   * @class cdf.queries.XmlaQuery
   * @summary Class that represents an XML/A query.
   * @classdesc <p>Class that represents an XML/A query. This class will be registered
   *            globally using the static dashboard function
   *            {@link cdf.dashboard.Dashboard.registerGlobalQuery|registerGlobalQuery}.</p>
   *            <p>The constructor of this class is created dynamically and registered
   *            in the dashboard query container
   *            {@link cdf.dashboard.Dashboard#queryFactories|queryFactories}.</p>
   *            <p>To create a new XML/A query, use the dashboard function
   *            {@link cdf.dashboard.Dashboard#getQuery|getQuery}.</p>
   * @staticClass
   * @extends cdf.queries.BaseQuery
   * @example
   * dashboard.addDataSource("myXmlaQuery", {queryType: "xmla", ...});
   * dashboard.getQuery({dataSource: "myXmlaQuery"}).doQuery(successCallback, errorCallback);
   */
  var xmlaOpts = /** @lends cdf.queries.XmlaQuery# */{
    /**
     * @summary The class name.
     * @description The class name.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "xmla"
     */
    name: "xmla",

    /**
     * @summary The class label.
     * @description The class label.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "XML/A Query"
     */
    label: "XML/A Query",

    /**
     * @summary The query definition `object`.
     * @description The query definition `object`.
     *
     * @type {Object}
     * @default {}
     * @protected
     */
    queryDefinition: {},

    /**
     * @summary The default properties.
     * @description The default properties.
     *
     * @type {Object}
     * @property {string} url The target URL.
     * @protected
     */
    defaults: {
      //defaults to Pentaho's Mondrian servlet. can be overridden in options
      url: XmlaQueryExt.getXmla()
    },

    /**
     * @summary Initializes an XML/A query.
     * @description Initializes an XML/A query.
     *
     * @param {object}   queryDefinition           An object containing the query definitions.
     * @param {string}   queryDefinition.queryType The type of query.
     * @param {string}   queryDefinition.catalog   The target catalog.
     * @param {function} queryDefinition.query     The query to execute.
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
     * @summary Formats the XML/A query result as an object with metadata and resultset properties.
     * @description Formats the XML/A query result as an object with metadata and resultset properties.
     *
     * @param {object} results The XML/A query result.
     * @return {object} The XML/A query metadata and resultset as properties.
     */
    transformXMLAResults: function(results) {
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
     * @summary Executes the query and processes the result.
     * @description Executes {@link cdf.queries.XmlaQuery#_executeQuery|_executeQuery} and
     *              {@link cdf.queries.XmlaQuery#transformXMLAResults|transformXMLAResults}
     *              before finally persisting the original and the processed results of the
     *              XML/A query.
     *
     * @param {function} outsideCallback Function to be called with the XML/A query result.
     */
    doQuery: function(outsideCallback) {
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback');

      try {      
        var result = this.transformXMLAResults(this._executeQuery());
        this.setOption('lastResultSet', result);

        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        this.setOption('lastProcessedResultSet', clone);
        result = callback(clone);
        if(result !== undefined && result !== clone) {
          this.setOption('lastProcessedResultSet', result);
        }
      } catch(e) {
        Logger.error('unable to execute the XML/A query: ' + e + ' :');
      }
    },

    /**
     * @summary Executes an XML/A query.
     * @description Executes an XML/A query.
     *
     * @return {object} The XML/A query execution result.
     * @private
     */
    _executeQuery: function() {
      return _sharedXmla.execute(this.queryDefinition);
    }
  };
  // Registering an object that will be used to create a class, by extending BaseQuery,
  // that will allow to generate new XML/A queries.
  Dashboard.registerGlobalQuery("xmla", xmlaOpts);

  /**
   * @class cdf.queries.XmlaDiscoverQuery
   * @summary Class that represents an XML/A Discover query.
   * @classdesc <p>Class that represents an XML/A Discover query. This class will be registered
   *            globally using the static dashboard function
   *            {@link cdf.dashboard.Dashboard.registerGlobalQuery|registerGlobalQuery}.</p>
   *            <p>The constructor of this class is created dynamically and registered
   *            in the dashboard query container
   *            {@link cdf.dashboard.Dashboard#queryFactories|queryFactories}.</p>
   *            <p>To create a new XML/A Discover query use the dashboard function
   *            {@link cdf.dashboard.Dashboard#getQuery|getQuery}.</p>
   * @staticClass
   * @extends cdf.queries.BaseQuery
   * @example
   * dashboard.addDataSource("myXmlaDiscQuery", {queryType: "xmlaDiscover", ...});
   * dashboard.getQuery({dataSource: "myXmlaDiscQuery"}).doQuery(successCallback, errorCallback);
   */
  var xmlaDiscoverOpts = /** @lends cdf.queries.XmlaDiscoverQuery# */{
    /**
     * @summary The class name.
     * @description The class name.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "xmlaDiscover"
     */
    name: "xmlaDiscover",

    /**
     * @summary The class label.
     * @description The class label.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "XML/A Discover Query"
     */
    label: "XML/A Discover Query",

    /**
     * @summary The query definition `object`.
     * @description The query definition `object`.
     *
     * @type {Object}
     * @default {}
     * @protected
     */
    queryDefinition: {},

    /**
     * @summary The default properties.
     * @description The default properties.
     *
     * @type {Object}
     * @property {string} url The target URL.
     * @protected
     */
    defaults: {
      //defaults to Pentaho's Mondrian servlet. can be overridden in options
      url: XmlaQueryExt.getXmla()
    },

    /**
     * @summary Initializes an XML/A Discover query.
     * @description Initializes an XML/A Discover query.
     *
     * @param {object}   queryDefinition           An object containing the query definitions.
     * @param {string}   queryDefinition.queryType The type of query.
     * @param {string}   queryDefinition.catalog   The target catalog.
     * @param {function} queryDefinition.query     The query to execute.
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
     * @summary Formats the XML/A Discover query result.
     * @description Formats the XML/A Discover query result as an object with metadata and resultset properties.
     *
     * @param {object} results Object with the XML/A Discover query result.
     * @return {object} The XML/A Discover query metadata and resultset as properties.
     */
    transformXMLADiscoverResults: function(results) {
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
     * @summary Executes the query and processes the result.
     * @description Executes {@link cdf.queries.XmlaDiscoverQuery#_executeDiscoverQuery|_executeDiscoverQuery} and
     *              {@link cdf.queries.XmlaDiscoverQuery#transformXMLADiscoverResults|transformXMLADiscoverResults}
     *              before finally persisting the original and the processed results of the XML/A query.
     *
     * @param {function} outsideCallback Function to be called with the XML/A query result.
     */
    doQuery: function(outsideCallback) {
      var url = this.getOption('url'),
          callback = (outsideCallback ? outsideCallback : this.getOption('successCallback')),
          errorCallback = this.getOption('errorCallback');

      try {      
        var result = this.transformXMLADiscoverResults(this._executeDiscoverQuery());
        this.setOption('lastResultSet', result);

        var clone = $.extend(true, {}, this.getOption('lastResultSet'));
        this.setOption('lastProcessedResultSet', clone);
        result = callback(clone);
        if(result !== undefined && result !== clone) {
          this.setOption('lastProcessedResultSet', result);
        }
      } catch(e) {
        Logger.error('unable to execute the XML/A query: ' + e + ' :');
      }
    },

    /**
     * @summary Executes an XML/A discover query.
     * @description Executes an XML/A discover query.
     *
     * @return {object} The XML/A discover query execution result.
     * @private
     */
    _executeDiscoverQuery: function() {
      return _sharedXmla.discover(this.queryDefinition);
    }
  };

  // Registering an object that will be used to create a class, by extending BaseQuery,
  // that will allow to generate new XML/A Discover queries.
  Dashboard.registerGlobalQuery("xmlaDiscover", xmlaDiscoverOpts);
});
