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
  './Dashboard',
  '../Logger',
  'amd!../lib/underscore'
], function(Dashboard, Logger, _) {

  /**
   * @class cdf.dashboard."Dashboard.dataSources"
   * @amd cdf/dashboard/Dashboard.dataSources
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for handling data sources.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for handling data sources.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @summary Map of key value pairs: data source name - data source value.
     * @description Map of key value pairs where the keys are the data source names and the
     *              values are the corresponding data source `object`.
     *
     * @type {Array<Object>}
     * @protected
     */
    dataSources: undefined,

    /**
     * @summary Method used by the {@link cdf.dashboard.Dashboard|Dashboard}
     *          constructor for data sources initialization.
     * @description Method used by the {@link cdf.dashboard.Dashboard|Dashboard}
     *              constructor for data sources initialization.
     *
     * @private
     */
    _initDataSources: function() {
      this.dataSources = {};
    },

    /**
     * @summary Gets the data source name.
     * @description Gets the data source name given a data source or a query definition `object`.
     *
     * @private
     * @param {Object} obj A string, a data source object with a `name` property or
     *                     a query definition `object` with a `dataSource` property.
     * @return {string|undefined} The data source name or `undefined` if none is found.
     */
    _getDataSourceName: function(obj) {
      var name;
      // check if obj is a data source object
      if(_.isObject(obj)) {
        name = obj.dataSource;
      } else {
        name = obj;
      }
      // validate name
      if(_.isString(name) && !_.isEmpty(name)) {
        return name;
      }

      Logger.warn("Invalid data source name");
    },

    /**
     * @summary Adds a new data source.
     * @description Adds a data source given a name, the data source object to be
     *              added, and an optional `boolean` indicating if any data source
     *              with the same name should be deleted. If the `name` parameter
     *              is an `object`, its `name` property will be used as the data
     *              source name and the `obj` parameter will be used as the flag
     *              for indicating that previous data sources with the same name 
     *              were overwritten.
     *
     * @param {string|Object}     name          The name of the data source.
     * @param {Object|boolean}    obj           The data source to be added.
     * @param {boolean|undefined} [force=false] A flag indicating if any previous data sources with the
     *                                          same name are to be replaced.
     */
    addDataSource: function(name, obj, force) {
      // if no name is provided, try to extract it from the data source object
      if(_.isObject(name)) {
        force = obj;
        obj = name;
        name = obj.name;
      }
      // validate data source object
      if(!_.isObject(obj)) {
        Logger.error("Invalid data source object");
        return;
      }
      // validate name
      if(!(_.isString(name) && !_.isEmpty(name))) {
        Logger.error("Invalid data source name");
        return;
      }
      // validate if data source exists
      if(this.dataSources[name]) {
        // validate if the name of the data source is an inherited property
        if(!this.dataSources.hasOwnProperty(name)) {
          Logger.error("Data source name '" + name
            + "' is invalid, overwrites an inherited property");
          return;
        } else if(!force) { // data source is already defined and should not be overwritten
          Logger.warn("Data source name '" + name
            + "' is already defined, set force flag to true to overwrite it");
          return;
        }
      }
      // remove data source name from query definition
      var dataSource = _.extend({}, obj);
      // exclude the data source name from it's definition
      if(dataSource.name) {
        delete dataSource.name;
      }
      this.dataSources[name] = dataSource;
      // TODO: Trigger any add event ?
    },

    /**
     * @summary Gets the data source with the provided name.
     * @description Gets a data source according to the provided name or
     *              query definition object with a `dataSource` property.
     *
     * @param {string|Object} obj The name of the data source or an `object`
     *                            from which to extract the name from.
     * @return {Object|undefined} The data source or `undefined` if none is found.
     */
    getDataSource: function(obj) {
      var name = this._getDataSourceName(obj);
      if(name && this.dataSources.hasOwnProperty(name)) {
        return this.dataSources[name];
      }
    },

    /**
     * @summary Gets a query from {@link cdf.dashboard.Dashboard#getQuery|getQuery}
     *          using the data source with the provided name.
     * @description Gets a query from {@link cdf.dashboard.Dashboard#getQuery|getQuery}
     *              using the data source with the provided name.
     *
     * @param {string|Object} obj The name of the data source or an `object` from which to extract the name from.
     * @return {Object|undefined} The query built using the target data source or `undefined` if no data source was found.
     */
    getDataSourceQuery: function(obj) {
      var dataSource = this.getDataSource(obj);
      if(_.isEmpty(dataSource)) {
        Logger.error("Invalid data source");
      } else {
        // create a new query of type dataSource.queryType
        return this.getQuery(dataSource);
      }
    },

    /**
     * @summary Adds a data source overriding any existing one with the same name.
     * @description Adds a data source. If a data source already exists with the same name, it is replaced with the new one.
     *
     * @param {string|Object}    name The name of the data source.
     * @param {Object|undefined} obj  The data source to be added.
     */
    setDataSource: function(name, obj) {
      // if no name is provided, try to extract it from the provided object
      if(_.isObject(name)) {
        this.addDataSource(name, true);
      } else {
        this.addDataSource(name, obj, true);
      }
      // TODO: Trigger any update event ? 
    },

    /**
     * @summary Removes the data source with the provided name.
     * @description Removes the data source with the provided name. If `obj` is a
     *              query definition `object`, the data source name will be extracted
     *              from its `dataSource` property.
     *
     * @param {string|Object} obj The name of the data source or an object from which to extract the name.
     */
    removeDataSource: function(obj) {
      var name;
      if(!(name = this._getDataSourceName(obj))) {
        Logger.warn("Invalid data source name");
        return;
      }

      // validate if data source exists
      if(name in this.dataSources && this.dataSources.hasOwnProperty(name)) {
        delete this.dataSources[name];
        // TODO: Trigger any delete event ?
      } else {
        Logger.warn("Data source name '" + name + "' not found");
      }
    }
  });
});
