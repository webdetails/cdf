
var NavigatorBaseComponent = BaseComponent.extend({},{
	path : Dashboards.getQueryParameter("path"),
	solution : Dashboards.getQueryParameter("solution"),
	navigatorResponse : -1,
	getSolutionJSON : function(solution) {
		var json = NavigatorBaseComponent.navigatorResponse;
		var files = json.solution.folders;
		var locationArray;
	
		var found = 0;
		for(i = 0; i<files.length; i++){
			var file = files[i];
			if(NavigatorBaseComponent.solution == "" || file.solution == NavigatorBaseComponent.solution){
				files = file.folders;
				if(files.length == undefined){
					files = [ files ];
				}
				return files;
			}
	
		}
		if (found == 0){
			alert("Fatal: Solution " + solution +" not found in navigation object");
			return;
		}
	},
//	listContents : function(mode){
//
//		// Start iterate
//		// 1: find the correct solution;
//		// 2: see if there are paths in there
//		// 3: if mode == CDF_SELF, we will return the position we're in.
//		//    if mode == CDF_CHILDREN, the children will be returned
//	
//		var json = NavigatorBaseComponent.navigatorResponse;
//		var files = json.repository.file;
//	
//		var locationArray;
//	
//		var files = NavigatorBaseComponent.getSolutionJSON(NavigatorBaseComponent.solution);
//	
//		if (NavigatorBaseComponent.path == 'null' || NavigatorBaseComponent.path == ""){
//			if (mode ==  CDF_CHILDREN )
//				return files;
//			else
//				return json.repository;
//		}
//	
//		locationArray = NavigatorBaseComponent.path.split('/');
//		maxLen = mode==CDF_CHILDREN?locationArray.length:locationArray.length-1;
//	
//		for (var i = 0; i < maxLen; i++){
//	
//			var currentPath = locationArray.slice(0,i + 1).join("/");
//			//console.log("[" + i + "] - Looking for: " + currentPath );
//			files = NavigatorBaseComponent.browseContent(files, currentPath);
//		}
//	
//		if (mode ==  CDF_CHILDREN )
//			return files;
//		else{
//			// we still need to find the correct element
//			var file;
//			$.each(files,function(i,f){
//					if (f.type == "FILE.FOLDER" && f.path[0] == NavigatorBaseComponent.path ){
//						file = f; return false;
//					}
//				});
//			if (file == undefined){
//				alert("FATAL: NOT FOUND");
//			}
//			return file;
//		}
//	},
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
			$.getJSON("JSONSolution?mode=navigator&solution=" + NavigatorBaseComponent.solution +"&path=" + NavigatorBaseComponent.path , function(json){
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

			s += "<li><a "+ classString +" title=\"" + file.description + "\"  href=\"Dashboards?solution=" + file.solution + "&amp;" +_path + "\">" + file.title + "</a>";

			var files = file.folders || [];
			files.sort(function(a,b){return a.title>b.title});
			var inner = this.generateMenuFromArray(files);

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
		$.getJSON("JSONSolution?mode=contentList&solution=" + NavigatorBaseComponent.solution +"&path=" + NavigatorBaseComponent.path, function(json){
				myself.processContentListResponse(json);
			});
	},
	processContentListResponse : function(json) {

		// 1 - Get my solution and path from the object;
		// 2 - get the content

		$("#"+this.htmlObject).empty();
		var files = json.content || [];
		files.sort(function(a,b){
				var _a = (a.type=="FOLDER"?"000":"")+a.title;
				var _b = (b.type=="FOLDER"?"000":"")+b.title;
				return a.title > b.title
			});
		// Create the outmost ul
		var container = $("<ul></ul>").attr("id","contentList-"+this.name).appendTo("#"+this.htmlObject);

		// We need to append the parent dir
		if( this.mode != 1 && NavigatorBaseComponent.path != ""){
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
					if (this.type=="FILE.FOLDER"){
						cls = "folder";
						href = "Dashboards?solution=" + this.solution + "&path=" + this.path;
					}
					else{
						cls = "action greybox";
						if (this.url != undefined){
							href=this.url;
						}
						else
							href = "ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.name;
						// target = "_new"

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
				GB_show(t,_href,$(window).height()-50,$(window).width() - 100 );
				return false;
			});

	}
});

var PageTitleComponent = NavigatorBaseComponent.extend({
	update : function() {
		var myself = this;
		if( NavigatorBaseComponent.navigatorResponse == -1 ){
			$.getJSON("JSONSolution?mode=navigator&solution=" + NavigatorBaseComponent.solution +"&path=" + NavigatorBaseComponent.path, function(json){
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
	
		var _id = "/solution/" + NavigatorBaseComponent.solution + (NavigatorBaseComponent.path.length > 0?"/"+NavigatorBaseComponent.path:"");
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

