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
  './Container',
  './Utils'
], function(Dashboard, Container, Utils) {

  /**
   * @description Serves as a container for holding all globally registered add-ins.
   * @summary Serves as a container for holding all globally registered add-ins.
   *
   * @memberof cdf.dashboard.Dashboard
   * @type {Object}
   * @private
   */
  var globalAddIns = new Container();
  
  /**
   * @description Normalizes an add-in key.
   * @summary Normalizes an add-in key.
   *
   * @memberof cdf.dashboard.Dashboard
   * @param {string} key    Add-in key.
   * @param {string} subKey Add-in sub key.
   * @return {string} The normalized add-in key.
   * @private
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
   * @description Registers a global add-in, to be used in all instances of
   *              dashboards sharing the same context.
   * @summary Registers a global add-in.
   *
   * @function cdf.dashboard.Dashboard.registerGlobalAddIn
   * @param {string}    type    Type of the add-in, usually the component type
   *                            where this add-in will be available.
   * @param {string}    subType The subtype of the add-in.
   * @param {cdf.AddIn} addIn   The add-in instance to register.
   * @private
   */
  Dashboard.registerGlobalAddIn = function(type, subType, addIn) {
    var type = normalizeAddInKey(type, subType),
        name = addIn.getName ? addIn.getName() : null;
    globalAddIns.register(type, name, addIn);
  };

  /**
   * @class cdf.dashboard."Dashboard.addIns"
   * @amd cdf/dashboard/Dashboard.addIns
   * @summary A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *          class for handling add-ins.
   * @classdesc A class representing an extension to the {@link cdf.dashboard.Dashboard|Dashboard}
   *            class for handling add-ins. Its methods allow handling add-in registration and fetching.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * @description Serves as a container for holding the registered add-ins of
     *              the respective dashboard instance.
     * @summary Serves as a container for holding the registered add-ins.
     * 
     * @type {Object}
     * @protected
     */
    addIns: undefined,

    /**
     * @description Method used by the Dashboard constructor for add-ins initialization.
     * @summary Method used by the Dashboard constructor for add-ins initialization.
     *
     * @private
     */
    _initAddIns: function() {
      this.addIns = Utils.clone(globalAddIns);
    },

    /**
     * @description Registers a global add-in, to be used in all instances of
     *              dashboards sharing the same context. Essentially, it calls the
     *              static method with the same name.
     * @summary Registers a global add-in.
     *
     * @param {string}     type    The type of the add-in, usually the component
     *                             type where this add-in will be available.
     * @param {string}     subType The subtype of the add-in.
     * @param {cdf.AddIn}  addIn   The add-in instance to register.
     */
    registerGlobalAddIn: function(type, subType, addIn) {
      Dashboard.registerGlobalAddIn(type, subType, addIn);
    },

    /**
     * @description Registers an add-in to be used only by this dashboard instance.
     * @summary Registers an add-in to be used only by this dashboard instance.
     *
     * @param {string}     type    Type of the add-in, usually the component type
     *                             where this add-in will be available.
     * @param {string}     subType The subtype of the add-in.
     * @param {cdf.AddIn}  addIn   The add-in instance to register.
     */
    registerAddIn: function(type, subType, addIn) {
      var type = normalizeAddInKey(type, subType),
          name = addIn.getName ? addIn.getName() : null;
      this.addIns.register(type, name, addIn);
    },

    /**
     * @description Checks if the add-in with the specified name, subtype and
     *              type exists in the add-in registry for this dashboard.
     * @summary Checks if the add-in exists in the add-in registry.
     *
     * @param {string} type      Type of the add-in, usually the component type
     *                           where this add-in will be available.
     * @param {string} subType   The subtype of the add-in.
     * @param {string} addInName The add-in name.
     * @return {boolean} `true` if the add-in exists, `false` otherwise.
     */
    hasAddIn: function(type, subType, addInName) {
      var type = normalizeAddInKey(type, subType);
      return Boolean(this.addIns && this.addIns.has(type, addInName));
    },

    /**
     * @description Gets the add-in with the specified name, subtype and type
     *              from the add-in registry for this dashboard.
     * @summary Gets the add-in from the add-in registry.
     *
     * @param {string} type      Type of the add-in, usually the component type
     *                           where this add-in will be available.
     * @param {string} subType   The subtype of the add-in.
     * @param {string} addInName The add-in name.
     * @return {?cdf.AddIn} The add-in if one is found, `null` otherwise.
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
     * @description Sets the default options of an add-in.
     * @summary Sets the default options of an add-in.
     *
     * @param {string} type      Type of the add-in, usually the component type
     *                           where this add-in will be available.
     * @param {string} subType   The subtype of the add-in.
     * @param {string} addInName The add-in name.
     * @param {Object} defaults  The default options. This is a JSON object
     *                           specifying the default options. The options
     *                           are dependent on which add-in is being used.
     */
    setAddInDefaults: function(type, subType, addInName, defaults) {
      var addIn = this.getAddIn(type, subType, addInName);
      if(addIn) {
        addIn.setDefaults(defaults);
      }
    },

    /**
     * @description Lists registered add-ins of a given type and subtype.
     * @summary Lists registered add-ins of a given type and subtype.
     *
     * @param {string} type    Type of the add-in, usually the component type
     *                         where this add-in will be available.
     * @param {string} subType The subtype of the add-in.
     * @return {Array<cdf.AddIn>} An `array` containing the add-ins of the given
     *                            type and subtype.
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
