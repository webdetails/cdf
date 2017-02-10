/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  "pentaho/type/Context"
], function(Context) {

  var _context;

  /**
   * @class cdf.PentahoTypeContext
   * @amd cdf/PentahoTypeContext
   * @summary Exposes the CDF instance of Pentaho's client-side types context.
   * @classdesc This is a static class used to expose CDF's own instance of Pentaho's client-side types context.
   * @staticClass
   */
  return {
    /**
     * Gets the CDF instance of Pentaho's client-side types context.
     *
     * @return {!pentaho.type.Context} The types context.
     */
    getInstance: function() {
      if(!_context) {
        _context = new Context({application: "pentaho-cdf"});
      }
      return _context;
    }
  };
});
