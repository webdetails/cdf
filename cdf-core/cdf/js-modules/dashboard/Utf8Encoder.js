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
 * Auxiliary UTF8 encoder. Request as 'cdf/dashboard/Utf8Encoder'.
 *
 * @module Utf8Encoder
 * @class Utf8Encoder
 */
define(["../lib/jquery"], function($) {

  /*
   *
   * UTF-8 data encode / decode
   * http://www.webtoolkit.info/
   *
   */
  var Utf8 = {

    // public method for url encoding
    encode: function(string) {
      string = string.replace(/\r\n/g, "\n");
      var utftext = "";

      for(var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);

        if(c < 128) {
          utftext += String.fromCharCode(c);
        } else if((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }

      return utftext;
    },

    // public method for url decoding
    decode: function(utftext) {
      var string = "";
      var i = 0;
      var c = 0, c2 = 0, c3 = 0;

      while(i < utftext.length) {
        c = utftext.charCodeAt(i);
        if(c < 128) {
          string += String.fromCharCode(c);
          i++;
        } else if((c > 191) && (c < 224)) {
          c2 = utftext.charCodeAt(i + 1);
          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        } else {
          c2 = utftext.charCodeAt(i + 1);
          c3 = utftext.charCodeAt(i + 2);
          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }
      }
      return string;
    }
  };

  /*
   * UTF-8 data encode / decode
   * http://www.webtoolkit.info/
   */
  var Utf8Encoder = {
    /**
     * Prepares an UTF8 string to be used in Opera or Internet Explorer
     *
     * @method encode_prepare
     * @param s String to be prepared
     * @return {*} Encoded/Prepared String
     *
     * @static
     */
    encode_prepare: function(s) {
      if(s != null) {
        s = s.replace(/\+/g," ");
        /* CDF-271 jQuery 1.9.1 deprecated function $.browser */
        //if($.browser == "msie" || $.browser == "opera") {
        if((navigator.userAgent.toLowerCase().indexOf('msie') != -1)
          || (navigator.userAgent.toLowerCase().indexOf('opera') != -1)) {

          return Utf8.decode(s);
        }
      }
      return s;
    },

    /**
     * Prepares an array containing UTF8 strings to be used in Opera or Internet Explorer
     *
     * @method encode_prepare_arr
     * @param value Array to be encoded
     * @return {Array} Array with encoded/prepared elements
     *
     * @static
     */
    encode_prepare_arr: function(value) {
      var myself = this;

      if(typeof value == "number") {
        return value;
      } else if($.isArray(value)) {
        var a = new Array(value.length);
        $.each(value,function(i, val) {
          a[i] = myself.encode_prepare(val);
        });
        return a;
      } else {
        return myself.encode_prepare(value);
      }
    }
  };

  return Utf8Encoder;
});
