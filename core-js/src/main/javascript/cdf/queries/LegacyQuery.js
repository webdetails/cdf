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

define([
  '../Logger',
  '../components/XactionComponent.ext',
  './BaseQuery',
  '../dashboard/Dashboard.query',
  'amd!../lib/underscore',
  '../lib/jquery',
  '../dashboard/Utils'
], function(Logger, XactionComponentExt, BaseQuery, Dashboard, _, $, Utils) {

  /**
   * Creates a new metadata object with properties colIndex, colType and colName.
   *
   * @alias makeMetadataElement
   * @memberof cdf.queries.LegacyQuery
   * @param {number} idx  The index of the element.
   * @param {string} name The name of the element.
   * @param {string} type The type of the element.
   * @return {{colIndex: number, colType: string, colName: string}} The metadata object.
   */
  function makeMetadataElement(idx, name, type) {
    return {"colIndex": idx || 0, "colType": type || "String", "colName": name || "Name"};
  }

  /**
   * @class cdf.queries.LegacyQuery
   * @amd cdf/queries/LegacyQuery
   * @classdesc Class that represents a legacy query (calling xactions).
   *            This functionality is deprecated.
   *
   * @deprecated
   */
  var legacyOpts = /** @lends cdf.queries.LegacyQuery# */{
    name: "legacy",
    label: "Legacy Query",
    defaults: {
      url: XactionComponentExt.getCdfXaction("pentaho-cdf/actions", "jtable.xaction"),
      queryDef: {}
    },
    interfaces: {
      lastResultSet: {
        reader: function(json) {
          json = JSON.parse(json);

          var result = {
            metadata: [makeMetadataElement(0)],
            resultset: json.values || []
          };
          _.each(json.metadata, function(el, idx) {
            return result.metadata.push(makeMetadataElement(idx + 1, el));
          });
          return result;
        }
      }
    },

    /**
     * Initializes a legacy query.
     *
     * @param {object} opts The query definition object.
     */
    init: function(opts) {
      this.setOption('queryDef', opts);
    },

    /**
     * Gets the success callback handler for the provided success callback function.
     *
     * @param {function} callback Callback to execute after the query is successful.
     * @return {function} Success callback handler.
     */
    getSuccessHandler: function(callback) {
      var myself = this;
      return function(json) {
        try {
          myself.setOption('lastResultSet', json);
        } catch(e) {
          if(this.async) {
            // async + legacy errors while parsing json response aren't caught
            Logger.error(myself.dashboard.getErrorObj('COMPONENT_ERROR').msg + ":" + e.message);
          } else {
            //exceptions while parsing json response are
            //already being caught+handled in updateLifecycle()
            throw e;
          }
        }
        var clone = $.extend(true, {}, myself.getOption('lastResultSet'));
        myself.setOption('lastProcessedResultSet', clone);
        json = callback(clone);
        if(json !== undefined && json !== clone) {
          myself.setOption('lastProcessedResultSet', json);
        }
      };
    },

    /**
     * Builds the query definition object.
     *
     * @private
     * @param {object} overrides Options that override the existing ones.
     * @return {object} Query definition object.
     */
    buildQueryDefinition: function(overrides) {
      return _.extend({}, this.getOption('queryDef'), overrides);
    }

  };

  Dashboard.registerGlobalQuery("legacy", legacyOpts);
  // TODO: Temporary until CDE knows how to write queryTypes definitions, with all these old queries
  // falling under the 'legacy' umbrella.
  Dashboard.registerGlobalQuery("mdx", legacyOpts);
  Dashboard.registerGlobalQuery("sql", legacyOpts);
});
