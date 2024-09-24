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

define(['../dashboard/Dashboard.ext'], function(DashboardExt) {

  return {

    getCccScriptPath: function(scriptName) {
      // Dashboards.context path example:
        // "/public/cde/mine/MySampleDash.wcdf"
        // Remove the last segment.
        // TODO: Using the script name without the dashboard name prefix, for backward compatibility.
        
        //return Dashboards.context.path.replace(/[^\/]+$/, "") + scriptName + ".js";
      return DashboardExt.getFilePathFromUrl().replace(/[^\/]+$/, "") + scriptName + ".js";
    }
  };

});
