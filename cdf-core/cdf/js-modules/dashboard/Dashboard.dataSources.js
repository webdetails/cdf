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
  './Dashboard',
  '../Logger',
  'amd!../lib/underscore'
], function(Dashboard, Logger, _) {

  /**
   * A module representing an extension to Dashboard module for data sources.
   * The methods here handle getting and saving data sources from the dashboard.
   * @module Dashboard.dataSources
   */
  Dashboard.implement({

    /**
     * Method used by the Dashboard constructor for data sources initialization
     *
     * @private
     */
    _initDataSources: function() {
      this.dataSources = {};
    },

    /**
     * Gets the data source name.
     *
     * @param obj a string, a data source object with a name property or a query definition object with a dataSource property
     * @return {string|undefined} the data source name or undefined if none is found
     *
     * @private
     */
    _getDataSourceName: function(obj) {
      if(!obj) {
        Logger.error("Invalid data source");
        return;
      } else if(_.isObject(obj)) { // data source is an object
        if(obj.name && _.isString(obj.name)) {
          // got a data source object, name is set and is a String
          return obj.name;
        } else if(obj.dataSource && _.isString(obj.dataSource)) {
          // got a query definition object, name is set and is a String
          return obj.dataSource;
        } else {
          Logger.error("Data source name not found");
          return;
        }
      } else if(_.isString(obj)) { // obj is a data source name
        return obj;
      } else {
        Logger.error("The data source provided should either be an object or an name string");
        return;
      }
    },

    /**
     * Adds a data source. If no string name parameter is provided, a name property
     * will be extracted from the data source object.
     *
     * @method addDataSource
     * @for Dashboard
     * @param name the name of the data source
     * @param obj the data source to be added
     * @param force a flag indicating if any previous data sources with the
     *  same name are to be overridden
     */
    addDataSource: function(name, obj, force) {
      // if no name is provided, try to extract it from the data source object
      if(_.isObject(name)) {
        force = obj;
        obj = name;
        name = obj.name;
      }
      // validate data source object
      if(!obj || !_.isObject(obj)) {
        Logger.error("Invalid data source object");
        return;
      }
      // validate name
      if(!name || !_.isString(name)) {
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
     * Gets a data source according to the provided name or data source object containing a name property.
     *
     * @method getDataSource
     * @for Dashboard
     * @param obj the name of the data source or an object from which to extract the name from
     * @returns {*|undefined} the data source or undefined if none is found
     */
    getDataSource: function(obj) {
      var dataSource;
      if(!(dataSource = this.dataSources[this._getDataSourceName(obj)])) {
        Logger.warn("Invalid data source name");
      } else {
        // return the data source
        return dataSource;
      }
    },

    /**
     * Returns a query object built using the data source with the provided name.
     *
     * @method getDataSourceQuery
     * @for Dashboard
     * @param obj the name of the data source or an object from which to extract the name from
     * return {*|undefined} the query built using the target data source or undefined if no data source was found
     */
    getDataSourceQuery: function(obj) {
      var dataSource = _.extend({}, this.dataSources[this._getDataSourceName(obj)]);
      if(_.isEmpty(dataSource)) {
        Logger.warn("Invalid data source name");
      } else {
        // create a new query of type data source.queryType
        return this.getQuery(dataSource);
      }
    },

    /**
     * Adds a data source. If a data source already exists with the same name, it is replaced with the new one.
     *
     * @method setDataSource
     * @for Dashboard
     * @param name the name of the data source
     * @param obj the data source to be added
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
     * Removes a data source according to the name provided.
     *
     * @method removeDataSource
     * @for Dashboard
     * @param obj the name of the data source or an object from which to extract the name
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
