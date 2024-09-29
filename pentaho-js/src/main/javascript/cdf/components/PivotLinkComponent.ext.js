/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


define([
  '../dashboard/Dashboard.ext',
  'common-ui/util/URLEncoder',
  'pentaho/environment'
], function(DashboardExt, Encoder, environment) {

  return {

    getPivot: function(solution, path, action) {
      var url = environment.server.root + "plugin/jpivot/Pivot";

      var fullPath = path.indexOf(DashboardExt.pluginName) === 0 ? (DashboardExt.samplesBasePath + path) : path;

      var parameters = {
        solution: solution || "system",
        path: fullPath,
        action: action
      };

      return Encoder.encode(url, null, parameters);
    }

  };

});
