/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
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

  Dashboard.registerGlobalAddIn = function(type, subType, addIn) {
    var type = normalizeAddInKey(type, subType),
        name = addIn.getName ? addIn.getName() : null;
    globalAddIns.register(type, name, addIn);
  };

  Dashboard.implement({
      
    _initAddIns: function() {
      this.addIns = Utils.clone(globalAddIns);
    },
  
    registerGlobalAddIn : function(type, subType, addIn) {
      Dashboard.registerGlobalAddIn(type, subType, addIn);
    },

    registerAddIn : function(type, subType, addIn) {
      var type = normalizeAddInKey(type, subType),
          name = addIn.getName ? addIn.getName() : null;
      this.addIns.register(type, name, addIn);
    },
  
    hasAddIn : function(type, subType, addInName) {
      var type = normalizeAddInKey(type, subType);
      return Boolean(this.addIns && this.addIns.has(type,addInName));
    },
  
    getAddIn : function(type, subType, addInName) {
      var type = normalizeAddInKey(type, subType);
      try {
        var addIn = this.addIns.get(type, addInName);
        return addIn;
      } catch(e) {
        return null;
      }
    },
  
    setAddInDefaults : function(type, subType, addInName, defaults) {
      var addIn = this.getAddIn(type, subType, addInName);
      if(addIn) {
        addIn.setDefaults(defaults);
      }
    },
    
    listAddIns : function(type, subType) {
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