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

define([], function() {

  "use strict";

  return {
    /**
     * Gets the Apache Solr Service Endpoint
     *
     * @return {string} the Solr Endpoint
     */
    getEndpoint: function() {
      return "http://172.20.43.56:8983/solr";
    },

    /**
     * Gets the Apache Solr Service Collection
     *
     * @return {string} the Solr Collection
     */
    getCollection: function() {
      return "tenis";
    }
  };

});
