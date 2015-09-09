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
  '../dashboard/Utils',
  '../dashboard/Dashboard.ext',
  'common-ui/util/URLEncoder',
  '../lib/jquery'
], function(Utils, DashboardExt, Encoder, $) {

  var XactionComponentExt = {

    getCdfXaction: function(path, action, solution, params) {
      if(params) {
        var parameters = {};
        for(var key in params) if(params.hasOwnProperty(key)) {
          parameters[key] = Utils.ev(params[key]);
        }
        return Encoder.encode(
          DashboardExt.getCdfBase() + "/viewAction",
          null,
          $.extend({path: DashboardExt.getFullPath(path, action), ts: new Date().getTime()}, parameters)
        );
      } else {
        return Encoder.encode(
          DashboardExt.getCdfBase() + "/viewAction",
          null,
          {path: DashboardExt.getFullPath(path, action), ts: new Date().getTime()}
        );
      }
    }

  };

  return XactionComponentExt;
});

