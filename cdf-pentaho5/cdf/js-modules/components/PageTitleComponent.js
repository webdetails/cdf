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
  '../dashboard/Dashboard.ext',
  '../dashboard/Utils',
  '../lib/jquery',
  './NavigatorBaseComponent'
], function(DashboardExt, Utils, $, NavigatorBaseComponent) {

  var PageTitleComponent = NavigatorBaseComponent.extend({
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

  return PageTitleComponent;

});
