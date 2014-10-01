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

define(['./lib/jquery'], function($) {

  var Encoder = {
    /*
     * If <i>args</i> is <tt>undefined</tt>, returns raw value of str
     * If <i>args</i> is <tt>null</tt> and str has no <tt>#</tt> ,returns raw value of str with encoded parameters in queryObj
     * If <i>args</i> is an <tt>object</tt> or an <tt>array</tt> and <i>str</i> has <tt>#</tt>, returns double encoded encodedUrl
     * with encoded parameters in queryObj
     */
    encode: function(str, args, queryObj) {
      "use strict"
      if(typeof args === "undefined") {
        return str;
      }
      if(args instanceof Array === false) {
        args = [ args ];
      }
      var matchArray = str.match(/{[0-9]+}/g);
      var encodedUrl = "";
      var startIndex, urlPrefix, tmp;
      if(matchArray && matchArray.length > 0) {
        // start building encodedURL with it's prefix value
        startIndex = 0;
        for(var i = 0; i < matchArray.length && i < args.length; i++) {
          urlPrefix = str.substring(startIndex, str.indexOf(matchArray[i])-1);
          // get the encoded value of args[index], index = numeric value inside brackets, e.g. '{0}'
          tmp = encodeURIComponent( args[matchArray[i].substring(1, matchArray[i].length-1)] );
          // double-encode / and \ to work around Tomcat issue
          tmp = tmp.replace("%5C", "%255C").replace("%2F", "%252F");
          encodedUrl += urlPrefix + "/" + tmp;

          startIndex = str.indexOf(matchArray[i])+matchArray[i].length;
        }
        // append suffix
        encodedUrl +=  str.substring(str.indexOf(matchArray[matchArray.length-1])+matchArray[matchArray.length-1].length, str.length);
      } else {
        // throw new SyntaxError("Please add {#} in the URL for each value in Array args");
        encodedUrl = str;
      }
      // encode and append parameters to URL
      if(queryObj) {
        encodedUrl += "?" + $.param( queryObj );
      }
      return encodedUrl;
    },

    encodeRepositoryPath: function(str) {
      "use strict"
      var encodedStr = String(str).replace(new RegExp (":", "g"), "::").replace(new RegExp ("[\\\\/]", "g"), ":");
      return encodedStr;
    },

    decodeRepositoryPath: function(str) {
      return String(str).replace(new RegExp (":", "g"), "\/").replace(new RegExp ("\/\/", "g"), ":");
    }
  };

  return Encoder;

});
