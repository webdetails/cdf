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
  './NavigatorBaseComponent',
  '../lib/jquery',
  'amd!../lib/jquery.jdMenu'
], function(DashboardExt, NavigatorBaseComponent, $) {

  var NavigatorComponent = NavigatorBaseComponent.extend({
    update: function() {
      var myself = this;
      if(NavigatorBaseComponent.navigatorResponse == -1) {
        $.getJSON(DashboardExt.getJSONSolution() + "?mode=navigator&path=" + NavigatorBaseComponent.path, function(json) {
          myself.processNavigatorResponse(json);
        });
      } else {
        this.processNavigatorResponse(NavigatorBaseComponent.navigatorResponse);
      }
    },
    processNavigatorResponse: function(json) {
      NavigatorBaseComponent.navigatorResponse = json;

      var files = this.includeSolutions
        ? json.solution.folders[0].folders
        : NavigatorBaseComponent.getSolutionJSON(NavigatorBaseComponent.solution);

      files.sort(function(a, b) { return a.name > b.name; });

      var ret = this.generateMenuFromArray(files, 0);
      $("#" + this.htmlObject).html(ret);

      $(function() {
        $('ul.jd_menu').jdMenu({
          activateDelay: 50,
          showDelay: 50,
          disableLinks: false
        });
      });
      $('ul.jd_menu a').tooltip({
        showURL: false,
        track: true,
        delay: 1000,
        opacity: 0.5
      });
    },
    generateMenuFromArray: function(files, depth) {
      var s = "";

      if(files == undefined) {
        return s;
      }

      for(var i = 0; i < files.length; i++) {

        var file = files[i];

        s += this.generateMenuFromFile(file, depth + 1);
      }

      if(s.length > 0) {

        var className;
        // class is only passed first time
        if(depth == 0) {
          var cls = (this.mode == 'vertical')
            ? "jd_menu jd_menu_slate jd_menu_vertical"
            : "jd_menu jd_menu_slate";
          className = "class=\"" + cls + "\"";
        }

        s = "<ul " + className + ">" + s + "</ul>";

      }

      return s;
    },

    generateMenuFromFile: function(file, depth) {

      var s = "";
      var webAppPath = this.dashboard.webAppPath;
      if(file.visible == true) {

        var classString = NavigatorBaseComponent.isAncestor(file.solution, file.path) ? "class=\"ancestor\"" : "";

        var _path = "";
        if(file.path.length > 0) {
          _path = "path=" + file.path;
        }

        var _template = NavigatorBaseComponent.template != undefined && NavigatorBaseComponent.template.length != undefined
          && NavigatorBaseComponent.template.length > 0 ? "&amp;template=" + NavigatorBaseComponent.template : "";
        if(file.link != undefined) {
          s += "<li><a " + classString + " title=\"" + file.title + "\"  href=\""
            + ((webAppPath.substring(webAppPath.length - 1) == '/')
              ? webAppPath.substring(0, webAppPath.length - 1) + file.link 
              : webAppPath + file.link) + "\">" + file.title + "</a>";

        } else {
          s += "<li><a " + classString + " title=\"" + file.title + "\" onClick=\"return false;\" href=\"" +
            DashboardExt.getRenderHTML() + "?solution=" + file.solution + "&amp;" +_path + _template + "\">" + file.title + "</a>";
        }

        var files = file.folders || [];
        files.sort(function(a, b) {
          return a.name > b.name;
        });

        var childFiles = file.files || [];
        childFiles.sort(function(a, b) {
          return a.name > b.name;
        });

        var inner = this.generateMenuFromArray(files.concat(childFiles));

        if(inner.length > 0 ) {
          inner = " &raquo;" + inner;
        }

        s += inner + "</li>";

      }
      return s;
    }
  });

  return NavigatorComponent;

});
