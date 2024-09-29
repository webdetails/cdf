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
  '../lib/jquery'
], function(DashboardExt, $) {

  return {
    getDoQuery: function() {
      return DashboardExt.getPluginBase('cda') + "/doQuery?";
    },

    getWebsocketQuery: function() {
      return DashboardExt.getPluginWebsocketBase('cda') + "/query";
    },

    getUnwrapQuery: function(parameters) {
      return DashboardExt.getPluginBase('cda') + "/unwrapQuery?" + $.param(parameters, /* traditional */true);
    }
  };

});
