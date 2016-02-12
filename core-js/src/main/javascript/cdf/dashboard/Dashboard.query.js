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
  '../lib/Base',
  './Dashboard',
  './Container',
  'amd!../lib/underscore',
  './Utils'
], function(Logger, Base, Dashboard, Container, _, Utils) {

  /**
   * The base query object, from where other query types can be extended.
   *
   * @type {Object}
   * @alias cdf.dashboard.Dashboard~_BaseQuery
   * @ignore
   */
  var _BaseQuery = Base;

  /**
   * Object used for generating new query objects.
   *
   * @type {Object}
   * @alias cdf.dashboard.Dashboard~globalQueryFactories
   * @ignore
   */
  var globalQueryFactories = new Container();

  /**
   * @class cdf.dashboard.Dashboard.query
   * @amd cdf/dashboard/Dashboard.query
   * @classdesc A class representing an extension to the Dashboard class for managing queries.
   *            Its methods allow registering and setting queries.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * Method used by the dashboard's constructor for query initialization.
     * Reference to current language code.
     *
     * @private
     */
    _initQuery: function() {
      this.queryFactories = Utils.clone(globalQueryFactories);
    },

    /**
     * Gets the base query object, from where other query types can be extended.
     *
     * @return {Object} the base query object
     */
    getBaseQuery: function() {
      return _BaseQuery;
    },

    /**
     * Registers a new query for the dashboard.
     *
     * @param {string} type  The query type.
     * @param {Object} query The query object.
     */
    registerQuery: function(type, query) {
      var BaseQuery = this.getBaseQuery();

      // Goes a level deeper one extending these properties. Useful to preserve defaults and
      // options interfaces from BaseQuery.
      if(!_.isFunction(query) && _.isObject(query)) {
        var deepProperties = {};
        _.each(BaseQuery.prototype.deepProperties, function(prop) {
          deepProperties[prop] = _.extend({}, BaseQuery.prototype[prop], query[prop]);
        });
      }

      var QueryClass = (_.isFunction(query) && query) || 
        (_.isObject(query) && BaseQuery.extend(_.extend({}, query, deepProperties)));

      // Registers a new query factory with a custom class
      this.queryFactories.register('Query', type, function(container, config) {
        return new QueryClass(config);
      });
    },

    /**
     * Determines if a given query type is registered in the current dashboard.
     *
     * @param {string} type The query type.
     * @return {boolean} _true_ if the query type has been registered for this dashboard.
     */
    hasQuery: function(type) {
      return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
    },

    /**
     * Given a query definition object, returns its query type.
     *
     * @param {Object} qd The query definition object.
     * @return {string} The query type associated with the query definition object provided.
     */
    detectQueryType: function(qd) {
      if(qd) {
        // check if we should use a data source
        if(_.isString(qd.dataSource) && !_.isEmpty(qd.dataSource)) {
          var ds = this.getDataSource(qd.dataSource);
          if(!_.isUndefined(ds)) {
            qd = ds;
          } else {
            Logger.error("Invalid data source name '" + qd.dataSource + "'");
            return;
          }
        }

        var qt = qd.queryType          ? qd.queryType : // cpk goes here
          qd.query                     ? 'legacy'     :
          (qd.path && qd.dataAccessId) ? 'cda'        :
          undefined;

        // update query type value
        qd.queryType = qt;

        return this.hasQuery(qt) ? qt : undefined;
      }
    },

    /**
     * Given a type and options, returns the query object for running that particular query.
     * If a data source name is provided as an option, also include all options from it.
     *
     * @param {string|Object} type   The query type or an object containing the query definitions.
     * @param {Object}        [opts] An object containing the query options.
     * @return {Object} The query object.
     */
    getQuery: function(type, opts) {
      if(_.isUndefined(type)) {
        type = 'cda';
      } else if(_.isObject(type)) {
        opts = type;
        type = undefined;
      }

      // check if we should use a data source
      if(_.isString(opts.dataSource) && !_.isEmpty(opts.dataSource)) {
        var ds = this.getDataSource(opts.dataSource);
        if(!_.isUndefined(ds)) {
          // merge options, query definition options override options duplicated in the data source
          opts = _.extend({}, ds, opts);
          // remove the data source name from the query definition
          delete opts.dataSource;
        } else {
          Logger.error("Invalid data source name '" + qd.dataSource + "'");
          return;
        }
      }

      type = type || opts.queryType || 'cda';

      var query = this.queryFactories.getNew('Query', type, opts);
      query.dashboard = this;

      return query;
    },

    /**
     * Tests if a query definition is valid or not.
     *
     * @param {Object} queryDefinition The query definition object.
     * @return {boolean} _true_ if the query definition is valid.
     */
    isValidQueryDefinition: function(queryDefinition) {
      return this.detectQueryType(queryDefinition) !== undefined;
    },

    /**
     * Lists the registered query types in this dashboard.
     *
     * @return {string[]} An array containing the registered query types.
     */
    listQueries: function() {
      return _.keys(this.queryFactories.listType('Query'));
    }
  });

  return /** @lends cdf.dashboard.Dashboard.query */ {

    /**
     * Sets the base query object.
     *
     * @param {Object} QueryClass The base query object.
     */
    setBaseQuery: function(QueryClass) {
      if(_.isFunction(QueryClass) && QueryClass.extend) {
        _BaseQuery = QueryClass;
      }
    },

    /**
     * Register a globally available query.
     *
     * @param {string} type  The query type.
     * @param {Object} query The query object.
     */
    registerGlobalQuery: function(type, query) {
      var BaseQuery = _BaseQuery;

      // Goes a level deeper one extending these properties. Useful to preserve defaults and
      // options interfaces from BaseQuery.
      if(!_.isFunction(query) && _.isObject(query)) {
        var deepProperties = {};
        _.each(BaseQuery.prototype.deepProperties, function(prop) {
          deepProperties[prop] = _.extend({}, BaseQuery.prototype[prop], query[prop]);
        });
      }

      var QueryClass = (_.isFunction(query) && query) || 
        (_.isObject(query) && BaseQuery.extend(_.extend({}, query, deepProperties)));

      // Registers a new query factory with a custom class
      globalQueryFactories.register('Query', type, function(container, config) {
        return new QueryClass(config);
      });
    }
  };
});
