
var NavigatorBaseComponent = BaseComponent.extend({},{
  path : Dashboards.getQueryParameter("path"),
  solution : Dashboards.getQueryParameter("solution"),
  template: Dashboards.getQueryParameter("template"),
  navigatorResponse : -1,
  getSolutionJSON : function(solution) {
    var json = NavigatorBaseComponent.navigatorResponse;
    var files = json.solution.folders;
    var locationArray;
	
    var found = 0;
    for(i = 0; i<files.length; i++){
      var file = files[i];
      if(NavigatorBaseComponent.solution == "" || file.solution == NavigatorBaseComponent.solution){
				
        var solutionFiles = [];
				
        // Process subFolders;
        var subFolders = file.folders;
        if(subFolders != undefined && subFolders.length == undefined){
          // only one folder inside
          solutionFiles.push(subFolders);
        }
        else if(subFolders != undefined && subFolders.length > 0){
          // We have an array of files
          solutionFiles = solutionFiles.concat(subFolders);
        }
				
        // Process subFiles;
        var subFiles = file.files;
        if(subFiles != undefined && subFiles.length == undefined){
          // only one file inside
          solutionFiles.push(subFiles);
        }
        else if(subFiles != undefined && subFiles.length > 0){
          // We have an array of files
          solutionFiles = solutionFiles.concat(subFiles);
        }

        return solutionFiles;
      }
	
    }
    if (found == 0){
      alert("Fatal: Solution " + solution +" not found in navigation object");
      return;
    }
  },
  browseContent : function(files, currentPath) {

    for(var i = 0; i<files.length; i++){
      var file = files[i];
      //console.log("Searching for " + currentPath + ", found " + file.path);
      if(file.type == "FOLDER" && file.path == currentPath){
        files = file.folders;
        /*
				 console.log("Files found for this path:");
				 for (var j = 0; j < files.length; j++) {
				 if (files[j].path != undefined) {
				 console.log(files[j].path);
			 }
		 }
		 */
        if (files == undefined){
          return [];
        }
        if(files.length == undefined){
          files = [ files ];
        }
        return files;
      }

    }
    alert("Fatal: path " + NavigatorBaseComponent.path +" not found in navigation object");
    return;
  },
  getParentSolution : function(){
    if (NavigatorBaseComponent.path.length>0){
      return NavigatorBaseComponent.solution;
    } else {
      return "";
    }
  },
  getParentPath : function(){
    var index = NavigatorBaseComponent.path.lastIndexOf("/");
    if (index==-1){
      return "";
    }
    var parentPath = NavigatorBaseComponent.path.substring(0, NavigatorBaseComponent.path.lastIndexOf("/"));
    return parentPath;
  },
  isAncestor : function(solution, path){
    if (solution != NavigatorBaseComponent.solution) {
      return false;
    } else {
      return true;
    }
  }
});

