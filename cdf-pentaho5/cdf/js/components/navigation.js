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

var NavigatorBaseComponent = BaseComponent.extend({},{
  path: Dashboards.getQueryParameter("path"),
  solution: Dashboards.getQueryParameter("solution"),
  template: Dashboards.getQueryParameter("template"),
  navigatorResponse : -1,
  getSolutionJSON : function(solution) {
    var json = NavigatorBaseComponent.navigatorResponse;
    var files = json.solution.folders;
    var locationArray;

    var found = 0;
    for(i = 0; i < files.length; i++) {
      var file = files[i];
      if(NavigatorBaseComponent.solution == "" || file.solution == NavigatorBaseComponent.solution) {

        var solutionFiles = [];

        // Process subFolders;
        var subFolders = file.folders;
        if(subFolders != undefined && subFolders.length == undefined) {
          // only one folder inside
          solutionFiles.push(subFolders);
        } else if(subFolders != undefined && subFolders.length > 0) {
          // We have an array of files
          solutionFiles = solutionFiles.concat(subFolders);
        }

        // Process subFiles;
        var subFiles = file.files;
        if(subFiles != undefined && subFiles.length == undefined) {
          // only one file inside
          solutionFiles.push(subFiles);
        } else if(subFiles != undefined && subFiles.length > 0) {
          // We have an array of files
          solutionFiles = solutionFiles.concat(subFiles);
        }

        return solutionFiles;
      }

    }
    if(found == 0) {
      Dashboards.error("Fatal: Solution " + solution + " not found in navigation object");
      return;
    }
  },
  browseContent : function(files, currentPath) {

    for(var i = 0; i < files.length; i++) {
      var file = files[i];

      if(file.type == "FOLDER" && file.path == currentPath) {
        files = file.folders;

        if(files == undefined) {
          return [];
        }
        if(files.length == undefined) {
          files = [ files ];
        }
        return files;
      }

    }
    Dashboards.error("Fatal: path " + (NavigatorBaseComponent.path || Dashboards.getPathParameter()) + " not found in navigation object");
    return;
  },
  getParentSolution : function(){
    if((NavigatorBaseComponent.path || Dashboards.getPathParameter()).length > 0) {
      return NavigatorBaseComponent.solution;
    } else {
      return "";
    }
  },
  getParentPath : function(){
    var path = NavigatorBaseComponent.path || Dashboards.getPathParameter();
    var index = path.lastIndexOf("/");
    if(index == -1) {
      return "";
    }
    var parentPath = path.substring(0, path.lastIndexOf("/"));
    return parentPath;
  },
  isAncestor : function(solution, path) {
    if(solution != NavigatorBaseComponent.solution) {
      return false;
    } else {
      return true;
    }
  }
});

var NavigatorComponent = NavigatorBaseComponent.extend({
  update : function() {
    var myself = this;
    if(NavigatorBaseComponent.navigatorResponse == -1) {
      $.getJSON(wd.cdf.endpoints.getJSONSolution() + "?mode=navigator&path=" + NavigatorBaseComponent.path, function(json) {
        myself.processNavigatorResponse(json);
      });
    } else {
      this.processNavigatorResponse(NavigatorBaseComponent.navigatorResponse);
    }
  },
  processNavigatorResponse : function(json) {
    NavigatorBaseComponent.navigatorResponse = json;

    var files = this.includeSolutions?json.solution.folders[0].folders:NavigatorBaseComponent.getSolutionJSON(NavigatorBaseComponent.solution);

    files.sort(function(a, b) {
      return a.name > b.name;
    });
    var ret = this.generateMenuFromArray(files, 0);
    $("#"+this.htmlObject).html(ret);

    $(function() {
      $('ul.jd_menu').jdMenu({
        activateDelay: 50,
        showDelay: 50,
        disableLinks: false
      })
    });
    $('ul.jd_menu a').tooltip({
      showURL: false,
      track:true,
      delay: 1000,
      opacity: 0.5
    });
  },
  generateMenuFromArray : function(files, depth) {
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
        var cls = (this.mode == 'vertical') ? "jd_menu jd_menu_slate jd_menu_vertical" : "jd_menu jd_menu_slate";
        className = "class=\""+cls+"\"";
      }

      s = "<ul " + className + ">"+ s + "</ul>";

    }

    return s;
  },
  generateMenuFromFile : function(file, depth) {

    var s = "";
    if(file.visible == true) {

      var classString = NavigatorBaseComponent.isAncestor(file.solution, file.path) ? "class=\"ancestor\"" : "";

      var _path = "";
      if(file.path.length > 0) {
        _path="path="+file.path;
      }

      var _template = NavigatorBaseComponent.template != undefined && NavigatorBaseComponent.template.length != undefined && 
          NavigatorBaseComponent.template.length > 0 ? "&amp;template=" + NavigatorBaseComponent.template : "";
      if(file.link != undefined) {
        s += "<li><a "+ classString +" title=\"" + file.title + "\"  href=\"" + webAppPath + file.link + "\">" + file.title + "</a>";

      } else{
        s += "<li><a "+ classString +" title=\"" + file.title + "\" onClick=\"return false;\" href=\"" + wd.cdf.endpoints.getRenderHTML() + "?solution=" + file.solution + "&amp;" +_path + _template + "\">" + file.title + "</a>";
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

      if(inner.length > 0) {
        inner = " &raquo;" + inner;
      }

      s += inner+"</li>";


    }
    return s;
  }
});

