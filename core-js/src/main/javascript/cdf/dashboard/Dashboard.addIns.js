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
  './Container',
  './Utils'
], function(Dashboard, Container, Utils) {

  /**
   * Serves as a container for holding all globally registered add-ins.
   *
   * @type {Object}
   * @alias cdf.dashboard.Dashboard~globalAddIns
   * @ignore
   */
  var globalAddIns = new Container();
  
  /**
   * Normalizes an add-in key.
   *
   * @alias cdf.dashboard.Dashboard~normalizeAddInKey
   * @param {string} key    Add-in key.
   * @param {string} subKey Add-in sub key.
   * @return {string} The normalized add-in key.
   * @ignore
   */
  function normalizeAddInKey(key, subKey) {
    if(key.indexOf('Component', key.length - 'Component'.length) !== -1) {
      key = key.substring(0, key.length - 'Component'.length);
    }
    key = key.charAt(0).toUpperCase() + key.substring(1);  
    if(subKey) { key += "." + subKey; }  
    return key;    
  }

  /**
   * Registers a global add-in, to be used in all instances of dashboards sharing the same context.
   *
   * @alias cdf.dashboard.Dashboard.registerGlobalAddIn
   * @param {string}    type    Type of the add-in, usually the component type where this add-in will be available.
   * @param {string}    subType The subtype of the add-in.
   * @param {cdf.AddIn} addIn   The add-in instance to register.
   */
  Dashboard.registerGlobalAddIn = function(type, subType, addIn) {
    var type = normalizeAddInKey(type, subType),
        name = addIn.getName ? addIn.getName() : null;
    globalAddIns.register(type, name, addIn);
  };

  /**
   * @class cdf.dashboard.Dashboard.addIns
   * @amd cdf/dashboard/Dashboard.addIns
   * @classdesc A class representing an extension to the Dashboard class for handling add-ins.
   *            It's methods allow handling add-in registration and fetching.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * Method used by the Dashboard constructor for add-ins initialization.
     *
     * @private
     */
    _initAddIns: function() {
      this.addIns = Utils.clone(globalAddIns);
    },

    /**
     * Registers a global add-in, to be used in all instances of dashboards sharing the same context.
     * Essentially calls the static method with the same name.
     *
     * @param {string}     type    The type of the add-in, usually the component type where this add-in will be available.
     * @param {string}     subType The subtype of the add-in.
     * @param {cdf.AddIn}  addIn   The add-in instance to register.
     */
    registerGlobalAddIn: function(type, subType, addIn) {
      Dashboard.registerGlobalAddIn(type, subType, addIn);
    },

    /**
     * Registers an add-in, to be used only by this dashboard instance.
     *
     * @param {string}     type    Type of the add-in, usually the component type where this add-in will be available.
     * @param {string}     subType The subtype of the add-in.
     * @param {cdf.AddIn}  addIn   The add-in instance to register.
     */
    registerAddIn: function(type, subType, addIn) {
      var type = normalizeAddInKey(type, subType),
          name = addIn.getName ? addIn.getName() : null;
      this.addIns.register(type, name, addIn);
    },

    /**
     * Checks if the add-in with the specified name, sub type and type exists in the add-in registry for this
     * dashboard.
     *
     * @param {string} type      Type of the add-in, usually the component type where this add-in will be available.
     * @param {string} subType   The subtype of the add-in.
     * @param {string} addInName The add-in name.
     * @return {boolean} _true_ if the add-in exists.
     */
    hasAddIn: function(type, subType, addInName) {
      var type = normalizeAddInKey(type, subType);
      return Boolean(this.addIns && this.addIns.has(type, addInName));
    },

    /**
     * Gets the add-in with the specified name, sub type and type from the add-in registry for this
     * dashboard.
     *
     * @param {string} type      Type of the add-in, usually the component type where this add-in will be available
     * @param {string} subType   The subtype of the add-in.
     * @param {string} addInName The add-in name.
     * @return {?cdf.AddIn} The add-in if one is found, null otherwise.
     */
    getAddIn: function(type, subType, addInName) {
      var type = normalizeAddInKey(type, subType);
      try {
        var addIn = this.addIns.get(type, addInName);
        return addIn;
      } catch(e) {
        return null;
      }
    },

    /**
     * Sets the default options of an add-in.
     *
     * @param {string} type      Type of the add-in, usually the component type where this add-in will be available.
     * @param {string} subType   The subtype of the add-in.
     * @param {string} addInName The add-in name.
     * @param {Object} defaults  The default options. This is a JSON object specifying the default options. The options
     *                           are dependent on which add-in is being used.
     */
    setAddInDefaults: function(type, subType, addInName, defaults) {
      var addIn = this.getAddIn(type, subType, addInName);
      if(addIn) {
        addIn.setDefaults(defaults);
      }
    },

    /**
     * Lists registered add-ins for a given type and subtype.
     *
     * @param {string} type    Type of the add-in, usually the component type where this add-in will be available
     * @param {string} subType The subtype of the add-in.
     * @return {AddIn[]} The list of add-ins for the given type and subtype.
     */
    listAddIns: function(type, subType) {
      var type = normalizeAddInKey(type, subType);
      var addInList = [];
      try {
        return this.addIns.listType(type);
      } catch(e) {
        return [];
      }
    }                              
  });
    
});