/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
   * @memberof cdf.dashboard.Dashboard
   * @private
   */
  var _BaseQuery = Base;

  /**
   * @summary Global container used for registering query types and instantiating queries.
   * @description <p>Global container used for registering query types and instantiating queries.</p>
   *              <p>Implements the factory pattern, providing a generic interface for creating
   *              query instances of the specified type.</p>
   *              <p>Query types registered in this container will be accessible by all
   *              dashboard instances.</p>
   *
   * @type {Object}
   * @memberof cdf.dashboard.Dashboard
   * @private
   */
  var globalQueryFactories = new Container();

  /**
   * @class cdf.dashboard."Dashboard.query"
   * @amd cdf/dashboard/Dashboard.query
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for managing queries.
   * @classdesc <p>A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for managing queries.</p><p>Its methods allow registering and creating queries.</p>
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @summary Container used for registering query types and instantiating queries.
     * @description <p>Container used for registering query types and instantiating queries.</p>
     *              <p>Implements the factory pattern, providing a generic interface for creating
     *              query instances of the specified type.</p>
     *              <p>Query types registered in this container will be accessible only by the
     *              dashboard instance.</p>
     *
     * @type {Object}
     * @protected
     */
    queryFactories: undefined,

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
     * @summary Gets the base query object constructor from where other query types can be extended.
     * @description Gets the base query object constructor from where other query types can be extended. 
     *
     * @return {cdf.queries.BaseQuery} The base query constructor.
     */
    getBaseQuery: function() {
      return _BaseQuery;
    },

    /**
     * @summary Registers a new query type constructor to be used by the dashboard instance.
     * @description <p>Registers a new query type constructor to be used by the dashboard instance.</p>
     *              <p>If the `query` argument is an `object`, a new `object` will be created with
     *              a copy of the properties listed in the {@link cdf.queries.BaseQuery#deepProperties|deepProperties}
     *              list of the {@link cdf.queries.BaseQuery|BaseQuery}.</p>
     *              <p>If `query` is a `function`, it will be used to generate new query instances of the specified `type`
     *              with no dependency on the {@link cdf.queries.BaseQuery|BaseQuery} class.</p>
     *              <p>The new query type will be registered at the dashboard instance level and will not
     *              be accessible to other dashboards. To register the query type globally see the
     *              {@link cdf.dashboard.Dashboard.registerGlobalQuery|registerGlobalQuery} function.</p>
     *
     * @param {string} type The type of the query constructor.
     * @param {object|function} query A set of properties specific of the query type being registered, or
     *                                the constructor for the query type being registered.
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
     * @return {boolean} `true` if the query type has been registered for this dashboard.
     */
    hasQuery: function(type) {
      return Boolean(this.queryFactories && this.queryFactories.has('Query', type));
    },

    /**
     * @summary Given a query definition object, returns its query type.
     * @description <p>Given a query definition object, returns its query type. The query can have three
     *              groups of types. First `cda`, with queries using the CDA plugin. Then `legacy`,
     *              using xactions, and an arbitrary value for CPK data sources.</p>
     *
     * @param {Object} qd The query definition object.
     * @param {String} [qd.dataSource] The name of the data source.
     * @param {String} [qd.queryType] The query type in case it is from CPK.
     * @param {Object} [qd.query] The query in case of it being legacy.
     * @param {String} [qd.path] The path of the CDA file holding the query.
     * @param {String} [qd.dataAccessId] The name of the query in the CDA file .
     * @return {String|undefined} The query type or `undefined` if none was detected.
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
     *              If a data source name is provided as an option, it also includes all options from it.</p>
     *
     * @param {String|Object} [type="cda"] A string with the query type,
     *                                     or a valid data source or query definition object.
     * @param {Object} [opts] An `object` containing the query options.
     * @param {String} [opts.dataSource] The data source of the query.
     * @param {String} [opts.queryType] The query type.
     * @return {cdf.queries.BaseQuery} The query instance from the required `type` extended with the options in `opts`.
     * @see {@link cdf.dashboard.Dashboard#getDataSource|getDataSource}
     * @example
     * // MDX query using an explicit type and a query definition object
     * dashboard.getQuery("mdx", {jndi: "SampleData", catalog: ...});
     * // MDX query using a query definition object
     * dashboard.getQuery({queryType: "mdx", jndi: "SampleData", catalog: ...});
     * // MDX query using a data source
     * dashboard.addDataSource("myDatasource", {queryType: "mdx", jndi: "SampleData", catalog: ...});
     * dashboard.getQuery({dataSource: "myDatasource"});
     * // defaults to a CDA query
     * dashboard.addDataSource("myDatasource", {dataAccessId: "query1", path: "/public/queries.cda"});
     * dashboard.getQuery({dataSource: "myDatasource"});
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
          Logger.error("Invalid data source name '" + opts.dataSource + "'");
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
     *              {@link cdf.dashboard.Dashboard#detectQueryType|detectQueryType} is not `undefined`.</p>
     *
     * @param {Object} queryDefinition The query definition object.
     * @return {boolean} `true` if the query definition is valid.
     * @see {@link cdf.dashboard.Dashboard#detectQueryType|detectQueryType}
     */
    isValidQueryDefinition: function(queryDefinition) {
      return this.detectQueryType(queryDefinition) !== undefined;
    },

    /**
     * @summary Lists the registered query types in this dashboard.
     * @description <p>Lists the registered query types in this dashboard.</p>
     *
     * @return {Array<String>} An `array` containing the registered query types.
     */
    listQueries: function() {
      return _.keys(this.queryFactories.listType('Query'));
    }
  });

  return /** @lends cdf.dashboard.Dashboard */ {

    /**
     * @summary Sets the {@link cdf.queries.BaseQuery|BaseQuery} class.
     * @description <p>Sets the {@link cdf.queries.BaseQuery|BaseQuery} class.</p> 
     *              <p>Registered query types will extend from the base query type
     *              unless a valid constructor function is provided during registration.</p>
     * 
     *
     * @param {cdf.queries.BaseQuery} QueryClass The default base query class.
     * @see {@link cdf.dashboard.Dashboard.registerGlobalQuery|registerGlobalQuery}
     * @see {@link cdf.dashboard.Dashboard#registerQuery|registerQuery}
     */
    setBaseQuery: function(QueryClass) {
      if(_.isFunction(QueryClass) && QueryClass.extend) {
        _BaseQuery = QueryClass;
      }
    },

    /**
     * @summary Registers globally a new query type constructor to be used by any dashboard instance.
     * @description <p>Registers globally a new query type constructor to be used by any dashboard instance.</p>
     *              <p>If the `query` argument is an `object`, a new `object` will be created with
     *              a copy of the properties listed in the {@link cdf.queries.BaseQuery#deepProperties|deepProperties}
     *              list of the {@link cdf.queries.BaseQuery|BaseQuery}.</p>
     *              <p>If `query` is a `function` it will be used to generate new query instances of the specified type
     *              with no dependency on the {@link cdf.queries.BaseQuery|BaseQuery} class.</p>
     *              <p>The new query `type` will be registered at a global level and will be accessible by any dashboard instance.
     *              To register the query type on a single dashboard instance please see the
     *              {@link cdf.dashboard.Dashboard#registerQuery|registerQuery} function.</p>
     *
     * @param {string} type The type of the query constructor.
     * @param {object|function} query A set of properties specific of the query type being registered, or
     *                                the constructor for the query type being registered.
     * @see {@link cdf.dashboard.Dashboard#registerQuery|registerQuery}
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
