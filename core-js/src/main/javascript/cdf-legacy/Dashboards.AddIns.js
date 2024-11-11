/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


/**
 * - Dashboards.safeClone
 * - other addIns related functions
 **/


// ADDINS begin
;(function (D){
  D.addIns = new D.Container ();

  //Normalization - Ensure component does not finish with component and capitalize first letter
  D.normalizeAddInKey = function(key, subKey) {
      if (key.indexOf('Component', key.length - 'Component'.length) !== -1) 
        key = key.substring(0, key.length - 'Component'.length);  
      key = key.charAt(0).toUpperCase() + key.substring(1);

      if(subKey) { key += "." + subKey; }

    return key;
  }

  D.registerAddIn = function(type,subType,addIn){
    var type = this.normalizeAddInKey(type, subType),
        name = addIn.getName ? addIn.getName() : null;
    this.addIns.register(type, name, addIn);
  };

  D.hasAddIn = function(type,subType,addInName){
    var type = this.normalizeAddInKey(type, subType);
    return Boolean(this.addIns && this.addIns.has(type,addInName));
  };

  D.getAddIn = function(type,subType,addInName){
    var type = this.normalizeAddInKey(type, subType);
    try {
      var addIn = this.addIns.get(type,addInName);
      return addIn;
    } catch (e) {
      return null;
    }
  };

  D.setAddInDefaults = function(type, subType, addInName, defaults) {
    var addIn = this.getAddIn(type, subType,addInName);
    if(addIn) {
      addIn.setDefaults(defaults);
    }
  };
  D.listAddIns = function(type, subType) {
  var type = this.normalizeAddInKey(type, subType);
    var addInList = [];
    try {
      return this.addIns.listType(type);
    } catch (e) {
      return [];
    }
  };
})(Dashboards);
// ADDINS end


Dashboards.safeClone = function(){
  var options, name, src, copy, copyIsArray, clone,
  target = arguments[0] || {},
  i = 1,
  length = arguments.length,
  deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
    target = {};
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ( (options = arguments[ i ]) != null ) {
      // Extend the base object
      for ( name in options ) if (options.hasOwnProperty(name)) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : [];

          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = this.safeClone( deep, clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};
