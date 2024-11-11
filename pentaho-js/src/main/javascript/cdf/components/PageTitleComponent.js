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
  '../dashboard/Utils',
  '../lib/jquery',
  './NavigatorBaseComponent'
], function(DashboardExt, Utils, $, NavigatorBaseComponent) {

  return NavigatorBaseComponent.extend({
    update: function() {
      var myself = this;
      if(NavigatorBaseComponent.navigatorResponse == -1) {
        $.getJSON(DashboardExt.getJSONSolution() + "?mode=contentlist&path=" + (NavigatorBaseComponent.path || Utils.getPathParameter()), function(json) {
          myself.processPageTitleResponse(json);
        });
      } else {
        this.processPageTitleResponse(NavigatorBaseComponent.navigatorResponse);
      }
    },
    processPageTitleResponse: function(json) {
      // Store the value
      NavigatorBaseComponent.navigatorResponse = json;

      var file = this.findPageTitleObject(json.content, json.id);

      if(file.title != undefined && file.description != undefined) {
        $("#"+this.htmlObject).text(file.title + (file.description != "" ? (" - " + file.description) : ""));
      }
    },
    findPageTitleObject: function(folders, id) {
      for(var i = 0; i < folders.length; i++) {
        var file = folders[i];
        if(file.id == id) {
          return file;
        } else if((id + "/").indexOf(file.id + "/") >= 0) {
          // we're on the good path
          return this.findPageTitleObject(file.folders, id);
        } else {
          continue;
        }
      }
    }
  });

});
