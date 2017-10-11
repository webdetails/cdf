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

/*
 * UTF-8 data encode / decode
 * http://www.webtoolkit.info/
 */

define(["../lib/jquery"], function($) {

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

  /**
   * @class cdf.dashboard.Utf8Encoder
   * @amd cdf/dashboard/Utf8Encoder
   * @summary Auxiliary UTF-8 encoder.
   * @classdesc Auxiliary UTF-8 encoder.
   * @see http://www.webtoolkit.info/javascript_utf8.html
   * @staticClass
   */
  return /** @lends cdf.dashboard.Utf8Encoder */ {
    /**
     * @summary Prepares a UTF-8 string to be used in Opera or Internet Explorer.
     * @description Prepares a UTF-8 string to be used in Opera or Internet Explorer.
     *
     * @param {string} s String to be prepared.
     * @return {?string} The prepared string.
     */
    encode_prepare: function(s) {
      if(s != null) {
        s = s.replace(/\+/g," ");
        if((navigator.userAgent.toLowerCase().indexOf('msie') != -1)
          || (navigator.userAgent.toLowerCase().indexOf('opera') != -1)) {

          return Utf8.decode(s);
        }
      }
      return s;
    },

    /**
     * @summary Prepares an array containing UTF-8 strings to be used in Opera or Internet Explorer.
     * @description Prepares an array containing UTF-8 strings to be used in Opera or Internet Explorer.
     *
     * @param {string|array|number} value Value to be prepared.
     * @return {string|array|number} The prepared value.
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

});
