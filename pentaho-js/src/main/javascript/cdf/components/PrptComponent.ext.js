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
  '../dashboard/Dashboard.ext',
  'common-ui/util/URLEncoder',
  'pentaho/environment'
], function(DashboardExt, Encoder, environment) {

  return {

    getReport: function(path, callvar, parameters) {
      var isStringPath = typeof path === "string" || path instanceof String;

      /* callvar = report || viewer */
      var url = environment.server.root + "api/repos/{0}/" + callvar;
      var encodedPath = Encoder.encodeRepositoryPath(
        isStringPath ? path : DashboardExt.composePath(path));

      return Encoder.encode(url, encodedPath, parameters);
    }

  };

});
