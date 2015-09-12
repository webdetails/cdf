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
 * A collection of utility functions. Require as 'cdf/dashboard/Utils'.
 *
 * @class Utils
 * @module Utils
 */
define([
  '../Logger',
  'amd!../lib/underscore',
  '../lib/moment',
  '../lib/CCC/cdo',
  '../lib/jquery',
  'amd!../lib/queryParser'
], function(Logger, _, moment, cdo, $) {

  var Utils = {};

  var formProvider = undefined;
  var urlParams = undefined;

  /**
   * Escapes a string into an html safe string.
   * It assumes that, if there is an escaped char in the input then the input is fully escaped.
   *
   * @method escapeHtml
   * @param input Input string to be escape
   * @return Escaped string
   * @static
   */
  Utils.escapeHtml = function(input) {
    // using Negative Lookahead when replacing '&' to make sure we don't
    // double escape
    var escaped = input
    .replace(/&(?!amp;)(?!lt;)(?!gt;)(?!#34;)(?!#39;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&#34;");
    return escaped;
  };

  /**
   * Given a url containing an encoded Pentaho path (:home:admin:Test.wcdf), returns the encoded path.
   *
   * @method getPathParameter
   * @param url url to parse
   * @return path parameter value or null if not available
   * @static
   */
  Utils.getPathParameter = function(url) {
  
    url = (url || window.location.pathname);
    url = decodeURIComponent(url);
  
    var pathRegex = url.match("/:(.[^/]+)(.*)/");
    
    if(pathRegex && pathRegex.length > 1) { 
      return (":" + pathRegex[1]).replace(/:/g, "/"); 
    }
  };

  /**
   * Returns the query string part of the url.
   *
   * @method getLocationSearchString
   * @return Query string
   * @static
   */
  Utils.getLocationSearchString = function() {
    return window.location.search;
  };

  /**
   * Returns the value of a query string parameter.
   *
   * @method getQueryParameter
   * @param parameterName parameter name
   * @return value of the query parameter or null
   * @static
   */
  Utils.getQueryParameter = function(parameterName) {
    if(urlParams === undefined) {
      urlParams = $.parseQuery(this.getLocationSearchString());
    }

    return urlParams[parameterName] || "";
  };

  /**
   * Format a number with the given mask using the Dashboard language
   * or the one that the user specified if it exists, otherwise
   * uses the default language 'en-US'.
   *
   * @method numberFormat
   * @param value number value to be formatted
   * @param mask mask with format for the value
   * @param langCode language to use in format
   * @return {string} formatted number
   * @static
   */
  Utils.numberFormat = function(value, mask, langCode) {
    if(formProvider === undefined) {
      formProvider = cdo.format.language().createChild();
    }

    if(langCode != null) {
      var otherFormatP = cdo.format.language(langCode).createChild();
      otherFormatP.number({mask: mask});
      return otherFormatP.number()(value);
    }

    formProvider.number({mask: mask});
    return formProvider.number()(value);
  };

  /**
   * Configure a new or existing language by specifying the language code
   * and a configuration object with the keywords:
   * - 'number' to configure number's format language
   * - 'dateLocale' to configure date's format language
   *
   * @method configLanguage
   * @param langCode language to be configured
   * @param config object with the language configuration
   * @static
   */
  Utils.configLanguage = function(langCode, config) {
    var dateConfig = config.dateLocale || {};
    var mLocale = moment.locale();
    delete config.dateLocale;

    cdo.format.language(langCode, config);
    moment.locale(langCode, dateConfig);
    moment.locale(mLocale);
  };

  /**
   * Format a date with a given mask using the Dashboard language
   * or the one that the user specified if it exists, otherwise
   * uses the default language 'en-US'.
   *
   * @method dateFormat
   * @param date date object to be formatted
   * @param mask mask with format for the date
   * @param langCode language to use in format
   * @return {string} formatted date
   * @static
   */
  Utils.dateFormat = function(date, mask, langCode) {
    var toFormat = moment(date);

    if(!toFormat.isValid()) {
      return toFormat.toDate();
    }

    if(langCode != null) {
      //Testing if langCode exists. Use langCode if true, and 'en-US' otherwise
      if(moment.localeData(langCode) === null) {
        langCode = 'en-US';
      }

      toFormat.locale(langCode);
    }

    return toFormat.format(mask);
  };

  /**
   * Parse a date with a given mask.
   *
   * @method dateParse
   * @param date string with date to be parsed
   * @param mask mask with format for date
   * @return {Date} parsed date as a Date object
   * @static
   */
  Utils.dateParse = function(date, mask) {
    return moment(date, mask).toDate();
  };
    
  // Conversion functions

  /**
   * Converts an array to an object.
   *
   * @method _pa2obj
   * @param pArray array to be converted
   * @return an object with the same info as the array
   * @private
   * @static
   */
  function _pa2obj(pArray) {
    var obj = {};
    for(var p in pArray) if(pArray.hasOwnProperty(p)) {
      obj[pArray[p][0]] = pArray[p][1];
    }
    return obj;
  }

  /**
   * Converts an object to an array.
   *
   * @method _obj2pa
   * @param obj object to convert
   * @return {Array}
   * @private
   * @static
   */
  function _obj2pa(obj) {
    var pArray = [];
    for(var key in obj) if(obj.hasOwnProperty(key)) {
      pArray.push([key, obj[key]]);
    }
    return pArray;
  }

  /**
   * Converts an array to an object.
   *
   * @method propertiesArrayToObject
   * @param pArray Array to Convert
   * @return The object represented by the array or undefined if argument is not an array
   * @static
   */
  Utils.propertiesArrayToObject = function(pArray) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return (_.isArray(pArray) && _pa2obj(pArray)) || (_.isObject(pArray) && pArray) || undefined;
  };

  /**
   * Converts an object to an array.
   *
   * @method objectToPropertiesArray
   * @param obj
   * @return An array or undefined if argument is not an object
   * @static
   */
  Utils.objectToPropertiesArray = function(obj) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return (_.isArray(obj) && obj) || (_.isObject(obj) && _obj2pa(obj)) || undefined;
  };

  /**
   * Gets the url parameters from a URL. CDF url parameters are defined as those that are present in the query
   * string with names starting with the string 'param'. So, for a query string like ?paramfoo=bar, you'd get
   * a parameter foo with value bar.
   *
   * @method getURLParameters
   * @param sURL URL with the query string to be parsed
   * @return {Array} Array with the parsed parameters. Each element is an array with two positions, the first being
   * the parameter name and the second the value
   * @static
   */
  Utils.getURLParameters = function(sURL) {
    if(sURL.indexOf("?") > 0) {

      var arrParams = sURL.split("?");
      var arrURLParams = arrParams[1].split("&");
      var arrParam = [];

      for(var i = 0; i < arrURLParams.length; i++) {
        var sParam =  arrURLParams[i].split("=");

        if(sParam[0].indexOf("param", 0) == 0) {
          var parameter = [sParam[0].substring(5, sParam[0].length), unescape(sParam[1])];
          arrParam.push(parameter);
        }
      }
    }

    return arrParam;
  };

  /**
   * Formats a string according to some arcane and unreadable algorithm. Just ignore and don't use it.
   *
   * @method toFormatedString
   * @param value Value to be formatted
   * @return {string} Some piece of formatted string
   * @private
   * @static
   * @deprecated
   */
  Utils.toFormatedString = function(value) {
    value += '';
    var x = value.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while(rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };

  /**
   * Quote csv values in a way compatible with CSVTokenizer.
   *
   * @method doCsvQuoting
   * @param value Value quote
   * @param separator Separator to use when quoting
   * @param alwaysEscape Boolean that indicates if the value should always be escaped or just when needed
   * @return {*} The escaped value
   * @static
   *
   */
  Utils.doCsvQuoting = function(value, separator, alwaysEscape) {
    var QUOTE_CHAR = '"';
    if(separator == null) {
      return value;
    }
    if(value == null) {
      return null;
    }
    if(value.indexOf(QUOTE_CHAR) >= 0) {
      //double them
      value = value.replace(QUOTE_CHAR, QUOTE_CHAR.concat(QUOTE_CHAR));
    }
    if(alwaysEscape || value.indexOf(separator) >= 0) {
      //quote value
      value =  QUOTE_CHAR.concat(value, QUOTE_CHAR);
    }
    return value;
  };

  /**
   * Evaluates the argument. If it is a function, calls the function, otherwise returns the argument.
   *
   * @method ev
   * @param o the object to be evaluated
   * @return {*} the object if the object is not a function. Otherwise, invokes the function and returns the
   * result
   * @static
   */
  Utils.ev = function(o) {
    return typeof o == 'function' ? o() : o;
  };

  /**
   * Performs a post to the server.
   *
   * @method post
   * @param url Url where to post
   * @param obj Parameter object
   * @static
   */
  Utils.post = function(url, obj) {
  
    var form = '<form action="' + url + '" method="post">';
    for(var o in obj) {
  
      var v = Utils.ev(obj[o]);
  
      if(typeof v == 'string') {
        v = v.replace(/"/g, "\'");
      }
  
      form += '"<input type="hidden" name="' + o + '" value="' + v + '"/>';
    }
    form += '</form>';
    $(form).appendTo('body').submit().remove();
  };

  /**
   * Deep clones an object. This method is deprecated, use $.extend(true, {}, obj).
   *
   * @method clone
   * @param obj Object to clone
   * @return Cloned object
   * @static
   * @deprecated
   */
  Utils.clone = function(obj) {
  
    var c = obj instanceof Array ? [] : {};
  
    for(var i in obj) {
      var prop = obj[i];
  
      if(typeof prop == 'object') {
        if(prop instanceof Array) {
          c[i] = [];
  
          for(var j = 0; j < prop.length; j++) {
            if(typeof prop[j] != 'object') {
              c[i].push(prop[j]);
            } else {
              c[i].push(this.clone(prop[j]));
            }
          }
        } else {
          c[i] = this.clone(prop);
        }
      } else {
        c[i] = prop;
      }
    }
  
    return c;
  };

  /**
   * Adds the url parameters to a local object.
   *
   * @method addArgs
   * @param url
   * @static
   * @deprecated
   */
  Utils.addArgs = function(url) {
    if(url != undefined) {
      this.args = getURLParameters(url);
    }
  };

  /**
   * Gets an argument value that was previously set by calling addArgs. This is deprecated, use
   * {{#crossLink "Utils/getQueryParameter:method"}}getQueryParameter{{/crossLink}} or dashboard.context.params.
   *
   * @method getArgValue
   * @param key Argument name
   * @return the argument value or null
   * @static
   * @deprecated
   */
  Utils.getArgValue = function(key) {
    for(var i = 0; i < this.args.length; i++) {
      if(this.args[i][0] == key) {
        return this.args[i][1];
      }
    }
  
    return undefined;
  };

  /**
   * Traverses each <i>value</i>, <i>label</i> and <i>id</i> triple of a <i>values array</i>.
   *
   * @method eachValuesArray
   * @param {Array.<Array.<*>>} values the values array - an array of arrays.
   *   <p>
   *   Each second-level array is a <i>value specification</i> and contains
   *   a value and, optionally, a label and an id.
   *   It may have the following forms:
   *   </p>
   *   <ul>
   *     <li><tt>[valueAndLabel]</tt> - when having <i>length</i> one</li>
   *     <li><tt>[value, label,...]</tt> - when having <i>length</i> two or more and
   *         <tt>opts.valueAsId</tt> is falsy
   *     </li>
   *     <li><tt>[id, valueAndLabel,..]</tt> - when having <i>length</i> two or more and
   *         <tt>opts.valueAsId</tt> is truthy
   *     </li>
   *   </ul>
   * @param {object} opts an object with options.
   *
   * @param {?boolean=} [opts.valueAsId=false] indicates if the first element of
   *   the value specification array is the id, instead of the value.
   *
   * @param {function(string, string, string, number):?boolean} f
   * the traversal function that is to be called with
   * each value-label-id triple and with the JS content <tt>x</tt>.
   * The function is called with arguments: <tt>value</tt>, <tt>label</tt>,
   * <tt>id</tt> and <tt>index</tt>.
   * <p>
   * When the function returns the value <tt>false</tt>, traversal is stopped,
   * and <tt>false</tt> is returned.
   * </p>
   *
   * @param {object} x the JS context object on which <tt>f</tt> is to be called.
   *
   * @return {boolean} indicates if the traversal was complete, <tt>true</tt>,
   *   or if explicitly stopped by the traversal function, <tt>false</tt>.
   *   @static
   */
  Utils.eachValuesArray = function(values, opts, f, x) {
    if(typeof opts === 'function') {
      x = f;
      f = opts;
      opts = null;
    }

    var valueAsId = !!(opts && opts.valueAsId);
    for(var i = 0, j = 0, L = values.length; i < L; i++) {
      var valSpec = values[i];
      if(valSpec && valSpec.length) {
        var v0 = valSpec[0];
        var value, label, id = undefined; // must reset on each iteration
  
        if(valSpec.length > 1) {
          if(valueAsId) { id = v0; }
          label = "" + valSpec[1];
          value = (valueAsId || v0 == null) ? label : ("" + v0);
        } else {
          value = label = "" + v0;
        }

        if(f.call(x, value, label, id, j, i) === false) { return false; }
        j++;
      }
    }
  
    return true;
  };

  /**
   * Given a parameter value obtains an equivalent values array.
   *
   *
   * <p>The parameter value may encode multiple values in a string format.</p>
   * <p>A nully (i.e. null or undefined) input value or an empty string result in <tt>null</tt>,
   *    and so the result of this method is normalized.
   * </p>
   * <p>
   * A string value may contain multiple values separated by the character <tt>|</tt>.
   * </p>
   * <p>An array or array-like object is returned without modification.</p>
   * <p>Any other value type returns <tt>null</tt>.</p>
   *
   * @method parseMultipleValues
   * @param {*} value
   * a parameter value, as returned by {@link Dashboards.getParameterValue}.
   *
   * @return {null|!Array.<*>|!{join}} null or an array or array-like object.
   *
   * @static
   */
  Utils.parseMultipleValues = function(value) {
    if(value != null && value !== '') {
      // An array or array like?
      if(this.isArray(value)) { return value; }
      if(typeof value === "string") { return value.split("|"); }
    }
  
    // null or of invalid type
    return null;
  };

  /**
   * Normalizes a value so that <tt>undefined</tt>, empty string
   * and empty array, are all translated to <tt>null</tt>.
   *
   * @method normalizeValue
   * @param {*} value the value to normalize.
   * @return {*} the normalized value.
   *
   * @static
   */
  Utils.normalizeValue = function(value) {
    if(value === '' || value == null) { return null; }
    if(this.isArray(value) && !value.length) { return null; }
    return value;
  };

  /**
   * Determines if a value is considered an array.
   *
   * @method isArray
   * @param {*} value the value.
   * @return {boolean}
   *
   * @static
   */
  Utils.isArray = function(value) {
    // An array or array like?
    return !!value &&
      ((value instanceof Array) || (typeof value === 'object' && value.join && value.length != null));
  };

  /**
   * Determines if two values are considered equal.
   *
   * @method equalValues
   * @param {*} a the first value.
   * @param {*} b the second value.
   * @return {boolean}
   *
   * @static
   */
  Utils.equalValues = function(a, b) {
    // Identical or both null/undefined?
    a = this.normalizeValue(a);
    b = this.normalizeValue(b);

    if(a === b) { return true; }

    if(this.isArray(a) && this.isArray(b)) {
      var L = a.length;
      if(L !== b.length) { return false; }
      while(L--) { if(!this.equalValues(a[L], b[L])) { return false; } }
      return true;
    }

    // Last try, give it to JS equals
    return a == b;
  };

  /**
   * Converts an HSV to an RGB color value.
   * Based on the algorithm described at http://en.wikipedia.org/wiki/HSL_and_HSV.
   *
   * @method hsvToRgb
   * @param {number} h Hue as a value between 0 - 360 (degrees)
   * @param {number} s Saturation as a value between 0 - 100 (%)
   * @param {number} v Value as a value between 0 - 100 (%)
   * @return {string} An rgb(...) color string.
   *
   * @static
   */
  Utils.hsvToRgb = function(h, s, v) {
    v = v / 100; // 0 - 1
    s = s / 100; // idem
    
    var h6 = (h % 360) / 60;
    var chroma = v * s;
    var m = v - chroma;
    var h6t = Math.abs((h6 % 2) - 1);
    //var r = 1 - h6t;
    //var x = chroma * r;
    var x_m = v * (1 - s * h6t); // x + m
    var c_m = v; // chroma + m
    // floor(h6) (0, 1, 2, 3, 4, 5)

    var rgb;
    switch(~~h6) {
      case 0: rgb = [c_m, x_m, m  ]; break;
      case 1: rgb = [x_m, c_m, m  ]; break;
      case 2: rgb = [m,   c_m, x_m]; break;
      case 3: rgb = [m,   x_m, c_m]; break;
      case 4: rgb = [x_m, m,   c_m]; break;
      case 5: rgb = [c_m, m,   x_m]; break;
    }

    rgb.forEach(function(val, i) {
      rgb[i] = Math.min(255, Math.round(val * 256));
    });

    return "rgb(" + rgb.join(",") + ")";
  };

  return Utils;

});
