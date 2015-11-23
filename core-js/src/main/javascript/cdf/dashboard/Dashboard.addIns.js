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

/**
 * A module representing an extension to the Dashboard module for handling addIns.
 * The methods here handle addIn registration and fetching.
 *
 * @module Dashboard.addIns
 */
define([
  './Dashboard',
  './Container',
  './Utils'],
  function(Dashboard, Container, Utils) {

  var globalAddIns = new Container();
  
  function normalizeAddInKey(key, subKey) {
    if(key.indexOf('Component', key.length - 'Component'.length) !== -1) {
      key = key.substring(0, key.length - 'Component'.length);
    }
    key = key.charAt(0).toUpperCase() + key.substring(1);  
    if(subKey) { key += "." + subKey; }  
    return key;    
  }

  /**
   * Registers a global addIn, to be used in all instances of dashboards sharing the same context.
   *
   * @method registerGlobalAddIn
   * @for Dashboard
   * @param {String} type Type of the add-in, usually the component type where this addIn will be available
   * @param {String} subType  subtype of the addIn
   * @param {AddIn} addIn the {{#crossLink "AddIn"}}AddIn{{/crossLink}} instance (obtained by calling new AddIn(options) )
   * @static
   */
  Dashboard.registerGlobalAddIn = function(type, subType, addIn) {
    var type = normalizeAddInKey(type, subType),
        name = addIn.getName ? addIn.getName() : null;
    globalAddIns.register(type, name, addIn);
  };

  Dashboard.implement({

    /**
     * Method used by the Dashboard constructor for addIns initialization.
     *
     * @method _initAddIns
     * @for Dashboard
     * @private
     */
    _initAddIns: function() {
      this.addIns = Utils.clone(globalAddIns);
    },

    /**
     * Registers a global addIn, to be used in all instances of dashboards sharing the same context.
     * Essentially calls the static method with the same name.
     *
     * @method registerGlobalAddIn
     * @for Dashboard
     * @param {String} type Type of the add-in, usually the component type where this addIn will be available
     * @param {String} subType  subtype of the addIn
     * @param {AddIn} addIn the object representing the addIn (obtained by calling new AddIn(options) )
     */
    registerGlobalAddIn: function(type, subType, addIn) {
      Dashboard.registerGlobalAddIn(type, subType, addIn);
    },

    /**
     * Registers an addIn, to be used only by this dashboard instance.
     *
     * @method registerAddIn
     * @for Dashboard
     * @param {String} type Type of the add-in, usually the component type where this addIn will be available
     * @param {String} subType  subtype of the addIn
     * @param {AddIn} addIn the object representing the addIn (obtained by calling new AddIn(options) )
     */
    registerAddIn: function(type, subType, addIn) {
      var type = normalizeAddInKey(type, subType),
          name = addIn.getName ? addIn.getName() : null;
      this.addIns.register(type, name, addIn);
    },

    /**
     * Checks if the addin with the specified name, sub type and type exists in the addin registry for this
     * dashboard.
     *
     * @method hasAddIn
     * @for Dashboard
     * @param {String} type Type of the add-in, usually the component type where this addIn will be available
     * @param {String} subType  subtype of the addIn
     * @param {String} addInName addIn name
     * @return true if the addin exists
     */
    hasAddIn: function(type, subType, addInName) {
      var type = normalizeAddInKey(type, subType);
      return Boolean(this.addIns && this.addIns.has(type, addInName));
    },

    /**
     * Gets the addin with the specified name, sub type and type from the addin registry for this
     * dashboard.
     *
     * @method getAddIn
     * @for Dashboard
     * @param {String} type Type of the add-in, usually the component type where this addIn will be available
     * @param {String} subType  subtype of the addIn
     * @param {String} addInName addIn name
     * @return the addIn if one is found, null otherwise
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
     * Sets an addin default options.
     *
     * @method setAddInDefaults
     * @for Dashboard
     * @param {String} type Type of the add-in, usually the component type where this addIn will be available
     * @param {String} subType  subtype of the addIn
     * @param {String} addInName addIn name
     * @param {Object} defaults The default options. This is a JSON object specifying the default options. The options
     * are dependent on which addIn is being used.
     */
    setAddInDefaults: function(type, subType, addInName, defaults) {
      var addIn = this.getAddIn(type, subType, addInName);
      if(addIn) {
        addIn.setDefaults(defaults);
      }
    },

    /**
     * Lists registered addIns for a given type and subtype.
     *
     * @method listAddIns
     * @for Dashboard
     * @param {String} type Type of the add-in, usually the component type where this addIn will be available
     * @param {String} subType  subtype of the addIn
     * @return the list of addIns for the given type and subtype
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