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
  './dashboard/Utils',
  './Logger',
  './lib/jquery'
], function(Utils, Logger, $) {

  /**
   * The constructor of an add-in.
   *
   * @class cdf.AddIn
   * @amd cdf/AddIn
   * @classdesc Creates a new add-in. Add-ins come in two varieties: Static add-ins
   *            represent static data or behaviour, whereas Scriptable add-ins
   *            represent dynamic, context-dependent behaviour.
   * @param {Object}   options                  The options for the add-in. Needs a label, a name property and must have
   *                                            either a value (for static add-ins) or implementation member (for
   *                                            scriptable add-ins). Should the add-in support configuration, then
   *                                            there should also be an options.defaults property.
   * @param {string}   options.label            The human-readable label for the add-in.
   * @param {string}   options.name             The internal identifier for the add-in.
   * @param {function} [options.implementation] The implementation function for the add-in.
   * @param {Object}   [options.value]          The value for the add-in.
   * @param {Object}   [options.defaults]       The default values for the configurable settings.
   */
  return /** @lends cdf.AddIn */ function(options) {
    var myself = options;
    if(typeof options != "object") {
      throw TypeError;
    }
    // We expect either an implementation or a value.
    if(!options.label || !options.name || (!options.implementation && !options.value)) {
      throw TypeError;
    }

    /**
     * The internal identifier for the add-in (read only).
     *
     * @type {string}
     * @inner
     * @ignore
     */
    var _name = options.name,
      /**
       * The add-in's human-readable label (read only).
       *
       * @type {string}
       * @inner
       * @ignore
       */
      _label = options.label,
      /**
       * The add-in's type (read only).
       *
       * @type {string}
       * @inner
       * @ignore
       */
      _type = options.implementation ? "scriptable" : "static",
      // It's OK if any of these ends up being undefined
      /**
       * The add-in's implementation function (read only).
       *
       * @inner
       * @ignore
       */
      _implementation = options.implementation,
      /**
       * The default values for the configurable settings (read only).
       *
       * @type {Object}
       * @inner
       * @ignore
       */
      _defaults = options.defaults,
      /**
       * The default value (read only).
       *
       * @type {Object}
       * @inner
       * @ignore
       */
      _value = options.options;
      
    // Do we have an init method? Call it now
    if(typeof options.init === 'function') {
      options.init.call(myself);
    }

    /**
     * Returns the add-in label.
     *
     * @return {string} Add-in label.
     */
    this.getLabel = function() {
      return _label;
    };

    /**
     * Returns the add-in name.
     *
     * @return {string} Add-in name.
     */
    this.getName = function() {
      return _name;
    };

    /**
     * Call the add-in. If the add-in is static, all parameters are
     * irrelevant, and this method will simply return the value.
     * 
     * In a dynamic add-in, the implementation will be passed the
     * the target DOM Element (whatever element is relevant,
     * e.g. the element that was clicked on, or the table cell
     * that's being processed), a state object with whatever
     * context is relevant for the add-in to fulfill its purpose,
     * and optionally any overriding options.
     *
     * Components are allowed to pass undefined as the target if 
     * no elements make sense in context. 
     *
     * @param {Element} target  The relevant DOM Element.
     * @param {Object}  state   A representation of the necessary
     *                          context for the add-n to operate.
     * @param {Object}  options Configuration options for the add-in.
     */
    this.call = function(target, state, options) {
      if(!_implementation) {
        return Utils.clone(_value);
      }
      options = typeof options === "function" ? options(state) : options;
      var evaluatedDefaults = typeof _defaults === "function" ? _defaults(state) : _defaults;
      var compiledOptions = $.extend(true, {}, evaluatedDefaults, options);
      try{
        return _implementation.call(myself, target, state, compiledOptions);
      } catch(e) {
        Logger.log("Add-in Error [" + this.getName() + "]: " + e, "error");
      }
    };

    /**
     * Sets the default values of the configurable settings.
     *
     * @param {Object} defaults The default values for the configurable settings.
     */
    this.setDefaults = function(defaults) {
      if(typeof defaults === 'function') {
        _defaults = defaults;
      } else {
        _defaults = $.extend(true, {}, _defaults, defaults);
      }
    };
  };
});
