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

define(['../dashboard/Dashboard.ext', 'common-ui/util/URLEncoder'], function(DashboardExt, Encoder) {

  var XactionComponentExt = {

    getCdfXaction: function(path, action, solution, params) {
      if(params) {
        var parameters = {};
        for(var key in params) {
          parameters[key] = (typeof params[key]=='function') ? params[key]() : params[key];
        }
        return Encoder.encode(
          DashboardExt.getCdfBase() + "/viewAction",
          null,
          $.extend({path: DashboardExt.getFullPath( path, action ), ts: new Date().getTime()}, parameters)
        );
      } else {
        return Encoder.encode(
          DashboardExt.getCdfBase() + "/viewAction",
          null,
          {path: DashboardExt.getFullPath( path, action ), ts: new Date().getTime()}
        );
      }
    }

  };

  return XactionComponentExt;
});

