/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  '../dashboard/Utils',
  '../dashboard/Dashboard.ext',
  'common-ui/util/URLEncoder',
  '../lib/jquery'
], function(Utils, DashboardExt, Encoder, $) {

  return {

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

});

