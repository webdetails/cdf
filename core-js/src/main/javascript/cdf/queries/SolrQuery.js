/*!
 * Copyright 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  './BaseQuery',
  '../dashboard/Dashboard.query',
  '../dashboard/Utils',
  '../Logger'
], function(BaseQuery, Dashboard, Utils, Logger) {
  "use strict";

  var SOLR_CLASS_NAME = "solr";
  var SOLR_REST_API_PARAMS = {
    solrQuery: "q",
    rowsStart: "start",
    rowsLimit: "rows",
    responseType: "wt"
  };

  /**
   * @class cdf.queries.SolrQuery
   * @summary Class that represents a Solr query.
   *
   * @classdesc <p>Class that represents a Solr query. This class will be registered
   *            globally using the static dashboard function
   *            {@link cdf.dashboard.Dashboard.registerGlobalQuery|registerGlobalQuery}.</p>
   *            <p>The constructor of this class is created dynamically and registered
   *            in the dashboard query container
   *            {@link cdf.dashboard.Dashboard#queryFactories|queryFactories}.</p>
   *            <p>To create a new Solr query use the dashboard function
   *            {@link cdf.dashboard.Dashboard#getQuery|getQuery}.</p>
   *
   * @staticClass
   * @extends cdf.queries.BaseQuery
   *
   * @example
   * dashboard.addDataSource("mySolrQuery", {
   *   queryType:      "solr",
   *
   *   endpoint:       "http://some.domain/solr",
   *   collection:     "solr_collection",
   *
   *   requestHandler: "select",
   *   responseType:   "json",
   *   solrQuery:      "*:*"
   * });
   *
   * dashboard.getQuery({dataSource: "mySolrQuery"}).doQuery(successCallback, errorCallback);
   */
  var solrQueryOpts = /** @lends cdf.queries.SolrQuery# */{
    // region Properties

    /**
     * Gets the Solr Query class name
     *
     * @type {string}
     * @readonly
     */
    _name: SOLR_CLASS_NAME,
    get name() {
      return this._name;
    },

    /**
     * Gets the Solr Query class label.
     *
     * @type {string}
     * @readonly
     */
    _label: "Apache Solr Query",
    get label() {
      return this._label;
    },

    defaults: {
      // Datasource
      endpoint: "",
      collection: "",
      solrQuery: "*:*",

      rowsStart: 0,
      rowsLimit: 10,
      requestHandler: "select",
      responseType: "json",

      // Schema
      schemaColumnNames: [],
      schemaColumnTypes: [],
      schemaColumnPaths: [],

      // Ajax
      ajaxOptions: {
        async: true,
        type: "GET",
        xhrFields: {
          withCredentials: true
        }
      }
    },

    // endregion

    // region Public Methods

    /** @Override */
    init: function(options) {
      if (options.endpoint == null || options.collection == null) {
        throw 'InvalidQuery';
      }

      Object.keys(options || {})
        .filter(function(name) {
          return Utils.normalizeValue(options[name]) !== null;
        })
        .forEach(function(name) {
          this.setOption(name, options[name]);
        }, this);

      this.setOption("url", this.__buildSolrUrl());
    },

    /** @Override */
    buildQueryDefinition: function(overrides) {
      overrides = Array.isArray(overrides) ? Utils.propertiesArrayToObject(overrides) : (overrides || {});

      var overrideParameters = Object.keys(overrides);
      var queryDefinition = {
        start: this.getOption("rowsStart"),
        rows:  this.getOption("rowsLimit"),
        wt:    this.getOption("responseType"),
        q:     this.getOption("solrQuery")
      };

      overrideParameters
        .filter(function(definition) {
          return Utils.normalizeValue(overrides[definition]) !== null;
        })
        .forEach(function(definition) {
          var solrDefinition = this.__getSolrRestApiParam(definition);

          if (!solrDefinition) {
            solrDefinition = definition;
          }

          queryDefinition[solrDefinition] = overrides[definition];
        }, this);

      return queryDefinition;
    },

    /** @Override */
    getSuccessHandler: function(callback) {
      var baseSuccessCallback = this.base(callback);
      var myself = this;

      return function solrAjaxSuccessHandler(jsonString) {
        // Transform into CDA format
        var jsonObjects = null;

        try {
          jsonObjects = JSON.parse(jsonString);
        } catch (parseException) {
          Logger.error('Could not parse json result ' + jsonString, parseException);
        }

        var metadata = [];
        var resultset = [];
        var queryInfo = {};

        if (jsonObjects) {
          var solrResponse = jsonObjects.response;
          var docList = solrResponse ? solrResponse.docs : [];

          var schema = myself.__buildSchema();

          // Get Query Info
          queryInfo.totalRows = String(docList.length);

          // Get Metadata
          metadata = schema.columnNames.map(function(colName, colIndex) {
            var colType = schema.columnTypes[colIndex];

            return {
              colName: colName,
              colType: colType,
              colIndex: colIndex
            };
          });

          // Get Resultset
          resultset = docList.map(function(doc) {
            return schema.columnPaths.map(function(path) {
              return myself.__search(doc, path);
            });
          });
        }

        // Result in CDA format
        baseSuccessCallback({
          metadata: metadata,
          resultset: resultset,
          queryInfo: queryInfo
        });
      };
    },

    // endregion

    // region Private Methods

    /**
     * Search in a Solr document for the value defined by {@code path}.
     *
     * @param {object} doc  - Solr document.
     * @param {string} path - Path to a Solr document field.
     *
     * @return {?any} The document's field value.
     *
     * @private
     */
    __search: function(doc, path) {
      var value = doc[path];

      if (Array.isArray(value)) {
        value = value[0];
      }

      return value !== undefined ? value : null;
    },

    /**
     * Build a schema based on user provided information,
     * to use in the conversion of the result set, from Solr to CDA format.
     *
     * @return {{columnNames: Array.<string>, columnTypes: Array.<string>, columnPaths: Array.<string>}}
     *         The schema to convert from Solr to CDA format.
     *
     * @private
     */
    __buildSchema: function() {
      var columnNames = this.getOption("schemaColumnNames");
      var columnTypes = this.getOption("schemaColumnTypes");
      var columnPaths = this.getOption("schemaColumnPaths");

      return {
        columnNames: columnNames,
        columnTypes: columnTypes,
        columnPaths: !columnPaths.length ? columnNames : columnPaths
      };
    },

    /**
     * Builds the {@link URL} to request data from a Apache Solr Service.
     *
     * @return {string} The solr request url.
     *
     * @private
     */
    __buildSolrUrl: function() {
      var endpoint = this.getOption("endpoint");
      if ( endpoint.endsWith('/') ) {
        endpoint = endpoint.slice(0, -1);
      }

      var collection = this.getOption("collection");
      var requestHandler = this.getOption("requestHandler");

      return endpoint + "/" + collection + "/" + requestHandler;
    },

    __getSolrRestApiParam: function(definition) {
      var param = SOLR_REST_API_PARAMS[definition];

      return param != null ? param : definition;
    }

    // endregion
  };

  Dashboard.registerGlobalQuery(SOLR_CLASS_NAME, solrQueryOpts);
});