var NavigatorComponent = NavigatorBaseComponent.extend({
  update : function() {
    var myself = this;
    if( NavigatorBaseComponent.navigatorResponse == -1 ){
      $.getJSON(webAppPath + "/content/pentaho-cdf/JSONSolution?mode=navigator&solution=" + NavigatorBaseComponent.solution +"&path=" + NavigatorBaseComponent.path , function(json){
        myself.processNavigatorResponse(json);
      });
    }
    else{
      this.processNavigatorResponse(NavigatorBaseComponent.navigatorResponse);
    }
  },
  processNavigatorResponse : function(json) {
    NavigatorBaseComponent.navigatorResponse = json;
	
    var files = this.includeSolutions?json.solution.folders:NavigatorBaseComponent.getSolutionJSON(NavigatorBaseComponent.solution);
		
    files.sort(function(a,b){
      return a.name>b.name
    });
    var ret = this.generateMenuFromArray(files, 0);
    $("#"+this.htmlObject).html(ret);
	
    $(function(){
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

    if (files == undefined){
      return s;
    }

    for(var i = 0; i< files.length; i++){

      var file = files[i];

      s += this.generateMenuFromFile(file, depth + 1);
    }
		
		
    if (s.length > 0){

      var className;
      // class is only passed first time
      if (depth == 0){
        var cls=(this.mode == 'vertical')?"jd_menu jd_menu_slate jd_menu_vertical":"jd_menu jd_menu_slate";
        className = "class=\""+cls+"\"";
      }
		
      s = "<ul " + className + ">"+ s + "</ul>";
				
    }

    return s;
  },
  generateMenuFromFile : function(file, depth) {

    var s = "";
    if(file.visible == true){

      var classString = NavigatorBaseComponent.isAncestor(file.solution, file.path)?"class=\"ancestor\"":"";

      var _path = "";
      if(file.path.length>0){
        _path="path="+file.path;
      }
			
      var _template = NavigatorBaseComponent.template.length > 0 ? "&amp;template=" + NavigatorBaseComponent.template : "";
      if (file.link != undefined){
        s += "<li><a "+ classString +" title=\"" + file.description + "\"  href=\"" + webAppPath + file.link + "\">" + file.title + "</a>";

      }
      else{
        s += "<li><a "+ classString +" title=\"" + file.description + "\"  href=\"" + webAppPath + "/content/pentaho-cdf/RenderHTML?solution=" + file.solution + "&amp;" +_path + _template + "\">" + file.title + "</a>";
      }

      /*
			if(file.type == "wcdf")
				s += "<li><a title=\"" + file.description + "\" href=\"" + webAppPath + "/content/pentaho-cdf-dd/Render?solution=" + file.solution + "&amp;path=" + file.path + "&amp;file=" + file.file + "\">" + file.title + "</a>";
			else if (file.type == "xcdf")
				s += "<li><a title=\"" + file.description + "\" href=\"" + webAppPath + "/content/pentaho-cdf/RenderXCDF?solution=" + file.solution + "&amp;path=" + file.path + "&amp;action=" + file.file + "\">" + file.title + "</a>";
			else
				s += "<li><a "+ classString +" title=\"" + file.description + "\"  href=\"" + webAppPath + "/content/pentaho-cdf/RenderHTML?solution=" + file.solution + "&amp;" +_path + _template + "\">" + file.title + "</a>";
			*/

      var files = file.folders || [];
      files.sort(function(a,b){
        return a.name>b.name
      });
			
      var childFiles = file.files || [];
      childFiles.sort(function(a,b){
        return a.name>b.name
      });
			
      var inner = this.generateMenuFromArray(files.concat(childFiles));
			
      if (inner.length > 0 ){
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
    var path = this.mode != 4  ? NavigatorBaseComponent.path : NavigatorBaseComponent.getParentPath();
    $.getJSON(webAppPath + "/content/pentaho-cdf/JSONSolution?mode=contentList&solution=" + NavigatorBaseComponent.solution +"&path=" + path, function(json){
      myself.processContentListResponse(json);
    });
  },
  processContentListResponse : function(json) {

    // 1 - Get my solution and path from the object;
    // 2 - get the content

    $("#"+this.htmlObject).empty();
    var files = json.content || [];
    files.sort(function(a,b){
      var _a = (a.type=="FOLDER"?"000":"")+a.name;
      var _b = (b.type=="FOLDER"?"000":"")+b.name;
      return _a > _b
    });
    // Create the outmost ul
    var container = $("<ul></ul>").attr("id","contentList-"+this.name).appendTo("#"+this.htmlObject);

    // We need to append the parent dir
    if( this.mode != 1 && this.mode != 4 && NavigatorBaseComponent.path != ""){
      var parentDir =  {
        name: "Up",
        title:"Up",
        type: "FOLDER",
        description: "Go to parent directory",
        visible: true,
        solution: NavigatorBaseComponent.getParentSolution(),
        path: NavigatorBaseComponent.getParentPath()
      };
      files.reverse().push(parentDir);
      files.reverse();
    }

    var myself = this;
		
    $.each(files,function(i,val){
      // We want to iterate only depending on the options:
      // 1 - Files only
      // 2 - Folders only
      // 3 - Files and folders

      if (myself.mode==1 && this.type == "FOLDER"){
        return true; // skip
      }
      if (myself.mode==2 && this.type != "FOLDER"){
        return true; // skip
      }

      if(this.visible == true){
        var cls = "";
        var target = "";
        var href = "";
        var template =  NavigatorBaseComponent.template.length > 0 ? "&template=" + NavigatorBaseComponent.template : "";
		
        if (this.type=="FOLDER"){
          cls = "folder";
          href = webAppPath + "/content/pentaho-cdf/RenderHTML?solution=" + this.solution + "&path=" + this.path + template;
        }
        else{
          if (this.url != undefined){
            //cls = "folder";
            cls = "action greybox";
            href=webAppPath + this.url;
          }
          else
          {
            cls = "action greybox";
            href = webAppPath + this.link;
          }
							
        }


        var anchor = $("<a></a>").attr("href",href).attr("target",target).attr("title",this.description).text(this.title)
        $("<li></li>").attr("class",cls).appendTo(container).append(anchor);
      }

    });

    $('#contentList-'+this.name + ' a').tooltip({
      showURL: false
    });
    $("li.greybox a").click(function(){
      var t = this.title || this.innerHTML || this.href;
      //$(window).scrollTop(0);
      var _href = this.href.replace(/'/g,"&#39;");
      $.fancybox({
        type:"iframe",
        href:_href,
        width: $(window).width(),
        height:$(window).height()
      });
      return false;
    });

  }
});

var PageTitleComponent = NavigatorBaseComponent.extend({
  update : function() {
    var myself = this;
    if( NavigatorBaseComponent.navigatorResponse == -1 ){
      $.getJSON(webAppPath + "/content/pentaho-cdf/JSONSolution?mode=navigator&solution=" + NavigatorBaseComponent.solution +"&path=" + NavigatorBaseComponent.path, function(json){
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
	
    var _id = json.solution.id +"/" + NavigatorBaseComponent.solution + (NavigatorBaseComponent.path.length > 1?
      (NavigatorBaseComponent.path.charAt(0) == '/' ? NavigatorBaseComponent.path : '/' + NavigatorBaseComponent.path) : "");
    var file = this.findPageTitleObject(json.solution.folders,_id);

    if (file.title != undefined && file.description != undefined){
      $("#"+this.htmlObject).text(file.title + " - " + file.description);
    }
  },
  findPageTitleObject : function(folders,id){
    for(var i = 0; i<folders.length; i++){
      var file = folders[i];
      if(file.id == id){
        return file;
      }
      else if ((id + "/").indexOf(file.id + "/")>=0){
        // we're on the good path
        return this.findPageTitleObject(file.folders,id);
      }
      else{
        continue;
      }
    }
  }
});

