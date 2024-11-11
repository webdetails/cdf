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


define(['./Dashboard.ext'], function(DashboardExt) {

  return {
    getView: function(view) {
      return DashboardExt.getCdfBase() + "/views/" + view;
    },

    getViewFromUrl: function() {
      var url = window.location.search;
      if(url.indexOf("view") == -1) {
        return "";
      } else {
        var regExp = url.match("[?|&]view=([^&]+)");
        if(regExp[1]) {
          return regExp[1];
        }
      }
    }
  };

});
