/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define(['amd!../lib/underscore', '../lib/jquery'], function(_, $) {

  /**
   * @class cdf.dashboard.Query
   * @amd cdf/dashboard/Query
   * @summary The Query class allows generating query instances.
   * @classdesc The Query class allows generating query instances and is included here mainly for legacy reasons.
   *
   * @summary Builds a new Query object by calling {@link cdf.dashboard.Dashboard#getQuery|getQuery}.
   * @description <p>Builds a new Query instance by calling {@link cdf.dashboard.Dashboard#getQuery|getQuery}.
   *              It creates a new query type based on the query type, determined within the constructor, and
   *              the query definition. </p>
   * @deprecated
   * @param {string|object} cd             Path to the server-side query or a chart definition object.
   * @param {string}        dataAccessId The data access identifier.
   * @param {object}        dashboard      The dashboard from which the query will be generated.
   * @throws {InvalidQuery} If an invalid query type is detected.
   */

  // NOTE: The query type detection code should be kept in sync with CGG's UnmanagedComponent#detectQueryType.
  return function(cd, dataAccessId, dashboard) {

    var opts, queryType;

    if(_.isObject(cd)) {
      opts = $.extend(true, {}, cd);
      queryType = (_.isString(cd.queryType) && cd.queryType) || ( !_.isUndefined(cd.query) && 'legacy') ||
        (!_.isUndefined(cd.path) && !_.isUndefined(cd.dataAccessId) && 'cda') || undefined;
    } else if(_.isString(cd) && _.isString(dataAccessId)) {
      queryType = 'cda';
      opts = {
        path: cd,
        dataAccessId: dataAccessId
      };
    }

    if(!queryType) { throw 'InvalidQuery'; }

    return dashboard.getQuery(queryType, opts);
  };
});
