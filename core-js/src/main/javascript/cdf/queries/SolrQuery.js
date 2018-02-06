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

  var SOLR_TYPE = "solr";

  var solrQueryOpts = {
    name: "solr",

    label: "Apache Solr Query",

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

    // ---- methods

    /** @override */
    init: function(options) {
      Object.keys(options).forEach(function(opt) {
        var value = options[opt] || this.getOption(opt);

        if (value != null && value.length > 0) {
          this.setOption(opt, value);
        }
      }, this);

      this.setOption("url", this._buildRequestUrl());
    },

    /** @override */
    buildQueryDefinition: function(overrides) {
      return {
        // Datasource
        endpoint: this.getOption('endpoint'),
        collection: this.getOption('collection'),

        solrQuery: this.getOption('solrQuery'),
        requestHandler: this.getOption('requestHandler'),
        responseType: this.getOption('responseType'),

        // Schema
        sColumnNames: this.getOption('sColumnNames'),
        sColumnTypes: this.getOption('sColumnTypes'),
        sColumnPaths: this.getOption('sColumnPaths'),

        url: this.getOption('url')
      };
    },

    /** @override */
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
        var data = {
          resultset: [],
          metadata: [],
          queryInfo: {}
        };

        if (jsonObjects) {
          var solrResponse = jsonObjects.response;
          var docList = solrResponse && solrResponse.docs;

          var schema = myself._getSchema();

          // Fill Query Info
          data.queryInfo.totalRows = String(schema.columnNames.length);

          // Get Metadata
          schema.columnNames.forEach(function(name, column) {
            data.metadata.push({
              "colName": name,
              "colType": schema.columnTypes[column],
              "colIndex": column
            });
          });

          // Get Resultset
          docList.forEach(function(doc, row) {
            data.resultset.push([]);

            schema.columnPaths.forEach(function(path) {
              var value = myself._search(doc, path);

              data.resultset[row].push(value);
            });
          });
        }

        baseSuccessCallback(data);
      };
    },

    _search: function(doc, path) {
      var value = doc[path];

      if (Array.isArray(value)) {
        value = value[0];
      }

      return value !== undefined ? value : null;
    },

    _getSchema: function() {

      var columnNames = this.getOption("sColumnNames");
      var columnTypes = this.getOption("sColumnTypes");
      var columnPaths = this.getOption("sColumnPaths");

      return {
        columnNames: columnNames,
        columnTypes: columnTypes,
        columnPaths: !columnPaths.length ? columnNames : columnPaths
      };
    },

    _buildRequestUrl: function() {
      var endpoint = this.getOption("endpoint");
      if ( endpoint.endsWith('/') ) {
        endpoint = endpoint.slice(0, -1);
      }

      var collection = this.getOption("collection");
      var requestHandler = this.getOption("requestHandler");
      var solrQuery = this.getOption("solrQuery");
      var responseType = this.getOption("responseType");


      return endpoint + "/" + collection + "/" + requestHandler +
        "?q=" + solrQuery +
        "&wt=" + responseType;
    }
  };

  Dashboard.registerGlobalQuery(SOLR_TYPE, solrQueryOpts);
});
