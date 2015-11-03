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
  './Utils',
  'amd!../lib/underscore',
  '../lib/jquery'
], function(Utils, _, $) {

  // Shared / Static
  function get(container, opt, attr, defaultValue) {
    if(container && container[opt] && container[opt].hasOwnProperty(attr)) {
      return container[opt][attr];
    } else {
      return defaultValue || undefined;
    }
  }
  function set(container, opt, attr, value) {
    if(container && opt && attr) {
      container[opt] = container[opt] || {};
      container[opt][attr] = value ; 
    }
  }

  /**
   * This class is intended to be used as a generic Options Manager, by providing a way to
   * keep record of the values of an options set, but also custom readers, writers and validators
   * for each of the options.
   *
   * @module OptionsManager
   * @class OptionsManager
   * @constructor
   * @param config Options object for the manager - {defaults: {}, interfaces: {}, libraries: {}}
   */
  return function(config) {
    var myself = this;

    /**
     * Options collection.
     *
     * @property _options
     * @type object
     * @protected
     */
    this._options = {};

    /**
     * Interfaces collection.
     *
     * @property _interfaces
     * @type object
     * @protected
     */
    this._interfaces = {};

    /**
     * Libraries collection.
     *
     * @property _libraries
     * @type object
     * @protected
     */
    this._libraries = {
      predicates: {
        tautology: function(value) { return true; },
        isFunction: _.isFunction ,
        isPositive: function(value) { return (_.isNumber(value) && value > 0); },
        isObjectOrPropertiesArray: function(value) { 
          return _.isArray(value) || _.isObject(value);
        },
        isObject: _.isObject,
        isArray: _.isArray
      },
      mappers: {
        identity: _.identity,
        propertiesObject: function(value) {
          return (_.isArray(value)) ? Utils.propertiesArrayToObject(value) : value;
        }
      }
    };

    /**
     * Extends the instance supplied as argument with the getOption and setOption methods.
     *
     * @method mixin
     * @param instance - Instance to be extended
     */
    this.mixin = function(instance) {
      instance.getOption = this.getOption;
      instance.setOption = this.setOption;
    };

    /**
     * Initializes the OptionsManager.
     *
     * @method init
     * @param defaults Optional defaults
     * @param interfaces Optional interfaces
     * @param libraries Optional libraries
     */
    this.init = function(defaults, interfaces, libraries) {
      var myself = this;
      
      defaults = $.extend(true, {}, defaults);
      interfaces = $.extend(true, {}, interfaces);

      this._libraries = $.extend(true, {}, this._libraries, libraries);
      _.each(interfaces, function(el, key) {
        setInterfaces(key, el);
      });
      _.each(defaults, function(el, key) {
        var ifaces = (interfaces && interfaces[key]) || {};
        setInterfaces(key, ifaces);
        setValue(key, el);
      });
    };

    /**
     * Sets an option in the OptionManager.
     *
     * @method setOption
     * @param opt Option to set
     * @param value Value to set
     * @param interfaces Optionally an interface object to set along with the option -
     * {reader: fn, writer: fn, validator: fn}
     * @return {boolean} _true_ if able to set the option, otherwise an error is thrown
     */
    this.setOption = function(opt, value, interfaces) {
      setInterfaces(opt, interfaces);
      var reader = getReader(opt),
          validator = getValidator(opt);
      if(validator(value)) {
        value = reader(value);
        setValue(opt, value);
        return true;
      } else {
        throw new Error("Invalid Option " + opt.charAt(0).toUpperCase() + opt.slice(1));
      }
    };

    /**
     * Gets an option from the Manager.
     *
     * @method getOption
     * @param opt Option to get
     * @return {*} Value associated with the option
     */
    this.getOption = function(opt) {
      var writer = getWriter(opt),
          value = getValue(opt);
      return writer(value);
    };

    /**
     * Sets the interfaces for the option.
     *
     * @method setInterfaces
     * @param opt Option where the interfaces are being set
     * @param interfaces Object with the interfaces to set {reader: , writer:, validator: }
     *
     * @private
     */
    function setInterfaces(opt, interfaces) {
      interfaces = interfaces || {};
      setReader(opt, interfaces['reader']);
      setWriter(opt, interfaces['writer']);
      setValidator(opt, interfaces['validator']);
    }

    /**
     * Gets the reader for an option.
     *
     * @method getReader
     * @param opt Option
     * @return {*} Option reader it one was registered or the identity reader
     *
     * @private
     */
    function getReader(opt) {
      return get(myself._interfaces, opt, 'reader', myself._libraries.mappers['identity']);
    }

    /**
     * Gets the writer for an option.
     *
     * @method getWriter
     * @param opt Option
     * @return {*} Option writer it one was registered or the identity writer
     *
     * @private
     */

    function getWriter(opt) {
      return get(myself._interfaces, opt, 'writer', myself._libraries.mappers['identity']);
    }

    /**
     * Gets the validator for an option.
     *
     * @method getValidator
     * @param opt Option
     * @return {*} Option validator it one was registered or the tautology validator (always returns true)
     *
     * @private
     */
    function getValidator(opt) {
      return get(myself._interfaces, opt, 'validator', myself._libraries.predicates['tautology']);
    }

    /**
     * Gets the value for an option.
     *
     * @method getValue
     * @param opt Option
     * @return {*} Value for the option
     *
     * @private
     */
    function getValue(opt) { return get(myself._options, opt, 'value'); }
    
    // Reader, Writer and Validator work in the same way:
    // If the value is a function, use it. 
    // Otherwise, if it is a string and a valid library key, use it.
    // Otherwise, use a default library function: for readers and writers an identity map,
    //  for validators a predicate that always returns true.

    /**
     * Set a reader function for an option. If the value is a function, use it.
     * Otherwise, if it is a string and a valid library key, use it.
     * Otherwise, use the identity map.
     *
     * @method setReader
     * @param opt Option where to set the reader
     * @param fn Reader to set
     * @private
     */
    function setReader(opt, fn) {
      var lib = myself._libraries.mappers;
      fn = (_.isFunction(fn) && fn) || (_.isString(fn) && lib[fn]) || getReader(opt) || lib['identity'];
      return set(myself._interfaces , opt, 'reader', fn);
    }

    /**
     * Set a writer function for an option. If the value is a function, use it.
     * Otherwise, if it is a string and a valid library key, use it.
     * Otherwise, use the identity map.
     *
     * @method setWriter
     * @param opt Option where to set the writer
     * @param fn Writer to set
     * @private
     */
    function setWriter(opt, fn) {
      var lib = myself._libraries.mappers;
      fn = (_.isFunction(fn) && fn) || (_.isString(fn) && lib[fn]) || getWriter(opt) || lib['identity'];
      return set(myself._interfaces, opt, 'writer', fn);
    }

    /**
     * Set a validator function for an option. If the value is a function, use it.
     * Otherwise, if it is a string and a valid library key, use it.
     * Otherwise, use a predicate that always returns true.
     *
     * @method setValidator
     * @param opt Option where to set the validator
     * @param fn Validator to set
     * @private
     */
    function setValidator(opt, fn) {
      var lib = myself._libraries.predicates;
      fn = (_.isFunction(fn) && fn) || (_.isString(fn) && lib[fn]) || getValidator(opt) || lib['tautology'];
      return set(myself._interfaces, opt, 'validator', fn);
    }

    /**
     * Sets the value for the option.
     *
     * @method setValue
     * @param opt Option to set the value
     * @param value Value to set
     * @private
     */
    function setValue(opt, value) { return set(myself._options, opt, 'value', value); }

    // Init
    this.init(config.defaults, config.interfaces, config.libraries);
  }
});
