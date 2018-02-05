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
    '../Logger',
    'amd!../lib/lodash'
], function(BaseQuery, SolrQueryExt, Dashboard, Logger,_) {
  "use strict";

  var SOLR_TYPE = "solr";

  var solrQueryOpts = {
    name: "solr",

    label: "Apache Solr Query",

    defaults: {
      endpoint: SolrQueryExt.getEndpoint(),
      collection: SolrQueryExt.getCollection(),
      successCallback: function (data) {
        console.log("i'm here: ",data);
      },
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

      var endpoint = options.endpoint !== null ? options.endpoint : this.getOption("endpoint");
      var collection = options.collection !== null ? options.collection : this.getOption("collection");
      var requestHandler = options.requestHandler !== null ? options.requestHandler : this.getOption("requestHandler");
      var responseType = options.responseType !== null ? options.responseType : this.getOption("responseType");
      var solrQuery = options.solrQuery !== null ? options.solrQuery : this.getOption("solrQuery");

      if ( !endpoint.endsWith('/') ) {
        endpoint = endpoint + "/";
      }

      this.setOption( 'url', endpoint + collection + '/' + requestHandler + '?q=' + solrQuery + '&wt=' + responseType);
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

      return function(json) {

        // Transform into CDA format
        var jsonObjects = JSON.parse(json);
        var soltResponse = jsonObjects.response;
        var docs = soltResponse.docs;

        /*
         *  TODO: This is a mock schema, replace with real schema from CDE editor
         **/
        var cdeSchema = {
          "columnNames":[
            "Winner",
            "WRank",
            "nested"
          ],
          "columnTypes":[
            "string",
            "int",
            "int"
          ],
          "columnPaths":[
            "Winner",
            "WRank",
            "nested.element.very.deep"
          ]
        }


        var cdaData = {
          "resultset":[],
          "metadata":[]
        }

        // Get Metadata
        var colIndex = 0;
        cdeSchema.columnNames.forEach(function(elem, index){
          var metadataRow = {
            "colName": elem,
            "colType": cdeSchema.columnTypes[index],
            "colIndex": colIndex++
          }
          cdaData.metadata.push(metadataRow);
        });

        // Get Resultset
        docs.forEach(function(docElem, docIndex){
          var docRow = [];
          cdeSchema.columnPaths.forEach(function(keyElem, keyIndex){
            var elem = docElem[keyElem];
            //deal with nesting
            if(elem === undefined){
              elem = _.get(docElem, keyElem);
            }
            docRow.push(Array.isArray(elem) ? elem[0] : elem)
          });
          cdaData.resultset.push(docRow);
        });


        // console.log(cdaData); // TODO: Delete, was used for debugging
        baseSuccessCallback(cdaData);
      };
    }
  };


  Dashboard.registerGlobalQuery(SOLR_TYPE, solrQueryOpts);
});
