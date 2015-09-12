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

Dashboards.escapeHtml = function(input) {
  // using Negative Lookahead when replacing '&' to make sure we don't
  // double escape
  var escaped = input
  .replace(/&(?!amp;)(?!lt;)(?!gt;)(?!#34;)(?!#39;)/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/'/g,"&#39;")
  .replace(/"/g,"&#34;");
  return escaped;
};


Dashboards.getPathParameter = function ( url ) {

  url = ( url || window.location.pathname );
  url = decodeURIComponent(url);

  var pathRegex = url.match( "/:(.[^/]+)(.*)/" );
  
  if( pathRegex.length > 1 ){ 
      return (":" + pathRegex[1]).replace(/:/g, "/"); 
  }
};

Dashboards.getLocationSearchString = function() {
  return window.location.search;
};

(function (D) {
  var urlParams = undefined;
  var formProvider = undefined;

  D.getQueryParameter = function(parameterName) {
    if ( urlParams === undefined ) {
      var queryString = this.getLocationSearchString();
      urlParams = $.parseQuery( queryString );
    }
    return urlParams[parameterName] || "";

  };

  /**
   * Format a number with the given mask using the Dashboard language
   * or the one that the user specified if it exists, otherwise
   * uses the default language 'en-US'
   *
   * @param value
   * @param mask
   * @param langCode
   * @return {string} formatted number
   */
  D.numberFormat = function(value, mask, langCode) {
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
   * @param langCode
   * @param config
   */
  D.configLanguage = function(langCode, config) {
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
   * uses the default language 'en-US'
   *
   * @param date
   * @param mask
   * @param langCode
   * @return {string} formatted date
   */
  D.dateFormat = function(date, mask, langCode) {
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
   * Parse a date with a given mask
   *
   * @param date
   * @param mask
   * @return {Date} parsed date as a Date object
   */
  D.dateParse = function(date, mask) {
    return moment(date, mask).toDate();
  };

  // Conversion functions
  function _pa2obj (pArray) {
    var obj = {};
      for (var p in pArray) if (pArray.hasOwnProperty(p)) {
        var prop = pArray[p];
        obj[prop[0]] = prop[1];
      }
    return obj;
  }
  function _obj2pa (obj) {
    var pArray = [];
    for (var key in obj) if (obj.hasOwnProperty(key)) {
      pArray.push([key,obj[key]]);
    }
    return pArray;
  }

  // Exports
  // NOTE: using underscore.js predicates but we could also use Dashboards.isArray() and 
  //       Dashboards.isObject() (would need to create this one.)
  D.propertiesArrayToObject = function(pArray) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return ( _.isArray(pArray) && _pa2obj(pArray) ) || ( _.isObject(pArray) && pArray ) || undefined;  
  };

  D.objectToPropertiesArray = function(obj) {
    // Mantra 1: "Order matters!"
    // Mantra 2: "Arrays are Objects!"
    return ( _.isArray(obj) && obj) || ( _.isObject(obj) && _obj2pa(obj)) || undefined;
  };

})(Dashboards);

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
Dashboards.eachValuesArray = function(values, opts, f, x) {
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

      if (valSpec.length > 1) {
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
Dashboards.parseMultipleValues = function(value) {
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
Dashboards.normalizeValue = function(value) {
  if(value === '' || value == null) { return null; }
  if(this.isArray(value) && !value.length) return null;
  return value;
};

/**
 * Determines if a value is considered an array.
 * @param {*} value the value.
 * @return {boolean}
 *
 * @static
 */
Dashboards.isArray = function(value) {
  // An array or array like?
  return !!value &&
         ((value instanceof Array) ||
          (typeof value === 'object' && value.join && value.length != null));
};

/**
 * Determines if two values are considered equal.
 * @param {*} a the first value.
 * @param {*} b the second value.
 * @return {boolean}
 *
 * @static
 */
Dashboards.equalValues = function(a, b) {
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
Dashboards.hsvToRgb = function(h, s, v) {
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

/**
 * UTF-8 data encode / decode
 * http://www.webtoolkit.info/
 **/
function encode_prepare_arr(value) {
  if(typeof value == "number"){
    return value;
  } else if ($.isArray(value)){
    var a = new Array(value.length);
    $.each(value,function(i,val){
      a[i] = encode_prepare(val);
    });
    return a;
  }
  else{
    return encode_prepare(value);
  }
};

function encode_prepare( s )
{
  if (s != null) {
    s = s.replace(/\+/g," ");
    /* CDF-271 jQuery 1.9.1 deprecated function $.browser */
    //if ($.browser == "msie" || $.browser == "opera"){
    if((navigator.userAgent.toLowerCase().indexOf('msie') != -1)
      || (navigator.userAgent.toLowerCase().indexOf('opera') != -1)) {

      return Utf8.decode(s);
    }
  }
  return s;
};


/**
*
* UTF-8 data encode / decode
* http://www.webtoolkit.info/
*
**/ 


var Utf8 = {

  // public method for url encoding
  encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }

    return utftext;
  },

  // public method for url decoding
  decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = 0, c2 = 0, c3 = 0;

    while ( i < utftext.length ) {

      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }

    }

    return string;
  }

}

function getURLParameters(sURL)
{
  if (sURL.indexOf("?") > 0){

    var arrParams = sURL.split("?");
    var arrURLParams = arrParams[1].split("&");
    var arrParam = [];

    for (var i=0;i<arrURLParams.length;i++){
      var sParam =  arrURLParams[i].split("=");

      if (sParam[0].indexOf("param",0) == 0){
        var parameter = [sParam[0].substring(5,sParam[0].length),unescape(sParam[1])];
        arrParam.push(parameter);
      }
    }

  }

  return arrParam;
}

function toFormatedString(value) {
  value += '';
  var x = value.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1))
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  return x1 + x2;
}

//quote csv values in a way compatible with CSVTokenizer
function doCsvQuoting(value, separator, alwaysEscape){
  var QUOTE_CHAR = '"';
  if(separator == null) {
    return value;
  }
  if(value == null) {
    return null;
  }
  if(value.indexOf(QUOTE_CHAR) >= 0){
    //double them
    value = value.replace(QUOTE_CHAR, QUOTE_CHAR.concat(QUOTE_CHAR));
  }
  if(alwaysEscape || value.indexOf(separator) >= 0){
    //quote value
    value =  QUOTE_CHAR.concat(value, QUOTE_CHAR);
  }
  return value;
}

/**
*
*  Javascript sprintf
*  http://www.webtoolkit.info/
*
*
**/
sprintfWrapper = {

  init : function () {

    if (typeof arguments == 'undefined') {
      return null;
    }
    if (arguments.length < 1) {
      return null;
    }
    if (typeof arguments[0] != 'string') {
      return null;
    }
    if (typeof RegExp == 'undefined') {
      return null;
    }

    var string = arguments[0];
    var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
    var matches = new Array();
    var strings = new Array();
    var convCount = 0;
    var stringPosStart = 0;
    var stringPosEnd = 0;
    var matchPosEnd = 0;
    var newString = '';
    var match = null;

    while ((match = exp.exec(string))) {
      if (match[9]) {
        convCount += 1;
      }

      stringPosStart = matchPosEnd;
      stringPosEnd = exp.lastIndex - match[0].length;
      strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

      matchPosEnd = exp.lastIndex;

      var negative = parseInt(arguments[convCount]) < 0;
      if(!negative) negative = parseFloat(arguments[convCount]) < 0;

      matches[matches.length] = {
        match: match[0],
        left: match[3] ? true : false,
        sign: match[4] || '',
        pad: match[5] || ' ',
        min: match[6] || 0,
        precision: match[8],
        code: match[9] || '%',
        negative: negative,
        argument: String(arguments[convCount])
      };
    }
    strings[strings.length] = string.substring(matchPosEnd);

    if (matches.length == 0) {
      return string;
    }
    if ((arguments.length - 1) < convCount) {
      return null;
    }

    match = null;
    var i = null;

    for (i=0; i<matches.length; i++) {
      var m =matches[i];
      var substitution;
      if (m.code == '%') {
        substitution = '%'
      }
      else if (m.code == 'b') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(2));
        substitution = sprintfWrapper.convert(m, true);
      }
      else if (m.code == 'c') {
        m.argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(m.argument)))));
        substitution = sprintfWrapper.convert(m, true);
      }
      else if (m.code == 'd') {
        m.argument = toFormatedString(String(Math.abs(parseInt(m.argument))));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 'f') {
        m.argument = toFormatedString(String(Math.abs(parseFloat(m.argument)).toFixed(m.precision ? m.precision : 6)));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 'o') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(8));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 's') {
        m.argument = m.argument.substring(0, m.precision ? m.precision : m.argument.length)
        substitution = sprintfWrapper.convert(m, true);
      }
      else if (m.code == 'x') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
        substitution = sprintfWrapper.convert(m);
      }
      else if (m.code == 'X') {
        m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
        substitution = sprintfWrapper.convert(m).toUpperCase();
      }
      else {
        substitution = m.match;
      }

      newString += strings[i];
      newString += substitution;
    }

    newString += strings[i];

    return newString;

  },

  convert : function(match, nosign){
    if (nosign) {
      match.sign = '';
    } else {
      match.sign = match.negative ? '-' : match.sign;
    }
    var l = match.min - match.argument.length + 1 - match.sign.length;
    var pad = new Array(l < 0 ? 0 : l).join(match.pad);
    if (!match.left) {
      if (match.pad == '0' || nosign) {
        return match.sign + pad + match.argument;
      } else {
        return pad + match.sign + match.argument;
      }
    } else {
      if (match.pad == '0' || nosign) {
        return match.sign + match.argument + pad.replace(/0/g, ' ');
      } else {
        return match.sign + match.argument + pad;
      }
    }
  }
}

sprintf = sprintfWrapper.init;


/*
 * UTILITY STUFF
 *
 *
 */

(function() {
  function accessorDescriptor(field, fun)
  {
    var desc = {
      enumerable: true,
      configurable: true
    };
    desc[field] = fun;
    return desc;
  }

  this.defineGetter = function defineGetter(obj, prop, get)
  {
    if (Object.prototype.__defineGetter__)
      return obj.__defineGetter__(prop, get);
    if (Object.defineProperty)
      return Object.defineProperty(obj, prop, accessorDescriptor("get", get));

    throw new Error("browser does not support getters");
  }

  this.defineSetter = function defineSetter(obj, prop, set)
  {
    if (Object.prototype.__defineSetter__)
      return obj.__defineSetter__(prop, set);
    if (Object.defineProperty)
      return Object.defineProperty(obj, prop, accessorDescriptor("set", set));

    throw new Error("browser does not support setters");
  }
})();



