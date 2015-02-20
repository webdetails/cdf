/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
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

define(['../Logger', '../lib/underscore', '../lib/moment', '../lib/CCC/cdo', '../lib/jquery', '../lib/queryParser'],
    function(Logger, _, moment, cdo, $) {

  var Utils = {};

  Utils.escapeHtml = function(input) {
    // Check if the input is already escaped. It assumes that, if there is an escaped char in the input then, 
    // the input is fully escaped. Using http://webdesign.about.com/od/localization/l/blhtmlcodes-ascii.htm 
    // as characters example
    var regexNumericTags = /&#([0-9][0-9]?[0-9]?[0-9]?);/;
    var regexAlphabeticTags = /&([a-zA-Z]+);/;
    var regexHexTags = /&#x[A-F0-9][A-F0-9];/;
    if(regexNumericTags.test(input) || regexAlphabeticTags.test(input) || regexHexTags.test(input)) {
      return input;
    }
    
    var escaped = input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;")
      .replace(/"/g, "&#34;");

    return escaped;
  };
  
  Utils.getPathParameter = function(url) {  
  
    url = (url || window.location.pathname);
    url = decodeURIComponent(url);
  
    var pathRegex = url.match("/:(.[^/]+)(.*)/");
    
    if(pathRegex && pathRegex.length > 1) { 
      return (":" + pathRegex[1]).replace(/:/g, "/"); 
    }
  };

  Utils.getLocationSearchString = function() {
    return window.location.search;
  };

  var urlParams = undefined;

  Utils.getQueryParameter = function(parameterName) {
    if(urlParams === undefined) {
      urlParams = $.parseQuery(this.getLocationSearchString());
    }

    return urlParams[parameterName] || "";
  };

  var formProvider = undefined;

  /**
   * Format a number with the given mask using the Dashboard language
   * or the one that the user specified if it exists, otherwise
   * uses the default language 'en-US'
   *
   * @param value
   * @param mask
   * @param langCode
   * @returns {string} formatted number
   */
  Utils.numberFormat = function(value, mask, langCode) {
    if(formProvider === undefined) {
      formProvider = cdo.format.language().createChild();
    }
    if(langCode != undefined) {
      return cdo.format.language(langCode).number().mask(mask)(value);
    }

    return formProvider.number().mask(mask)(value);
  };

  /**
   * Configure a new or existing language by specifying the language code
   * and a configuration object with the keywords:
   * - 'number' to configure number's format language
   * - 'dateLocale' to configure date's format language
   *
   * @param langCode
   * @param config
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
   * Format the current date with a given mask
   *
   * @param mask
   * @returns {string} formatted date
   */
  Utils.dateFormat = function(mask) {
    return moment().format(mask);
  };
    
  // Conversion functions
  function _pa2obj(pArray) {
    var obj = {};
    for(var p in pArray) {
      if(pArray.hasOwnProperty(p)) {
        var prop = pArray[p];
        obj[prop[0]] = prop[1];
      }
    }
    return obj;
  };
  
  function _obj2pa(obj) {
    var pArray = [];
    for(var key in obj) if (obj.hasOwnProperty(key)) {
      pArray.push([key,obj[key]]);
    }
    return pArray;
  };
  
  Utils.propertiesArrayToObject = function(pArray) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return (_.isArray(pArray) && _pa2obj(pArray)) || (_.isObject(pArray) && pArray) || undefined;  
  };
  
  Utils.objectToPropertiesArray = function(obj) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return (_.isArray(obj) && obj) || (_.isObject(obj) && _obj2pa(obj)) || undefined;
  };
  


  Utils.getURLParameters = function(sURL) {
    if(sURL.indexOf("?") > 0){
  
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
  
  //quote csv values in a way compatible with CSVTokenizer
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

  Utils.ev =  function(o) {
    return typeof o == 'function' ? o() : o;
  };

  Utils.post = function(url, obj) {
  
    var form = '<form action="' + url + '" method="post">';
    for(var o in obj) {
  
      var v = (typeof obj[o] == 'function') ? obj[o]() : obj[o];
  
      if(typeof v == 'string') {
        v = v.replace(/"/g , "\'")
      }
  
      form += '"<input type="hidden" name="' + o + '" value="' + v + '"/>';
    }
    form += '</form>';
    jQuery(form).appendTo('body').submit().remove();
  };
  
  Utils.clone = function clone(obj) {
  
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

  Utils.addArgs = function(url) {
    if(url != undefined) {
      this.args = getURLParameters(url);
    }
  };
  
  Utils.getArgValue = function(key) {
    for(i = 0; i < this.args.length; i++) {
      if(this.args[i][0] == key) {
        return this.args[i][1];
      }
    }
  
    return undefined;
  };

  /**
   * Traverses each <i>value</i>, <i>label</i> and <i>id</i> triple of a <i>values array</i>.
   *
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
  
  // Based on the algorithm described at http://en.wikipedia.org/wiki/HSL_and_HSV.
  /**
   * Converts an HSV to an RGB color value.
   * 
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
    
    var h6 = (h % 360) /60;
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
