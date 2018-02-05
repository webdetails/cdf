/*!
 * Copyright 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
    './SolrQuery.ext',
    '../dashboard/Dashboard.query',
    '../Logger'
], function(BaseQuery, SolrQueryExt, Dashboard, Logger) {
  "use strict";

  var SOLR_TYPE = "solr";

  var solrQueryOpts = {
    name: "solr",

    label: "Apache Solr Query",

    defaults: {
      endpoint: SolrQueryExt.getEndpoint(),
      collection: SolrQueryExt.getCollection(),
      solrQuery: "*:*",
      requestHandler: "select",
      responseType: "json",
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
      Logger.log("Apache Solr - Initializing Apache Solr Query");

      Object.keys(options).forEach(function(opt) {
        var value = options[opt] || this.getOption(opt);

        if (value != null) {
          this.setOption(opt, value);
        }
      }, this);

      this.setOption("url", this._buildRequestUrl());
    },

    /** @override */
    buildQueryDefinition: function(/* overrides */) {
      Logger.log("Apache Solr - Building Query Definition");

      return {
        url: this.getOption('url')
      };
    },

    /** @override */
    getSuccessHandler: function(callback) {

      var baseSuccessCallback = this.base(callback);
      var myself = this;

      return function(json) {
        if (!!json.metadata && !!json.resultset) {
          console.log("Received mock data already in correct format!");
          return baseSuccessCallback(json);
        }

        var data = {
          resultset: [],
          metadata: []
        };

        // Transform into CDA format
        var jsonObjects = JSON.parse(json);

        var solrResponse = jsonObjects.response;
        var docList = solrResponse && solrResponse.docs;

        var schema = myself._getSchema();

        // Get Metadata
        schema.columnNames.forEach(function(column, index) {
          data.metadata.push({
            "colName": column,
            "colType": schema.columnTypes[index],
            "colIndex": index
          });
        });

        // Get Resultset
        docList.forEach(function(doc) {
          var row = [];
          schema.columnPaths.forEach(function(path) {
            var value = doc[path];
            row.push(Array.isArray(value) ? value[0] : value);
          });

          data.resultset.push(row);
        });

        baseSuccessCallback(data);
      };
    },

    _getSchema: function() {
      return {
        columnNames: this.getOption("colHeaders"),
        columnTypes: this.getOption("colTypes"),
        columnPaths: this.getOption("colHeaders")  // needs a property of its own, or removed
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


      return endpoint + "/" + collection + "/" + requestHandler + "?" +
        "q=" + solrQuery +
        "wt=" + responseType;
    }
  };


  Dashboard.registerGlobalQuery(SOLR_TYPE, solrQueryOpts);
});
