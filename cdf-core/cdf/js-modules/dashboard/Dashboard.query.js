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

  var _BaseQuery = Base;
  
  var globalQueryFactories = new Container();
     
  /**
   * A module representing a extension to Dashboard module for i18n.
   * @module Dashboard.query
   */
  Dashboard.implement({

    /**
     * Method used by the Dashboard constructor for query initialization
     * Reference to current language code . 
     *
     * @method _initQuery
     *
     * @for Dashboard
     * @private
     */
    _initQuery: function() {
      this.queryFactories = Utils.clone(globalQueryFactories);
    },

    /**
     * Gets the base query object, from where other query types can be extended
     *
     * @method getBaseQuery
     * @return {*} the base query object
     *
     * @for Dashboard
     */
    getBaseQuery: function() {
      return _BaseQuery;
    },

    /**
     * Registers a new query for the dashboard
     *
     * @method registerQuery
     * @param type Query type
     * @param query Query object
     *
     * @for Dashboard
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
     * Determines if a given query type is registered in the current dashboard
     *
     * @method hasQuery
     * @param type query type
     * @return {boolean} _true_ if the query type has been registered for this dashboard
     *
     * @for Dashboard
     */
    hasQuery: function(type) {
      return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
    },

    /**
     * Given a query definition object, returns its query type
     *
     * @method detectQueryType
     * @param qd - Query definition object
     * @return {queryType} Query type associated with the query definition object
     *
     * @for Dashboard
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
     * @method getQuery
     * @param type Query type
     * @param opts Options object
     * @return {*} the query object
     *
     * @for Dashboard
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
     * Lists the registered query types in this dashboard
     *
     * @method listQueries
     * @return {Array} Array of registered query types
     *
     * @for Dashboard
     */
    listQueries: function() {
      return _.keys(this.queryFactories.listType('Query'));
    }
  });

  /**
   * Helper object for registering and setting queries.
   * @class DashboardQuery
   *
   */
  return {

    /**
     * Sets the base query object
     *
     * @method setBaseQuery
     * @param QueryClass Base query object
     *
     * @for DashboardQuery
     * @static
     */
    setBaseQuery: function(QueryClass) {
      if(_.isFunction(QueryClass) && QueryClass.extend) {
        _BaseQuery = QueryClass;
      }
    },

    /**
     * Register a globally available query.
     *
     *
     * @method registerGlobalQuery
     * @param type Query type
     * @param query Query object that represents that query type
     *
     * @static
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
