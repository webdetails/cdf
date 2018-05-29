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
  '../Logger',
  '../lib/jquery'
], function(BaseQuery, Dashboard, Utils, Logger, $) {
  "use strict";

  /* global Object */

  var SOLR_CLASS_NAME = "solr";

  var SOLR_DEFAULT_PARAMS = {
    endpoint: "",
    collection: "",
    requestHandler: "select",

    rawQueryParams: "",

    q: "*:*",
    fq: null,
    fl: null,
    df: null,

    start: 0,
    rows: 10,
    wt: "json",

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
  };

  var SOLR_QUERY_PARAMS = Object.keys(SOLR_DEFAULT_PARAMS).filter(function(param) {
    return /^(q|fq|fl|df|start|rows|wt)$/.test(param);
  });

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

    _defaults: SOLR_DEFAULT_PARAMS,
    get defaults() {
      return this._defaults;
    },
    // endregion

    // region Public Methods
    /** @Override */
    init: function(options) {
      if (options.endpoint == null || options.collection == null) {
        throw 'InvalidQuery';
      }

      Object.keys(options)
        .filter(function(name) {
          return Utils.normalizeValue(options[name]) !== null;
        })
        .forEach(function(name) {
          this.setOption(name, options[name]);
        }, this);

      this.setOption("url", this.__buildSolrUrl());
    },

    exportData: function(exportType, overrides, options) {
      options.exportType = exportType;

      if (Utils.normalizeValue(exportType) !== null) {
        this.setOption("wt", exportType);
      }

      var settings = this.getAjaxOptions();
      settings.url = this.getOption('url');
      settings.data = this.buildQueryDefinition(overrides);
      settings.success = this.__exportSuccess.bind(this, options);
      settings.error = this.getErrorHandler(this.getOption('errorCallback').bind(this));

      $.ajax(settings);
    },

    __exportSuccess: function(options, data) {
      var isBlobAvailable = Blob != null;

      if (options.exportType === "json") {
        data = JSON.stringify(data, null, 2);
      }

      var url;
      if (isBlobAvailable) {
        var blob = new Blob([data], {type: "octet/stream"});
        url = window.URL.createObjectURL(blob);
      } else {
        url = this.getOption('url');
      }

      this.__downloadData(url, options);

      if (isBlobAvailable) {
        window.URL.revokeObjectURL(url);
      }
    },

    __downloadData: function(url, options) {
      var link = document.createElement("a");
      var canExportData = link.download != null;

      if (canExportData) {

        // 1. Setup
        link.setAttribute("href", url);
        link.setAttribute("download", this.__getExportDataName(options));
        link.setAttribute("type", this.__getExportMineType(options));

        // 2. Download
        link.setAttribute("style", "visibility: hidden;");
        document.body.appendChild(link);
        link.click();

        // 3. Cleanup
        document.body.removeChild(link);
      } else {
        Logger.warn("Can not export the query data on this browser!");
      }

    },

    /** @Override */
    buildQueryDefinition: function(overrides) {
      overrides = Array.isArray(overrides) ? Utils.propertiesArrayToObject(overrides) : (overrides || {});

      var queryDefinition = {};

      SOLR_QUERY_PARAMS.forEach(function(definition) {
        queryDefinition[definition] = this.__replaceOptionParameters(definition);
      }, this);

      // Raw Query Params
      var rawQueryParameters = this.getOption("rawQueryParams").split("&");
      rawQueryParameters.forEach(function(queryParam) {
        var param = queryParam.split("=");

        if (param != null && param.length === 2) {
          var definition = param[0];

          queryDefinition[definition] = this.__replaceOptionParameters(definition, param[1]);
        }
      }, this);

      // Override
      Object.keys(overrides).filter(function(definition) {
        return Utils.normalizeValue(overrides[definition]) !== null;

      }).forEach(function(definition) {
        queryDefinition[definition] = overrides[definition];

      });

      return queryDefinition;
    },

    __replaceOptionParameters: function(optName, optValue) {
      var parameters = this.getOption("parameters");
      if (optName === "parameters") return parameters;

      optValue = optValue !== undefined ? optValue : this.getOption(optName);
      if (parameters == null || !parameters.length) {
        return optValue;
      }

      parameters.forEach(function(param) {
        var pName = param[0];
        var pValue = param[1];

        try {
          var dashValue = this.dashboard.getParameterValue(pValue);

          if (dashValue !== undefined) {
            pValue = dashValue;
          }
        } catch (ex) {
          // param possibly was the pValue already.
        }

        optValue = this.__replaceParameter(optName, optValue, pName, pValue);
      }, this);

      return optValue;
    },

    __replaceParameter: function(optName, optValue, pName, pValue) {
      var isQueryOption = optName === "q";

      var regx = isQueryOption ? new RegExp("(\\w+)\\:\\$" + pName, "g") : new RegExp("\\$" + pName, "g");

      if (isQueryOption) {
        return optValue.replace(regx, function(match, g1) {
          if (typeof pValue === "string") pValue = pValue.split(/,\s*/);

          var subQuery = pValue.reduce(function(acc, val) {
            var _query = g1 + ":\"" + val + "\"";

            return (!acc ? "" : acc + " OR ") + _query;
          }, "");

          return "(" + subQuery + ")";
        });
      }

      var isArray = Array.isArray(optValue);

      var value =  (isArray ? optValue : [optValue]).map(function(elem) {
        var isString = typeof elem === "string";

        return isString ? elem.replace(regx, pValue) : elem;
      });

      return isArray ? value : value.join(", ");
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
      var columnNames = this.__replaceOptionParameters("schemaColumnNames");
      var columnTypes = this.__replaceOptionParameters("schemaColumnTypes");
      var columnPaths = this.__replaceOptionParameters("schemaColumnPaths");

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

    __getExportMineType: function(options) {
      switch (options.exportType) {
        case "csv":
          return "text/csv";
        case "json":
          return "application/json";
        case "xml":
          return "application/xml";
        default:
          return "text/plain";
      }
    },

    __getExportDataName: function(options) {
      var exportFilename = options.filename;

      if (Utils.normalizeValue(exportFilename) === null) {
        exportFilename = "solr-export." + options.exportType;
      }

      return exportFilename;
    }
    // endregion
  };

  Dashboard.registerGlobalQuery(SOLR_CLASS_NAME, solrQueryOpts);
});