var ContentListComponent = NavigatorBaseComponent.extend({
  update : function() {
    var myself = this;
    var path = this.mode != 4  ? (NavigatorBaseComponent.path || Dashboards.getPathParameter()) : NavigatorBaseComponent.getParentPath();
    myself.draw(path);
  },
  draw: function(path) {
    var myself = this;
    $.getJSON(wd.cdf.endpoints.getJSONSolution() + "?mode=contentList" + (path != "" ? "&path=" + path : ""), function(json) {
      myself.processContentListResponse(json,path);
    });
  },
  processContentListResponse : function(json, path) {

    // 1 - Get my solution and path from the object;
    // 2 - get the content

    $("#"+this.htmlObject).empty();
    var files = json.content || [];
    files.sort(function(a, b) {
      var _a = (a.type == "FOLDER"?"000":"") + a.name;
      var _b = (b.type == "FOLDER"?"000":"") + b.name;
      return _a > _b;
    });
    // Create the outmost ul
    var container = $("<ul></ul>").attr("id","contentList-" + this.name).appendTo("#" + this.htmlObject);

    // We need to append the parent dir
    if(this.mode != 1 && this.mode != 4 && (NavigatorBaseComponent.path || Dashboards.getPathParameter())) {
      var parentDir =  {
        name: "Up",
        title: "Up",
        type: "FOLDER",
        description: "Go to parent directory",
        visible: true,
        solution: NavigatorBaseComponent.getParentSolution(),
        path: path.substring(0,path.lastIndexOf("/"))
      };
      files.reverse().push(parentDir);
      files.reverse();
    }

    var myself = this;
    
    $.each(files,function(i, val) {
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
        var template = NavigatorBaseComponent.template != undefined && NavigatorBaseComponent.template.length != undefined && 
           NavigatorBaseComponent.template.length > 0 ? "&template=" + NavigatorBaseComponent.template : "";
        var anchor;
    
        if(this.type=="FOLDER") {
          cls = "folder";

          anchor = $("<a></a>").attr("target",target).attr("title",this.description).attr("parentPath",val.path).text(this.title).click(function() {
            myself.draw($(this).attr("parentPath"));
          })
        } else {
          if (this.url != undefined){
            //cls = "folder";
            cls = "action greybox";
            href=webAppPath + this.url;
          } else {
            cls = "action greybox";
            href = webAppPath + this.link;
          }

          anchor = $("<a></a>").attr("target",target).attr("title",this.description).text(this.title).attr("href",href);
        }   
        $("<li></li>").attr("class",cls).appendTo(container).append(anchor);   
      }

    });

    $('#contentList-'+this.name + ' a').tooltip({
      showURL: false
    });
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

var PageTitleComponent = NavigatorBaseComponent.extend({
  update : function() {
    var myself = this;
    if(NavigatorBaseComponent.navigatorResponse == -1) {
      $.getJSON(wd.cdf.endpoints.getJSONSolution() + "?mode=contentlist&path=" + (NavigatorBaseComponent.path || Dashboards.getPathParameter()), function(json) {
        myself.processPageTitleResponse(json);
      });
    }
    else{
      this.processPageTitleResponse(NavigatorBaseComponent.navigatorResponse);
    }
  },
  processPageTitleResponse : function(json) {
    // Store the value
    NavigatorBaseComponent.navigatorResponse = json;

    var file = this.findPageTitleObject(json.content,json.id);

    if(file.title != undefined && file.description != undefined) {
      $("#"+this.htmlObject).text(file.title + (file.description != "" ? (" - " + file.description) : ""));
    }
  },
  findPageTitleObject : function(folders, id) {
    for(var i = 0; i < folders.length; i++) {
      var file = folders[i];
      if(file.id == id){
        return file;
      } else if((id + "/").indexOf(file.id + "/") >= 0) {
        // we're on the good path
        return this.findPageTitleObject(file.folders,id);
      } else {
        continue;
      }
    }
  }
});

