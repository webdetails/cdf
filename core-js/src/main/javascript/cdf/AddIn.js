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
  './dashboard/Utils',
  './Logger',
  './lib/jquery'
], function(Utils, Logger, $) {

  /**
   * @description The constructor of an add-in.
   *
   * @class cdf.AddIn
   * @amd cdf/AddIn
   * @summary Class that allows creating Static or Scriptable add-ins.
   * @classdesc Creates a new add-in. Add-ins come in two varieties: Static add-ins
   *            represent static data or behavior, while Scriptable add-ins
   *            represent dynamic, context-dependent behavior.
   * @param {Object}   options                  The options for the add-in. Needs a label, a name property, and
   *                                            either a value (for static add-ins) or an implementation member (for
   *                                            scriptable add-ins). If the add-in supports configuration, it should
   *                                            be provided via the `options.defaults` property.
   * @param {string}   options.label            The human-readable label of the add-in.
   * @param {string}   options.name             The name of the add-in used as an internal identifier.
   * @param {function} [options.implementation] The implementation function of the add-in.
   * @param {Object}   [options.value]          The value of the add-in.
   * @param {Object}   [options.defaults]       The default values of the configurable settings.
   * @throws {TypeError} If the `options` parameter is not an `object`.
   * @throws {TypeError} If `options.name` or `options.label` are not provided. Also, either `options.implementation`
   *                     or `options.value` needs to be defined.
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
     * @description The internal identifier for the add-in.
     * @summary The internal identifier for the add-in.
     *
     * @type {string}
     * @private
     */
    var _name = options.name,
      /**
       * @description The add-in human-readable label.
       * @summary The add-in human-readable label.
       *
       * @type {string}
       * @private
       */
      _label = options.label,
      /**
       * @description The add-in type. If {@link cdf.AddIn~_implementation|_implementation}
       * is defined it will be "scriptable", otherwise it will default to "static".
       * @summary The add-in type.
       *
       * @type {string}
       * @default "static"
       * @private
       */
      _type = options.implementation ? "scriptable" : "static",
      // It's OK if any of these ends up being undefined
      /**
       * @description The add-in implementation function.
       * @summary The add-in implementation function.
       *
       * @type {Function}
       * @private
       */
      _implementation = options.implementation,
      /**
       * @description The default values for the configurable settings.
       * @summary The default values for the configurable settings.
       *
       * @type {Object}
       * @private
       */
      _defaults = options.defaults,
      /**
       * @description The default value. This is the return value if the add-in is static.
       * @summary The default value.
       * @type {Object}
       * @private
       */
      _value = options.options;
      
    // Do we have an init method? Call it now
    if(typeof options.init === 'function') {
      options.init.call(myself);
    }

    /**
     * @description Returns the add-in label.
     * @summary Returns the add-in label.
     *
     * @return {string} The add-in label.
     */
    this.getLabel = function() {
      return _label;
    };

    /**
     * @description Returns the add-in name.
     * @summary Returns the add-in name.
     *
     * @return {string} The add-in name.
     */
    this.getName = function() {
      return _name;
    };

    /**
     * @description <p>Call the add-in. If the add-in is static, all parameters
     * are irrelevant, and this method will simply return the value
     * of {@link cdf.AddIn~_value|_value}.</p>
     * 
     * <p>In a dynamic add-in, the implementation will be passed to
     * the target DOM Element (whatever element is relevant, 
     * e.g. the element that was clicked on or the table cell
     * that is being processed), a state object with whatever
     * context is relevant for the add-in to fulfill its purpose,
     * and optionally any overriding options.</p>
     *
     * <p>Components are allowed to pass `undefined` as the target if 
     * no elements make sense in context.</p>
     * @summary Executes the add-in {@link cdf.AddIn~_implementation|_implementation} function or
     *          returns the value of {@link cdf.AddIn~_value|_value}.
     *
     * @param {jQuery}  target  The relevant DOM element.
     * @param {Object}  state   A representation of the necessary context for the add-in to operate.
     * @param {Object}  options Configuration options for the add-in.
     * @return {Object} The value of {@link cdf.AddIn~_value|_value} if the
     *                  {@link cdf.AddIn~_implementation|_implementation} function is undefined.
     * @return {Object} The result of executing the {@link cdf.AddIn~_implementation|_implementation}
     *                  function when it is available.
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
     * @description Sets the default values of the configurable settings.
     *              If `defaults` is a `function` it will override any previous
     *              default values. If it is an `object` its properties will be
     *              used to extend the current default values.
     * @summary Sets the default values of the configurable settings.
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
