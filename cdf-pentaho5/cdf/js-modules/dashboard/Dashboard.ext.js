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

define([], function() {
  var ext = {
    pluginName: "pentaho-cdf",

    /**
     *
     * @param plugin
     * @returns {string}
     */
    getPluginBase: function( plugin ) {
      return CONTEXT_PATH + "plugin/" + plugin + "/api";
    },

    /**
     *
     * @returns {string}
     */
    getCdfBase: function () {
      return this.getPluginBase( this.pluginName );
    },

    /**
     * Returns the file path translated from the url.
     * The url can (or not) be encoded, so paths like /pentaho/api/repos/:path1:path2:path3:path4/myOperation
     * or /pentaho/api/repos/%3path1%3path2%3path3%3path4/myOperation will be correctly translated
     *
     * @returns {string} the file path
     */
    getFilePathFromUrl: function(){
      var filePath = window.location.pathname;
      if(filePath.indexOf("/:") == -1){
        filePath = decodeURIComponent(window.location.pathname);
      }
      if(filePath.indexOf("/:") > 0){
        var regExp = filePath.match("(/:)(.*)(/)");
        if(regExp[2]){
          return "/"+regExp[2].replace(new RegExp(":", "g"), "/");
        }
      }
    }
  };

  return ext;
});
