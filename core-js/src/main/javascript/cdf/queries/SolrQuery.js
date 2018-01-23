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
      ajaxOptions: {
        async: true,
        xhrFields: {
          withCredentials: true
        }
      }
    },

    // ---- methods

    /** @override */
    init: function(options) {
      Logger.log("Apache Solr - Initializing Apache Solr Query");

      var endpoint = options.endpoint != null ? options.endpoint : this.getOption("endpoint");
      var collection = options.collection != null ? options.collection : this.getOption("collection");

      if ( !endpoint.endsWith('/') ) {
        endpoint = endpoint + "/";
      }

      this.setOption( 'url', endpoint + collection );
    },

    /** @override */
    buildQueryDefinition: function(/* overrides */) {
      Logger.log("Apache Solr - Building Query Definition");

      return {
        url: this.getOption('url')
      };
    }
  };

  Dashboard.registerGlobalQuery(SOLR_TYPE, solrQueryOpts);
});
