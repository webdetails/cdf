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
  './SolrQuery.ext'
], function(BaseQuery, Dashboard, SolrQueryExt) {
  "use strict";

  var SOLR_CLASS_NAME = "solr";
  var SOLR_CLASS_LABEL = "Apache Solr Query";

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
    _label: SOLR_CLASS_LABEL,
    get label() {
      return this._label;
    },

    defaults: {
      // Datasource
      endpoint: SolrQueryExt.getEndpoint(),
      collection: SolrQueryExt.getCollection(),

      solrQuery: "*:*",
      requestHandler: "select",
      responseType: "json",

      // Schema
      sColumnNames: [],
      sColumnTypes: [],
      sColumnPaths: [],

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
      Object.keys(options).forEach(function(opt) {
        var value = options[opt] || this.getOption(opt);

        if (value != null && value.length > 0) {
          this.setOption(opt, value);
        }
      }, this);

      this.setOption("url", this.__buildSolrUrl());
    },

    /** @Override */
    buildQueryDefinition: function(overrides) {
      return {
        start: 0,
        rows:  this.getOption("rowsLimit"),
        wt:    this.getOption('responseType'),
        q:     this.getOption('solrQuery')
      };
    },

    /** @Override */
    getSuccessHandler: function(callback) {
      var baseSuccessCallback = this.base(callback);
      var myself = this;

      return function(json) {
        // Transform into CDA format
        var jsonObjects = null;

        try {
          jsonObjects = JSON.parse(json);
        } catch (parseException) {
          if (!!json.metadata && !!json.resultset) {
            return baseSuccessCallback(json);
          }
        }

        // Result in CDA format
        var data = { resultset: [], metadata: [], queryInfo: {} };

        if (jsonObjects) {
          var solrResponse = jsonObjects.response;
          var docList = solrResponse ? solrResponse.docs : [];

          var schema = myself.__buildSchema();

          // Get Query Info
          data.queryInfo = { totalRows: String(docList.length) };

          // Get Metadata
          schema.columnNames.forEach(function(name, column) {
            data.metadata.push({
              "colName": name,
              "colType": schema.columnTypes[column],
              "colIndex": column
            });
          });

          // Get Resultset
          docList.forEach(function(doc) {
            var row = [];

            schema.columnPaths.forEach(function(path) {
              row.push(myself.__search(doc, path));
            });

            data.resultset.push(row);
          });
        }

        baseSuccessCallback(data);
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
     * @return {?any} the document's field value.
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
     * @return {{columnNames: Array.<String>, columnTypes: Array.<String>, columnPaths: Array.<String>}}
     *         the schema to convert from Solr to CDA format.
     *
     * @private
     */
    __buildSchema: function() {
      var columnNames = this.getOption("sColumnNames");
      var columnTypes = this.getOption("sColumnTypes");
      var columnPaths = this.getOption("sColumnPaths");

      return {
        columnNames: columnNames,
        columnTypes: columnTypes,
        columnPaths: !columnPaths.length ? columnNames : columnPaths
      };
    },

    /**
     * Builds the {@link URL} to request data from a Apache Solr Service.
     *
     * @return {String} the solr request url.
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
    }

    // endregion
  };

  Dashboard.registerGlobalQuery(SOLR_CLASS_NAME, solrQueryOpts);
});
