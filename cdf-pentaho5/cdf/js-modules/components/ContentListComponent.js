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
  './NavigatorBaseComponent',
  '../lib/jquery',
  'amd!../lib/jquery.fancybox'
], function(DashboardExt, Utils, NavigatorBaseComponent, $) {

  var ContentListComponent = NavigatorBaseComponent.extend({
    update: function() {
      var myself = this;
      var path = this.mode != 4
        ? (NavigatorBaseComponent.path || Utils.getPathParameter(NavigatorBaseComponent.path))
        : NavigatorBaseComponent.getParentPath();
      myself.draw(path);
    },

    draw: function(path) {
      var myself = this;
      $.getJSON(DashboardExt.getJSONSolution() + "?mode=contentList" + (path != "" ? "&path=" + path : ""), function(json) {
        myself.processContentListResponse(json, path);
      });
    },

    processContentListResponse : function(json, path) {

      // 1 - Get my solution and path from the object;
      // 2 - get the content

      $("#"+this.htmlObject).empty();
      var files = json.content || [];
      files.sort(function(a,b) {
        var _a = (a.type == "FOLDER" ? "000" : "") + a.name;
        var _b = (b.type == "FOLDER" ? "000" : "") + b.name;
        return _a > _b;
      });
      // Create the outmost ul
      var container = $("<ul></ul>").attr("id","contentList-" + this.name).appendTo("#" + this.htmlObject);

      // We need to append the parent dir
      if(this.mode != 1
        && this.mode != 4
        && (NavigatorBaseComponent.path || Utils.getPathParameter(NavigatorBaseComponent.path))) {

        var parentDir =  {
          name: "Up",
          title: "Up",
          type: "FOLDER",
          description: "Go to parent directory",
          visible: true,
          solution: NavigatorBaseComponent.getParentSolution(),
          path: path.substring(0, path.lastIndexOf("/"))
        };
        files.reverse().push(parentDir);
        files.reverse();
      }

      var myself = this;
      
      $.each(files, function(i, val) {
        // We want to iterate only depending on the options:
        // 1 - Files only
        // 2 - Folders only
        // 3 - Files and folders

        if(myself.mode == 1 && this.type == "FOLDER") {
          return true; // skip
        }

        if(myself.mode == 2 && this.type != "FOLDER") {
          return true; // skip
        }

        if(this.visible == true) {
          var cls = "";
          var target = "";
          var href = "";
          var template = (NavigatorBaseComponent.template != undefined &&
            NavigatorBaseComponent.template.length != undefined && 
            NavigatorBaseComponent.template.length > 0)
            ? "&template=" + NavigatorBaseComponent.template : "";
          var anchor;
      
          if(this.type=="FOLDER") {
            cls = "folder";

            anchor = $("<a></a>")
              .attr("target", target)
              .attr("title", this.description)
              .attr("parentPath", val.path)
              .text(this.title).click(function() {
                myself.draw($(this).attr("parentPath"));
              });
          } else {
            var path = CONTEXT_PATH;
            if(this.url != undefined) {
              //cls = "folder";
              cls = "action greybox";
              href = (path.substring(path.length - 1) == '/')
                ? path.substring(0, path.length - 1) + this.url 
                : path + this.url;
            } else {
              cls = "action greybox";
              href = (path.substring(path.length - 1) == '/')
                ? path.substring(0, path.length - 1) + this.link 
                : path + this.link;
            }

            anchor = $("<a></a>")
              .attr("target", target)
              .attr("title", this.description)
              .text(this.title)
              .attr("href", href);
          }   
          $("<li></li>")
            .attr("class", cls)
            .appendTo(container)
            .append(anchor);   
        }

      });

      $('#contentList-' + this.name + ' a').tooltip({showURL: false});
      $("li.greybox a").click(function() {
        var t = this.title || this.innerHTML || this.href;
        //$(window).scrollTop(0);
        var _href = this.href.replace(/'/g, "&#39;");
        $.fancybox({
          type: "iframe",
          href: _href,
          width: $(window).width(),
          height: $(window).height()
        });
        return false;
      });
    }
  });

  return ContentListComponent;

});
