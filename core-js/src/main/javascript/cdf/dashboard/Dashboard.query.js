/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
   * @summary The base query object, from where other query types can be extended.
   * @description The base query object, from where other query types can be extended.
   *
   * @type {cdf.queries.BaseQuery}
   * @alias cdf.dashboard.Dashboard~_BaseQuery
   * @private
   */
  var _BaseQuery = Base;

  /**
   * @summary Object used for generating new query objects.
   * @description Object used for generating new query objects. 
   *
   * @type {Object}
   * @alias cdf.dashboard.Dashboard~globalQueryFactories
   * @private
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
     * @summary Method used by the dashboard's constructor for query initialization.
     * @description Method used by the dashboard's constructor for query initialization. It clones the global queries
     *              to the queries of this instance of Dashboard. 
     *
     * @private
     */
    _initQuery: function() {
      this.queryFactories = Utils.clone(globalQueryFactories);
    },

    /**
     * @summary Gets the base query object constructor, from where other query types can be extended.
     * @description Gets the base query object constructor, from where other query types can be extended. 
     *
     * @return {cdf.queries.BaseQuery} the base query constructor
     */
    getBaseQuery: function() {
      return _BaseQuery;
    },

    /**
     * @summary Registers a new query constructor for the dashboard from a given _type_.
     * @description <p>Register a {@link cdf.queries.BaseQuery|BaseQuery} constructor globally.</p>
     *              <p>If the query argument is a simple query object and not a constructor, 
     *              it copies all the deepProperties from the {@link cdf.queries.BaseQuery|BaseQuery}
     *              to the _deepProperties_ of the new constructor.</p>
     *              <p>Same as {@link cdf.dashboard.Dashboard.v|registerGlobalQuery} but afects the 
     *              current dashboard instance.</p>
     *
     * @param {string} type The type of the query constructor.
     * @param {cdf.queries.BaseQuery} query The constructor of the query object.
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
     * @summary Determines if a given query type is registered in the current dashboard.
     * @description Determines if a given query type is registered in the current dashboard.
     *
     * @param {string} type The query type.
     * @return {boolean} _true_ if the query type has been registered for this dashboard.
     */
    hasQuery: function(type) {
      return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
    },

    /**
     * @summary Given a query definition object, returns its query type.
     * @description <p>Given a query definition object, returns its query type. The query can have three
     *              groups of types. First _cda_ with queries using the CDA plugin. Then _legacy_, to be
     *              used xactions, and an arbitrary value for CPK data sources.</p>
     *
     * @param {Object} qd The query definition object.
     * @param {String} [qd.dataSource] The name of the datasource
     * @param {String} [qd.queryType] The query type in case it is from CPK
     * @param {Object} [qd.query] The query in case of it being legacy
     * @param {String} [qd.path] The path of the CDA file holding the query
     * @param {String} [qd.dataAccessId] The name of the query in the CDA file 
     * @return {String} The query type associated with the query definition object provided.
     * @return {Undefined} The query is not found
     * @throws {Error} In case the datasource name is invalid
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
     * @summary Given a type and options, returns the query object for running that particular query.
     * @description <p>Given a type and options, returns the query object for running that particular query.
     *              If a data source name is provided as an option, also include all options from it.</p>
     *
     * @param {String} [type=cda] The query type
     * @param {Object} opts An object containing the query options.
     * @param {Object} [opts.dataSource] The datasource of the query 
     * @param {String} [opts.queryType] The query type
     * @return {cdf.queries.BaseQuery} The query instance from the required _type_ and extended with the _opts_
     * @throws {Error} In case the datasource name is invalid
     * @see cdf.dashboard.Dashboard#getDataSource
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
     * @summary Tests if a query definition is valid or not.
     * @description <p>Tests if a query definition is valid or not. It checks if the return value of the 
     *              {@link cdf.dashboard.Dashboard#detectQueryType|detectQueryType} is not _undefined_.</p>
     *
     * @param {Object} queryDefinition The query definition object.
     * @return {boolean} _true_ if the query definition is valid.
     * @see cdf.dashboard.Dashboard#detectQueryType
     */
    isValidQueryDefinition: function(queryDefinition) {
      return this.detectQueryType(queryDefinition) !== undefined;
    },

    /**
     * @summary Lists the registered query types in this dashboard.
     * @description <p>Lists the registered query types in this dashboard.</p>
     *
     * @return {Array<String>} An array containing the registered query types.
     */
    listQueries: function() {
      return _.keys(this.queryFactories.listType('Query'));
    }
  });

  return /** @lends cdf.dashboard.Dashboard.query */ {

    /**
     * @summary Sets the {@link cdf.quereis.BaseQuery|BaseQuery} constructor.
     * @description <p>Sets the {@link cdf.quereis.BaseQuery|BaseQuery} constructor.</p> 
     *              <p>Later, this constructor is used to create the query objects for the different
     *              query types.</p>
     * 
     *
     * @param {cdf.queries.BaseQuery} QueryClass The base query object.
     */
    setBaseQuery: function(QueryClass) {
      if(_.isFunction(QueryClass) && QueryClass.extend) {
        _BaseQuery = QueryClass;
      }
    },

    /**
     * @summary Register a {@link cdf.queries.BaseQuery|BaseQuery} constructor globally.
     * @description <p>Register a {@link cdf.queries.BaseQuery|BaseQuery} constructor globally.</p>
     *              <p>If the query argument is a simple query object and not a constructor, 
     *              it copies all the deepProperties from the {@link cdf.queries.BaseQuery|BaseQuery}
     *              to the _deepProperties_ of the new constructor.</p>
     *              <p>Same as {@link cdf.dashboard.Dashboard.registerQuery|registerQuery} but afects the 
     *              global scope.</p>
     *
     * @param {String} type The query type.
     * @param {cdf.queries.BaseQuery} query The query object.
     * @see cdf.dashboard.Dashboard.registerQuery
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
