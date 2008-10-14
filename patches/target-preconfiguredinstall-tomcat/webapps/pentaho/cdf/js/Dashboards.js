/*$.ajaxSetup({ type: "POST", async: true });*/
$.ajaxSetup({ async: false });


var GB_ANIMATION = true;
var CDF_CHILDREN = 1;
var CDF_SELF = 2;

$.blockUI.defaults.message = '<div style="padding: 15px;"><img src="/pentaho/cdf/images/busy.gif" /> <h3>Processing...</h3></div>';
$.blockUI.defaults.css.left = '40%';
$.blockUI.defaults.css.top = '30%';
$.blockUI.defaults.css.marginLeft = '85px';
$.blockUI.defaults.css.width = '170px';
$.blockUI.defaults.css.opacity = '.8';
$.blockUI.defaults.css['-webkit-border-radius'] = '10px'; 
$.blockUI.defaults.css['-moz-border-radius'] = '10px';

if (typeof $.SetImpromptuDefaults == 'function')
	$.SetImpromptuDefaults({ prefix: 'colsJqi', show: 'slideDown' });

var Dashboards = 
	{
		components: [],
		initMap: true,
		monthNames : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		mdxGroups: {}
	}

Dashboards.blockUIwithDrag = function() {
	$.blockUI();
	var handle = $('<div id="blockUIDragHandle" style="cursor: pointer; width: 170px; -webkit-border-radius: 5px; -moz-border-radius: 5px; background-color: rgba(0,0,0,0.25);" align="right"><a style="padding-right: 5px; text-decoration: none; color: black; font-weight: bold; font-color: black; font-size: 8pt" href="javascript:$.unblockUI()" title="Click to unblock">X</a></div>')
	$("div.blockUI.blockMsg").prepend(handle);
	$("div.blockUI.blockMsg").draggable({handle: "#blockUIDragHandle"});
}

Dashboards.xactionCallback = function(object,str){
	$('#'+object.htmlObject).html(str);
	Dashboards.runningCalls--;
}

Dashboards.update = function(object)	{
	if(!(typeof(object.preExecution)=='undefined')){
		object.preExecution();
	}
	switch(object.type)
	{
		// test if object is an xaction
	case "xaction":
		//go through parametere array and update values
		var p = new Array(object.parameters.length);
		for(var i= 0, len = p.length; i < len; i++){
			var key = object.parameters[i][0];
			var value = eval(object.parameters[i][1]);
			p[i] = [key,value];
		} 
		// increment runningCalls
		Dashboards.runningCalls++;

		//callback async mode
		//pentahoAction(object.solution, object.path, object.action, p,function(json){ Dashboards.xactionCallback(object,json); });
		// or sync mode
		$('#'+object.htmlObject).html(pentahoAction(object.solution, object.path, object.action, p,null));
		break;

	case "jFreeChartComponent":
		this.updateJFreeChartComponent(object);
		break;
	case "dialComponent":
		this.updateDialComponent(object);
		break;
	case "timePlotComponent":
		this.updateTimePlotComponent(object);
		break;
	case "text":
		selectHTML = eval(object.expression());
		document.getElementById(object.htmlObject).innerHTML = selectHTML;
		break;
	case "select":
	case "selectMulti":

		var myArray = Dashboards.getValuesArray(object);

		selectHTML = "<select";
		selectHTML += " id='" + object.name + "'";

		//set size
		if (object.size != undefined){
			selectHTML += " size='" + object.size + "'";
		}
		if (object.type == "selectMulti"){
			selectHTML += " multiple";
		}
		selectHTML += ">";

		for(var i= 0, len  = myArray.length; i < len; i++){
			if(myArray[i]!= null && myArray[i].length>0)
				selectHTML += "<option value = '" + myArray[i][1] + "' >" + myArray[i][1] + "</option>";
		} 

		selectHTML += "</select>";

		//alert(selectHTML);

		//update the placeholder
		document.getElementById(object.htmlObject).innerHTML = selectHTML;
		$("#"+object.name).change(function() {
				Dashboards.processChange(object.name);
			});

		break;
	case "textInput":
		//selectHTML = "<input onChange='Dashboards.processChange(\"" + object.name + "\")' onKeyUp='if (event.keyCode==13){Dashboards.processChange(\"" + object.name + "\")}'";
		selectHTML = "<input";
		selectHTML += " type=test id='" + object.name +"' name='" + object.name +"' + value='"+ eval(object.parameter) + "'>";
		document.getElementById(object.htmlObject).innerHTML = selectHTML;
		$("#"+object.name).change(function() {
				Dashboards.processChange(object.name);
			}).keyup(function() {
					if (event.keyCode==13){Dashboards.processChange(object.name)}
				});

			break;
		case "dateInput":
			$("#"+object.htmlObject).html($("<input/>").attr("id",object.name).attr("value",eval(object.parameter)).attr("size","10"));
			/*
			 graft(
			 document.getElementById(object.htmlObject),
			 ["input",
			 {id: object.name, value:eval(object.parameter), type:'text', size: 10 }]);	
				 */
			Calendar.setup({inputField: object.name, ifFormat : "%Y-%m-%d",  onUpdate: function(){Dashboards.processChange(object.name)} });
			break;
		case "monthPicker":


			var selectHTML = Dashboards.getMonthPicker(object.name, object.size, object.initialDate, object.minDate, object.maxDate, object.months);

			document.getElementById(object.htmlObject).innerHTML = selectHTML;

			$("#"+object.name).change(function() {
					Dashboards.processChange(object.name);
				});

			break;
		case "radio":
		case "check":
			var myArray = Dashboards.getValuesArray(object);

			selectHTML = "";
			for(var i= 0, len  = myArray.length; i < len; i++){
				selectHTML += "<input onclick='Dashboards.processChange(\"" + object.name + "\")'";
				if(i==0){
					selectHTML += " CHECKED";
				}
				if (object.type == 'radio'){
					selectHTML += " type='radio'";
				}else{
					selectHTML += " type='checkbox'";
				}
				selectHTML += " id='" + object.name +"' name='" + object.name +"' value='" + myArray[i][1] + "' /> " + myArray[i][1] + (object.separator == undefined?"":object.separator);
			} 
			//update the placeholder
			document.getElementById(object.htmlObject).innerHTML = selectHTML;

			break;
		case "map":

			if(this.initMap){
				init_map(object.initPosLon,object.initPosLat,object.initZoom, 'true');
				DashboardsMap.messageElementId = object.messageElementId;
				this.initMap = false;
			}
			else
			{
				DashboardsMap.resetSearch();

				var p = new Array(object.parameters.length);
				for(var i= 0, len = p.length; i < len; i++){
					var key = object.parameters[i][0];
					var value = eval(object.parameters[i][1]);
					p[i] = [key,value];
				} 

				html = pentahoAction(object.solution, object.path, object.action, p,null);

				var myArray = this.parseArray(html,true);
				var len = myArray.length;
				if( len > 1){
					var cols = myArray[0];
					var colslength = cols.length;

					for(var i= 1; i < len; i++){
						//Get point details
						var details;
						if(colslength > 4){
							details = new Array(colslength-5);
							for(var j= 5; j < colslength; j++){
								details[j-5] = [cols[j],myArray[i][j]];
							} 
						}

						var value = myArray[i][4];
						var markers = object.markers;
						//Store expression and markers for update funtion
						DashboardsMap.mapExpression = object.expression();
						DashboardsMap.mapMarkers = markers;

						var icon = eval(object.expression());
						DashboardsMap.data.push(new Array(myArray[i][0],new Array(myArray[i][1],myArray[i][2],myArray[i][3]),value,details,null,icon,null,null));
						DashboardsMap.search(DashboardsMap.data.length - 1);
					}								
				}
			}
			break;

		case "mapBubble":

			DashboardsMap.selectedPointDetails = null;

			for(var i = 0; i < DashboardsMap.data.length; i++)
			{
				if(selectedPoint == DashboardsMap.data[i][0])
				{
					DashboardsMap.selectedPointDetails = DashboardsMap.data[i][3];
					break;
				}

			}

			DashboardsMap.updateInfoWindow(pentahoAction(object.solution, object.path, object.action, DashboardsMap.selectedPointDetails ,null));

			break;

		case "jpivot":

			//Build IFrame and set url
			var jpivotHTML = "<iframe id=\"jpivot_"+ object.htmlObject + "\" scrolling=\"no\" onload=\"this.style.height = this.contentWindow.document.body.offsetHeight + 'px';\" frameborder=\"0\" height=\""+object.iframeHeight+"\" width=\""+object.iframeWidth+"\" src=\"";
			jpivotHTML += "ViewAction?solution="	+ object.solution + "&path=" + 	object.path + "&action="+ object.action;

			//Add args
			var p = new Array(object.parameters.length);
			for(var i= 0, len = p.length; i < len; i++){
				var arg = "&" + object.parameters[i][0] + "=";
				jpivotHTML += arg +  eval(object.parameters[i][1]);
			}

			//Close IFrame
			jpivotHTML += "\"></iframe>";

			document.getElementById(object.htmlObject).innerHTML = jpivotHTML;

			break;
		case "navigator":

			this.getNavigatorComponent(object);
			break;

		case "contentList":
			this.getContentList(object);
			break;

		case "pageTitle":
			this.getPageTitle(object);
			break;

		case "pivotLink":
			this.generatePivotLink(object);
			break;

		case "tableComponent":
			this.generateTableComponent(object);
			break;
		case "queryComponent":
			this.makeQuery(object);
			break;
		case "mdxQueryGroup":
			this.updateMdxQueryGroup(object);
		}
		if(!(typeof(object.postExecution)=='undefined')){
			object.postExecution();
		}
	};

	Dashboards.getComponent = function(name){
		for (i in this.components){
			if (this.components[i].name == name)
				return this.components[i];
		}
	};

	Dashboards.addComponents = function(components){
		this.components = this.components.concat(components);
	};

	Dashboards.init = function(components){
		if(Dashboards.isArray(components)){
			Dashboards.addComponents(components);
		}
		$(function(){Dashboards.initEngine()});
	};

	Dashboards.initEngine = function(){
		components = this.components;
		var compCount = components.length;
		Dashboards.blockUIwithDrag();

		for(var i= 0, len = components.length; i < len; i++){
			if(components[i].executeAtStart){
				this.update(components[i]);
			}
		}  
		$.unblockUI();
	};

	Dashboards.clear = function(obj){
		document.getElementById(obj.htmlObject).innerHTML = "";
	};

	Dashboards.resetAll = function(){
		var compCount = components.length;
		for(var i= 0, len = components.length; i < len; i++){
			this.clear(components[i]);
		}  
		var compCount = components.length;
		for(var i= 0, len = components.length; i < len; i++){
			if(components[i].executeAtStart){
				this.update(components[i]);
			}
		}  
	};

	Dashboards.parseArray = function(html,includeHeader){
		var myArray;
		html=html.replace(/<tr>/g,"[");
		html=html.replace(/<\/tr>/g,"],");
		html=html.replace(/<t[hd][^\>]*>/g,"");
		html=html.replace(/<\/t[hd]>/g,",");
		html=html.replace(/(\[|,(?![\[\]]|$))/g,"$1\"");
		html=html.replace(/([^\]]),/g,"$1\",");
		html=html.replace(/,\]/g,"]");
		var a = "var myArray = [" + html.substring(0,html.length-1) + "];"
		try{
			eval(a);
		}
		catch(err){
			return [];
		}
		if (!includeHeader){
			myArray.splice(0,1);
		}

		return myArray;

	};

	Dashboards.getValuesArray = function(object){

		if (typeof(object.valuesArray) == 'undefined'){
			//go through parameter array and update values
			var p = new Array(object.parameters.length);
			for(var i= 0, len = p.length; i < len; i++){
				var key = object.parameters[i][0];
				var value = eval(object.parameters[i][1]);
				p[i] = [key,value];
			} 

			//execute the xaction tp populate the selector
			html = pentahoAction(object.solution, object.path, object.action, p,null);

			//transform the result int a javascript array
			var myArray = this.parseArray(html,false);
			return myArray;

		}
		else{
			return object.valuesArray
		}
	};

	Dashboards.processChange = function(object_name){
		var object = eval(object_name);
		var parameter = object.parameter;
		var value;

		//alert(document.getElementById(object.name));

		switch (object.type)
		{
		case "select":
			var selector = document.getElementById(object.name);
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].selected){
					value = selector[i].value;
				};
			} 
			break;
		case "radio":
			var selector = document.getElementsByName(object.name);
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].checked){
					value = selector[i].value;
					continue;
				};
			} 
			break;
		case "check":
		case "selectMulti":
			if(object.type == "check"){
				var selector = document.getElementsByName(object.name);
			}else{
				var selector = document.getElementById(object.name);
			}
			var selection = new Array();
			var selection_index = 0;
			for(var i= 0, len  = selector.length; i < len; i++){
				if(selector[i].checked || selector[i].selected){
					selection[selection_index] = selector[i].value;
					selection_index ++;
				};
			} 
			value=selection.join("','");
			break;
		case "textInput":
		case "dateInput":
			var selector = document.getElementById(object.name);
			value = selector.value;

			break;
		case "monthPicker":

			value = $("#" + object.name).val()

			var year = value.substring(0,4);
			var month = parseInt(value.substring(5,7) - 1);
			var d = new Date();
			d.setMonth(month);
			d.setYear(year);

			//rebuild picker
			var selectHTML = Dashboards.getMonthPicker(object.name, object.size, d, object.minDate, object.maxDate, object.months);
			$("#" + object.htmlObject).html(selectHTML);
			$("#"+object.name).change(function() {
					Dashboards.processChange(object.name);
				});
			break;
		}
		if(!(typeof(object.preChange)=='undefined')){
			object.preChange(value);
		}
		this.fireChange(parameter,value);
		if(!(typeof(object.postChange)=='undefined')){
			object.postChange(value);
		}
	};

	/*$().ajaxStart($.blockUI).ajaxStop($.unblockUI);*/
Dashboards.fireChange = function(parameter,value){
	//alert("begin block");
	Dashboards.blockUIwithDrag();

	//alert("Parameter: " + parameter + "; Value: " + value);
	eval( parameter + "= encode_prepare(\"" + value + "\")"); 

	for(var i= 0, len = components.length; i < len; i++){
		if(Dashboards.isArray(components[i].listeners)){
			for(var j= 0 ; j < components[i].listeners.length; j++){

				if(components[i].listeners[j] == parameter){
					this.update(components[i]);
					break;
				}
				//alert("finished parameter " + j)
			}
		}
	}  
	//alert("finish block");
	$.unblockUI();

};

Dashboards.isArray = function(testObject) {
	return testObject && !(testObject.propertyIsEnumerable('length')) && typeof testObject === 'object' && typeof testObject.length === 'number';
}


Dashboards.navigatorResponse = -1;

Dashboards.getNavigatorComponent = function(object){

	if( Dashboards.navigatorResponse == -1 ){
		$.getJSON("JSONSolution", function(json){
				Dashboards.processNavigatorResponse(object,json);
			});
	}
	else{
		Dashboards.processNavigatorResponse(object,Dashboards.navigatorResponse);
	}
};

Dashboards.getContentList = function(object){

	if( Dashboards.navigatorResponse == -1 ){
		$.getJSON("JSONSolution", function(json){
				Dashboards.processContentListResponse(object,json);
			});
	}
	else{
		Dashboards.processContentListResponse(object,Dashboards.navigatorResponse);
	}
};

Dashboards.getPageTitle = function(object){

	if( Dashboards.navigatorResponse == -1 ){
		$.getJSON("JSONSolution", function(json){
				Dashboards.processPageTitleResponse(object,json);
			});
	}
	else{
		Dashboards.processPageTitleResponse(object,Dashboards.navigatorResponse);
	}
};

Dashboards.processPageTitleResponse = function(object,json){

	// Store the value
	Dashboards.navigatorResponse = json;

	var file = Dashboards.listContents(CDF_SELF);

	if (file.title != undefined && file.description != undefined){
		$("#"+object.htmlObject).text(file.title + " - " + file.description);
	}
};

Dashboards.processNavigatorResponse = function(object,json){

	// Store the value
	Dashboards.navigatorResponse = json;

	var files = object.includeSolutions?json.repository.file:Dashboards.getSolutionJSON(Dashboards.solution);

	var ret = Dashboards.generateMenuFromArray(object,files, 0);
	$("#"+object.htmlObject).html(ret);

	$(function(){$('ul.jd_menu').jdMenu({activateDelay: 50, showDelay: 50, disableLinks: false})});
	$('ul.jd_menu a').tooltip({showURL: false, track:true, delay: 1000, opacity: 0.5});

};


Dashboards.getSolutionJSON = function(solution){

	var json = Dashboards.navigatorResponse;
	var files = json.repository.file;
	var locationArray;

	var found = 0;
	for(i = 0; i<files.length; i++){
		var file = files[i];
		if(Dashboards.solution == "" || file.solution == Dashboards.solution){
			files = file.file;
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

}

Dashboards.processContentListResponse = function(object,json){

	// Store the value
	Dashboards.navigatorResponse = json;

	// 1 - Get my solution and path from the object;
	// 2 - get the content

	var files = Dashboards.listContents(CDF_CHILDREN);
	$("#"+object.htmlObject).empty();

	// Create the outmost ul
	var container = $("<ul></ul>").attr("id","contentList-"+object.name).appendTo("#"+object.htmlObject);

	// We need to append the parent dir
	if( object.mode != 1 && Dashboards.path != ""){
		var parentDir =  {
			name: "Up",
			title:"Up", 
			type: "FILE.FOLDER", 
			description: "Go to parent directory",
			visible: "true", 
			solution: Dashboards.getParentSolution(), 
			path: Dashboards.getParentPath()
		};
		files.reverse().push(parentDir);
		files.reverse();
	}


	$.each(files,function(i,val){
			// We want to iterate only depending on the options:
			// 1 - Files only
			// 2 - Folders only
			// 3 - Files and folders

			if (object.mode==1 && this.type == "FILE.FOLDER"){
				return true; // skip
			}
			if (object.mode==2 && this.type != "FILE.FOLDER"){
				return true; // skip
			}

			if(this.visible == 'true'){
				var cls = "";
				var target = "";
				var href = "";
				if (this.type=="FILE.FOLDER"){
					cls = "folder";
					href = "Dashboards?solution=" + this.solution + "&path=" + this.path[0];
				}
				else{
					cls = "action greybox";
					if (this.url != undefined){
						href=this.url;
					}
					else
						href = "ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.filename;
					//target = "_new"

				}


				var anchor = $("<a></a>").attr("href",href).attr("target",target).attr("title",this.description).text(this.title)
				$("<li></li>").attr("class",cls).appendTo(container).append(anchor);
			}

		});

	$('#contentList-'+object.name + ' a').tooltip({showURL: false});
	$("li.greybox a").click(function(){
			var t = this.title || this.innerHTML || this.href;
			/*$(window).scrollTop(0);*/
var _href = this.href.replace(/'/g,"&#39;");
GB_show(t,_href,$(window).height()-50,$(window).width() - 100 );
return false;
		});

};

Dashboards.listContents = function(mode){

	// Start iterate
	// 1: find the correct solution;
	// 2: see if there are paths in there
	// 3: if mode == CDF_SELF, we will return the position we're in.
	//    if mode == CDF_CHILDREN, the children will be returned

	var json = Dashboards.navigatorResponse;
	var files = json.repository.file;

	var locationArray;

	var files = Dashboards.getSolutionJSON(Dashboards.solution);

	if (Dashboards.path == 'null' || Dashboards.path == ""){
		if (mode ==  CDF_CHILDREN )
			return files;
		else
			return json.repository;
	}

	locationArray = Dashboards.path.split('/');
	maxLen = mode==CDF_CHILDREN?locationArray.length:locationArray.length-1;

	for (var i = 0; i < maxLen; i++){

		var currentPath = locationArray.slice(0,i + 1).join("/");
		//console.log("[" + i + "] - Looking for: " + currentPath );
		files = Dashboards.browseContent(files, currentPath);
	}

	if (mode ==  CDF_CHILDREN )
		return files;
	else{
		// we still need to find the correct element
		var file;
		$.each(files,function(i,f){
				if (f.type == "FILE.FOLDER" && f.path[0] == Dashboards.path ){
					file = f; return false;
				}
			});
		if (file == undefined){
			alert("FATAL: NOT FOUND");
		}
		return file;
	}

};


Dashboards.browseContent = function(files,currentPath){

	for(var i = 0; i<files.length; i++){
		var file = files[i];
		//console.log("Searching for " + currentPath + ", found " + file.path[0]);
		if(file.type == "FILE.FOLDER" && file.path[0] == currentPath){
			files = file.file;
			/*
			 console.log("Files found for this path:");
			 for (var j = 0; j < files.length; j++) {
			 if (files[j].path != undefined) {
			 console.log(files[j].path[0]);
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
	alert("Fatal: path " + Dashboards.path +" not found in navigation object");
	return;

};


Dashboards.generateMenuFromArray = function(object,files, depth){
	var s = "";

	if (files == undefined){
		return s;
	}

	if(files.length == undefined){
		files = [ files ];
	}


	for(var i = 0; i< files.length; i++){

		var file = files[i];

		s += this.generateMenuFromFile(object,file, depth + 1);
	}
	if (s.length > 0){

		var className;
		// class is only passed first time
		if (depth == 0){
			var cls=(object.mode == 'vertical')?"jd_menu jd_menu_slate jd_menu_vertical":"jd_menu jd_menu_slate";
			className = "class=\""+cls+"\"";
		}

		s = "<ul " + className + ">"+ s + "</ul>";
	}

	return s;
};

Dashboards.generateMenuFromFile = function(object,file, depth){

	var s = "";
	if(file.visible == "true" && file.type == "FILE.FOLDER" ){

		var classString = Dashboards.isAncestor(file.solution, file.path)?"class=\"ancestor\"":"";

		var _path = "";
		if(file.path.length>0){
			_path="path="+file.path[0];
		}

		s += "<li><a "+ classString +" title=\"" + file.description + "\"  href=\"Dashboards?solution=" + file.solution + "&amp;" +_path + "\">" + file.title + "</a>";

		var inner = Dashboards.generateMenuFromArray(object,file.file);

		if (inner.length > 0 ){
			inner = " &raquo;" + inner;
		}

		s += inner+"</li>";
	}
	return s;
};

Dashboards.getParentSolution = function(){
	if (Dashboards.path.length>0){
		return Dashboards.solution;
	}
	else{
		return "";
	}
};

Dashboards.getParentPath = function(){
	var index = Dashboards.path.lastIndexOf("/");
	if (index==-1){
		return ["",""];
	}
	var parentPath = Dashboards.path.substring(0,Dashboards.path.lastIndexOf("/"));
	return [parentPath, parentPath];
};

Dashboards.isAncestor = function(solution,path){
	if (solution != Dashboards.solution){
		return false;
	}
	else{
		return true;
	}
};

Dashboards.generatePivotLink = function(object){

	var title = object.tooltip==undefined?"View details in a Pivot table":object.tooltip;
	var link = $('<a class="pivotLink"> </a>').html(object.content).attr("href","javascript:Dashboards.openPivotLink("+ object.name +")").attr("title",title);

	$("#"+object.htmlObject).empty();
	$("#"+object.htmlObject).html(link);

	$('a.pivotLink').tooltip({showURL: false, track:true, delay: 1000, opacity: 0.5});
};


Dashboards.openPivotLink = function(object){



	var url = "/pentaho/Pivot?solution=cdf&path=components&action=jpivot.xaction&";

	var qd = object.pivotDefinition;
	var parameters = [];
	for(p in qd){
		var key = p;
		var value = typeof qd[p]=='function'?qd[p]():qd[p];
		//alert("key: " + key + "; Value: " + value);
		parameters.push(key + "=" + encodeURIComponent(value));
	} 
	url += parameters.join("&");

	var _href = url.replace(/'/g,"&#39;");
	GB_show("Pivot Details",_href, $(window).height() - 50 , $(window).width() - 100);
};


Dashboards.getParameter = function ( parameterName ) {
	// Add "=" to the parameter name (i.e. parameterName=value)
	var queryString = window.top.location.search.substring(1);
	var parameterName = parameterName + "=";
	if ( queryString.length > 0 ) {
		// Find the beginning of the string
		begin = queryString.indexOf ( parameterName );
		// If the parameter name is not found, skip it, otherwise return the value
		if ( begin != -1 ) {
			// Add the length (integer) to the beginning
			begin += parameterName.length;
			// Multiple parameters are separated by the "&" sign
			end = queryString.indexOf ( "&" , begin );
			if ( end == -1 ) {
				end = queryString.length
			}
			// Return the string
			return unescape ( queryString.substring ( begin, end ) );
		}
		// Return "" if no parameter has been found
		return "";
	}
};

Dashboards.updateJFreeChartComponent = function( object ){

	var cd = object.chartDefinition;
	if (cd == undefined){
		alert("Fatal - No chart definition passed");
		return;
	}

	//go through parametere array and update values
	var parameters = [];
	for(p in cd){
		var key = p;
		var value = typeof cd[p]=='function'?cd[p]():cd[p];
		//alert("key: " + key + "; Value: " + value);
		parameters.push([key,value]);
	} 
	// increment runningCalls
	Dashboards.runningCalls++;

	//callback async mode
	pentahoAction("cdf", "components", "jfreechart.xaction", parameters,function(json){ Dashboards.updateJFreeChartComponentCallback(object,json); });
	// or sync mode
	//$('#'+object.htmlObject).html(pentahoAction("cdf", "components", "jfreechart.xaction", parameters,null));

};

Dashboards.updateJFreeChartComponentCallback = function( object , json){

	$('#'+object.htmlObject).html(json);
}

Dashboards.updateDialComponent = function( object ){

	var cd = object.chartDefinition;
	if (cd == undefined){
		alert("Fatal - No chart definition passed");
		return;
	}
	
	var intervals = cd.intervals;
	if (intervals == undefined){
		alert("Fatal - No intervals passed");
		return;
	}
	
	var colors = cd.colors;
	if(colors != undefined && intervals.length != colors.length){
		alert("Fatal - Number of intervals differs from number of colors");
		return;
	}

	//go through parametere array and update values
	var parameters = [];
	for(p in cd){
		var key = p;
		var value = typeof cd[p]=='function'?cd[p]():cd[p];
		//alert("key: " + key + "; Value: " + value);
		parameters.push([key,value]);
	} 
	// increment runningCalls
	Dashboards.runningCalls++;

	//callback async mode
	//pentahoAction(object.solution, object.path, object.action, p,function(json){ Dashboards.xactionCallback(object,json); });
	// or sync mode
	$('#'+object.htmlObject).html(pentahoAction("cdf", "components", "jfreechartdial.xaction", parameters,null));

};

if (typeof Timeplot != "undefined"){
	Dashboards.timePlotColors = [new Timeplot.Color('#820000'),
	new Timeplot.Color('#13E512'), new Timeplot.Color('#1010E1'), 
	new Timeplot.Color('#E532D1'), new Timeplot.Color('#1D2DE1'), 
	new Timeplot.Color('#83FC24'), new Timeplot.Color('#A1D2FF'), 
	new Timeplot.Color('#73F321')]
}

Dashboards.updateTimePlotComponent = function( object ){

	var timePlotTimeGeometry = new Timeplot.DefaultTimeGeometry({
			gridColor: "#000000",
			axisLabelsPlacement: "top",
			gridType: "short"
		});

	var timePlotValueGeometry = new Timeplot.DefaultValueGeometry({
			gridColor: "#000000",
			min: 0,
			axisLabelsPlacement: "left",
			gridType: "short"
		});


	var timePlotEventSource = new Timeplot.DefaultEventSource();
	var timePlot;

	var cd = object.chartDefinition;
	if (cd == undefined){
		alert("Fatal - No chart definition passed");
		return;
	}

	// Set default options:
	if (cd.showValues == undefined){
		cd.showValues = true;
	}


	var cols = typeof cd['columns']=='function'?cd['columns']():cd['columns'];
	if (cols == undefined || cols.length == 0){
		alert("Fatal - No 'columns' property passed in chartDefinition");
		return;
	}
	// Write the title
	var title = $('<div></div>');
	if(cd.title != undefined){
		title.append('<span style="text-transform: lowercase;">' + cd.title + '&nbsp; &nbsp; &nbsp;</span>');
	}

	var plotInfo = [];
	for(var i = 0; i<cols.length; i++){

		title.append('<span style="color:' + Dashboards.timePlotColors[i].toHexString() + '">'+cols[i]+' &nbsp;&nbsp;</span>');

		var plotInfoOpts = {
			id: cols[i],
			dataSource: new Timeplot.ColumnSource(timePlotEventSource,i + 1),
			valueGeometry: timePlotValueGeometry,
			timeGeometry: timePlotTimeGeometry,
			lineColor: Dashboards.timePlotColors[i],
			showValues: cd.showValues
		};
		if ( cd.dots == true){
			plotInfoOpts.dotColor = Dashboards.timePlotColors[i];
		}
		if ( cd.fill == true){
			plotInfoOpts.fillColor = Dashboards.timePlotColors[i].transparency(0.5);
		}
		plotInfo.push(new Timeplot.createPlotInfo(plotInfoOpts));

	}

	$("#"+object.htmlObject).html(title);
	$("#"+object.htmlObject).append("<div class='timeplot'></div>");

	if(cd.height > 0){
		$("#" + object.htmlObject + " > div.timeplot").css("height",cd.height);
	} 
	if(cd.width > 0){
		$("#" + object.htmlObject + " > div.timeplot").css("width",cd.width);
	} 

	timeplot = Timeplot.create($("#"+object.htmlObject+" > div.timeplot")[0], plotInfo);

	//go through parametere array and update values
	var parameters = [];
	for(p in cd){
		var key = p;
		var value = typeof cd[p]=='function'?cd[p]():cd[p];
		//parameters.push(encodeURIComponent(key)+"="+encodeURIComponent(value));
		parameters.push(key+"="+value);
	} 

	var url = "ViewAction?solution=cdf&path=components&action=timelinefeeder.xaction&" + parameters.join('&');
	timeplot.loadText(url,",", timePlotEventSource);
};

Dashboards.getMonthPicker = function(object_name, object_size, initialDate, minDate, maxDate, monthCount) {


	var selectHTML = "<select";
	selectHTML += " id='" + object_name + "'";

	if (minDate == undefined){
		minDate = new Date();
		minDate.setYear(1980);
	}
	if (maxDate == undefined){
		maxDate = new Date();
		maxDate.setYear(2060);
	}

	//set size
	if (object_size != undefined){
		selectHTML += " size='" + object_size + "'";
	}

	var currentDate = new Date(+initialDate);
	currentDate.setMonth(currentDate.getMonth()- monthCount/2 - 1);

	for(var i= 0; i <= monthCount; i++){

		currentDate.setMonth(currentDate.getMonth() + 1);
		if(currentDate >= minDate && currentDate <= maxDate)
		{
			selectHTML += "<option value = '" + currentDate.getFullYear() + "-" + Dashboards.zeroPad(currentDate.getMonth()+1,2) + "'";

			if(currentDate.getFullYear() == initialDate.getFullYear() && currentDate.getMonth() == initialDate.getMonth()){
				selectHTML += "selected='selected'"
			}

			selectHTML += "' >" + Dashboards.monthNames[currentDate.getMonth()] + " " +currentDate.getFullYear()  + "</option>";
		}
	} 

	selectHTML += "</select>";

	return selectHTML;
}

Dashboards.zeroPad = function(num,size){

	var n = "00000000000000" + num;
	return n.substring(n.length-size,n.length);
}

Dashboards.makeQuery = function(object){

	var cd = object.queryDefinition;
	if (cd == undefined){
		alert("Fatal - No query definition passed");
		return;
	}

	$.getJSON("ViewAction?solution=cdf&path=components&action=jtable.xaction", cd, function(json){
			object.result = json["aaData"];
			//alert("obj: " + object.result);
		});

};

Dashboards.generateTableComponent = function(object){

	var cd = object.chartDefinition;
	if (cd == undefined){
		alert("Fatal - No chart definition passed");
		return;
	}

	$.getJSON("ViewAction?solution=cdf&path=components&action=jtable.xaction", cd, function(json){
			Dashboards.processTableComponentResponse(object,json);
		});

};

Dashboards.processTableComponentResponse = function(object,json)
{

	$("#"+object.htmlObject).html("<table id='" + object.htmlObject + "Table' class=\"tableComponent\">");
	$("#"+object.htmlObject+'Table').dataTable( json );
	$("#"+object.htmlObject).append("</table>");
}

Dashboards.path = Dashboards.getParameter("path");

Dashboards.solution = Dashboards.getParameter("solution");

// MDXQuery

Dashboards.mdxQuery = function(hash){
	this.query = {};
	this.originalHash = {};
	this.update(hash);
	this.axisPos = 0;
	this.axisDepth = 0;
};

Dashboards.mdxQuery.prototype.reset = function(){
	this.update(this.originalHash); 

};

Dashboards.mdxQuery.prototype.resetFilters = function(){
	this.query["filters"] = Dashboards.clone(this.originalHash["filters"]) || {rows:{},columns: {}};
}


Dashboards.mdxQuery.prototype.update = function(hash){

	this.originalHash = Dashboards.clone(hash);
	this.query["members"] = hash["members"]||[];
	this.query["sets"] = hash["sets"] || [];
	this.query["rows"] = hash["rows"]||"";
	this.query["rowDrill"] = hash["rowDrill"]||false;
	this.query["rowLevels"] = hash["rowLevels"]||[];
	this.query["orderBy"] = hash["orderBy"] || "";
	this.query["from"] = hash["from"] || "";
	this.query["columns"] = hash["columns"];
	this.query["columnDrill"] = hash["columnDrill"]||false;
	this.query["columnLevels"] = hash["columnLevels"]||[];
	this.query["nonEmptyRows"] = hash["nonEmptyRows"] || false;
	this.query["nonEmptyColumns"] = hash["nonEmptyColumns"] || false;
	this.query["swapRowsAndColumns"] = hash["swapRowsAndColumns"] || false;
	this.query["filters"] = hash["filters"] || {rows:{},columns: {}};
	this.query["where"] = hash["where"] || {};
};

//.prototype.clone = function(){
//	return new Dashboards.mdxQuery(this.query);
//}

// Add a clone method;

Dashboards.mdxQuery.prototype.clone = function() {
	var c = Dashboards.clone(this);
	return c;
};


Dashboards.mdxQuery.prototype.generateAxisPart = function(axisDrill, axis, axisLevels, orderBy){
	if (axisDrill == false){
		return axis;
	}

	var dim = axis.indexOf(".") == -1?axis:axis.substr(0,axis.indexOf("."));
	var axisLevel = this.axisPos + this.axisDepth;
	if (axisLevel > axisLevels.length - 1){
		axisLevel = axisLevels.length - 1
	}
	var q = "Descendants("  + axis + ", "+ dim + ".["  + axisLevels[axisLevel] + "])"
	if (orderBy == "")
		return q;

	return "Order(" + q + ", " + orderBy + " , BDESC)";

}


Dashboards.mdxQuery.prototype.getQuery = function(){
	var query = "with ";
	// We need to evaluate the hash
	var _eh = [];
	for(p in this.query){
		var key = p;
		var value = typeof this.query[p]=='function'?this.query[p]():this.query[p];
		_eh[key] = value;
	} 

	if(typeof _eh["sets"] == 'object' || typeof _eh["members"] == 'object' ){
		for(s in _eh["sets"]){
			var value = typeof _eh["sets"][s]=='function'?_eh["sets"][s]():_eh["sets"][s];
			query += " set " + s + " as " + value + " \n";
		}
		for(m in _eh["members"]){
			var value = typeof _eh["members"][m]=='function'?_eh["members"][m]():_eh["members"][m];
			query += " member " + m + " as " + value + " \n";
		}
	}
	// Generate the col/row sets
	var columns = _eh["swapRowsAndColumns"]?_eh["rows"]:_eh["columns"];
	var columnLevels = _eh["swapRowsAndColumns"]?_eh["rowLevels"]:_eh["columnLevels"];
	var columnDrill = _eh["swapRowsAndColumns"]?_eh["rowDrill"]:_eh["columnDrill"];
	var rows = _eh["swapRowsAndColumns"]?_eh["columns"]:_eh["rows"];
	var rowLevels = _eh["swapRowsAndColumns"]?_eh["columnLevels"]:_eh["rowLevels"];
	var rowDrill = _eh["swapRowsAndColumns"]?_eh["columnDrill"]:_eh["rowDrill"] ;
	query += " set rowSet as {" + this.generateAxisPart(rowDrill,rows,rowLevels,_eh.orderBy) + "} \n";
	query += " set colSet as {" + this.generateAxisPart(columnDrill,columns,columnLevels,_eh.orderBy) + "} \n";

	var colFilter = [];
	var rowFilter = [];
	$.each(_eh["filters"]["rows"],function(key,obj){
			$.each(obj,function(dim, content){
					rowFilter.push(key + ".currentMember.Name <> '" + content+"' ");
				})
		});
	if (_eh["swapRowsAndColumns"]){
		query += " set rowFilter as " + (colFilter.length > 0?"Filter(rowSet,"+ colFilter.join(" and ") + " )":"rowSet") + "\n";
		query += " set colFilter as " + (rowFilter.length > 0?"Filter(colSet,"+ rowFilter.join(" and ") + " )":"colSet") + "\n";
	}
	else{
		query += " set rowFilter as " + (rowFilter.length > 0?"Filter(rowSet,"+ rowFilter.join(" and ") + " )":"rowSet") + "\n";
		query += " set colFilter as " + (colFilter.length > 0?"Filter(colSet,"+ colFilter.join(" and ") + " )":"colSet") + "\n";
	}


	query += "select " + (_eh["nonEmptyRows"]?" NON EMPTY ":"") + " rowFilter on rows,\n ";
	query += " " + (_eh["nonEmptyColumns"]?" NON EMPTY ":"") + " colFilter on columns\n ";
	query += " from " + _eh["from"] + "\n";

	var whereArray = [];
	$.each(_eh["where"],function(key,obj){
			whereArray.push(typeof obj == 'function'?obj():obj);
		});
	if (whereArray.length>0){
		query += " where ( " + whereArray.join(' , ') + " )";
	}
	return query;

}

Dashboards.mdxQuery.prototype.addFilter = function(axis, dimension, value){
	if(axis != 'columns' && axis != 'rows'){
		alert("Invalid filter axis " + axis);
		return;
	}

	var obj = this.query["filters"][axis];
	if (obj[dimension] == undefined ){
		obj[dimension] = [ value ];
	}
	else
		obj[dimension].push(value);

}

Dashboards.mdxQuery.prototype.addCondition = function(key, condition){

	this.query["where"][key] = condition;
}

Dashboards.mdxQuery.prototype.removeCondition = function(key){

	delete this.query["where"][key];
}

Dashboards.initMdxQueryGroup = function(obj){

	var mdxQueryGroup = new Dashboards.mdxQueryGroup(obj.name);

	for(m in obj.mdxQueries){

		mdxQueryGroup.addMdxQuery( 
			obj.mdxQueries[m].name,
			obj.mdxQueries[m].query,
			obj.mdxQueries[m].dimension,
			obj.mdxQueries[m].axis,   
			obj.mdxQueries[m].chart
		);
	}

	Dashboards.mdxGroups[obj.name] = mdxQueryGroup;
	return mdxQueryGroup;
}


Dashboards.updateMdxQueryGroup = function(obj){

	var mdxGroup = Dashboards.mdxGroups[obj.name];
	if (mdxGroup == undefined){
		mdxGroup = Dashboards.initMdxQueryGroup(obj);
	}

	$("#" + obj.htmlObject).html(mdxGroup.printConditions());

}


Dashboards.mdxQueryGroup = function(name){
	this.name = name;
	this.mdxQueries = {};
	this.clickedIdx = -1;
	this.clickedValue = "";
	this.activeFilters = {};
	this.activeConditions = {};
};


Dashboards.mdxQueryGroup.prototype.addMdxQuery = function(idx,mdxQuery,filterDimension, filterAxis, chartObject){
	this.mdxQueries[idx] = {mdxQuery: mdxQuery, filterDimension: filterDimension, filterAxis: filterAxis,chartObject:chartObject};
};

Dashboards.mdxQueryGroup.prototype.removeMdxQuery = function(idx){
	delete this.mdxQueries.idx;
};

Dashboards.buttonsDescription = {
		"Drill": 'Drill down to the selected value and add the condition to the other charts',
		'Focus': "Focus on this value, adding the conditions to the other charts", 
		'Exclude': "Exclude this value from the chart",
		"Expand":'Expand the depth of the chart, showing an extra sublevel',
		"Collapse":'Collapse all previous expansions to the top most level',
		"Reset All": 'Reset all filters and conditions from this chart group, returning to the original conditions',
		"Cancel": "Cancel" 
}

Dashboards.fireMdxGroupAction = function( mdxQueryGroup,idx, value){

	value = encode_prepare(value);
	var mdxQueryGroup = Dashboards.mdxGroups[mdxQueryGroup];
	if (value == 'Others')
		return; // do nothing

	Dashboards.lastClickedMdxQueryGroup = mdxQueryGroup;
	mdxQueryGroup.clickedIdx = idx;
	mdxQueryGroup.clickedValue = value;

	var clickedObj = mdxQueryGroup.mdxQueries[idx];

	var buttonsHash = { 
		"Drill": 'drill',
		'Focus': "condition", 
		'Exclude': "filter",
		"Expand":'expand',
		"Collapse":'collapse',
		"Reset All": 'resetall',
		"Cancel": "cancel" 
	};

	if (clickedObj.mdxQuery.axisDepth == 0)
		delete buttonsHash.Collapse;

	//get rowLevels
	var rl = clickedObj.mdxQuery.query.rowLevels;
	var d = typeof rl == "function"?rl():rl;

	if (clickedObj.mdxQuery.axisPos + clickedObj.mdxQuery.axisDepth >= d.length - 1){
		delete buttonsHash.Drill;
		delete buttonsHash.Expand;
	}
	else{
		delete buttonsHash.Focus;
	}

	// Expanded ones can't drill || focus
	if (clickedObj.mdxQuery.axisDepth > 0){
		delete buttonsHash.Drill;
		delete buttonsHash.Focus;
	}
	

	var msg = "Available conditions: <br/> <ul>" ;
	$.each(buttonsHash, function(key,value){msg+="<li>" + Dashboards.buttonsDescription[key] + "</li>"});
	msg += "</ul>";
	$.prompt(msg
		,{buttons: buttonsHash, callback: Dashboards.mdxQueryGroupActionCallback }
	);

}

Dashboards.lastClickedMdxQueryGroup;

Dashboards.mdxQueryGroup.prototype.printConditions = function(){

	var out = "";
	var firstFilter =1;
	var firstCond = 1;

	for (i in this.activeFilters){
		if (firstFilter++ == 1)
			out += "<i>Exclusions: </i>";
		var a = this.activeFilters[i];
		var o = [];
		out += " " + i + " : "
		$.each(a,function(j,k){o.push(k)});
		out+= o.join(" , ") + "; ";

	}
	for (i in this.activeConditions){
		if (firstCond++ == 1)
			out += " <i>Focus: </i>";
		var a = this.activeConditions[i];
		var o = [];
		$.each(a,function(j,k){o.push(k)});
		out+= o.join(" , ") + "; ";

	}

	if (out.length>0)
		out += " <a href='javascript:Dashboards.mdxGroups[\"" + this.name + "\"].resetAll()'>Reset</a>";

	return out;
}

Dashboards.mdxQueryGroup.prototype.resetAll = function(){

	Dashboards.blockUIwithDrag();
	for (i in this.mdxQueries){
		var obj = this.mdxQueries[i];
		obj.mdxQuery.reset();
		obj.mdxQuery.axisPos = 0;
		obj.mdxQuery.axisDepth = 0;
		Dashboards.update(obj.chartObject);
	}
	this.activeFilters = {};
	this.activeConditions = {};
	Dashboards.update(Dashboards.getComponent(this.name));
	$.unblockUI();

}

Dashboards.mdxQueryGroupActionCallback = function(value,m){

	if (value == "cancel")
		return;  // do nothing.

	var mqg = Dashboards.lastClickedMdxQueryGroup;
	var clickedObj = mqg.mdxQueries[mqg.clickedIdx];

	Dashboards.blockUIwithDrag();

	if( value == "filter" ){
		// filter: remove this from every query

		var obj = clickedObj;
		obj.mdxQuery.addFilter(obj.filterAxis, obj.filterDimension,mqg.clickedValue);
		var a = mqg.activeFilters[obj.filterDimension] || [];
		a.push(mqg.clickedValue);
		mqg.activeFilters[obj.filterDimension] = a;

		Dashboards.update(obj.chartObject);
	}
	else if (value == "expand"){
		var obj = clickedObj;
		obj.mdxQuery.axisDepth++;
		Dashboards.update(obj.chartObject);

	}
	else if (value == "collapse"){
		var obj = clickedObj;
		obj.mdxQuery.axisDepth--; + mqg.clickedValue + "]"
		Dashboards.update(obj.chartObject);

	}
	else if (value == "resetall"){
		mqg.resetAll();
	}
	else if (value == "condition" || value == "drill"){
		// condition: place this as a condition on the others and drill this


		// Get the dimension where condition to use in drill and focus
		var axis = typeof clickedObj.mdxQuery.query.rows == 'function'?clickedObj.mdxQuery.query.rows():clickedObj.mdxQuery.query.rows;
		var whereCond = axis + ".[" + mqg.clickedValue + "]";

		var a = mqg.activeFilters[mqg.clickedIdx] || [];
		a.push(whereCond);
		mqg.activeConditions[mqg.clickedIdx] = a;

		for (i in mqg.mdxQueries){
			var obj = mqg.mdxQueries[i];
			if (i == mqg.clickedIdx){
				if(value == 'drill'){
					obj.mdxQuery.query.rows = whereCond;
					obj.mdxQuery.axisPos++;
					delete mqg.activeFilters[obj.filterDimension];
				}
			}
			else{
				obj.mdxQuery.addCondition(mqg.clickedIdx, whereCond);
			}
			Dashboards.update(obj.chartObject);

		}
	}

	Dashboards.update(Dashboards.getComponent(mqg.name));
	$.unblockUI();
}

Dashboards.getAxisPathString = function(axis,axisPath){
	var a = [];
	$.each(axisPath, function(i,v){ a.push("["+ v +"]"); });
	return axis + "." + a.join(".");
}

Dashboards.clone = function clone(obj) {

	var c = obj instanceof Array ? [] : {};

	for (var i in obj) {
		var prop = obj[i];

		if (typeof prop == 'object') {
			if (prop instanceof Array) {
				c[i] = [];

				for (var j = 0; j < prop.length; j++) {
					if (typeof prop[j] != 'object') {
						c[i].push(prop[j]);
					} else {
						c[i].push(Dashboards.clone(prop[j]));
					}
				}
			} else {
				c[i] = Dashboards.clone(prop);
			}
		} else {
			c[i] = prop;
		}
	}

	return c;
}

/**
 *
 * UTF-8 data encode / decode
 * http://www.webtoolkit.info/
 *
 **/

function encode_prepare( s )
{
	if ($.browser == "mozilla"){
		alert("OK");
	}
	s = s.replace(/\+/g," ");
	if ($.browser == "msie" || $.browser == "opera"){
		return Utf8.decode(s);
	}

	return s;
}

var Utf8 = {

	// public method for url encoding
	encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// public method for url decoding
	decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

}

var DashboardsMap = 
	{

		markers: null,
		data : new Array(),
		dataIdx: 0,
		messageElementId: null,
		selectedPointDetails: null,
		mapExpression: null,

		search: function (idx) {

			var record = this.data[idx];
			var place = record[1];

			var lat = place[0];
			var log = place[1];
			var placeDesc = place[2];

			//request = 'http://ws.geonames.org/searchJSON?q=' +  encodeURIComponent(place)  + ',Portugal&maxRows=1&featureClass=P&coutry=PT&callback=getLocation';
			if(lat == '' || log == '')
			{
				placeDesc = placeDesc.replace(/&/g,",");
				request = 'http://ws.geonames.org/searchJSON?q=' +  encodeURIComponent(placeDesc)  + '&maxRows=1&featureClass=P&callback=DashboardsMap.getLocation';
			}

			// Create a new script object
			// (implementation of this class is in /export/jsr_class.js)
			aObj = new JSONscriptRequest(request);
			// Build the script tag
			aObj.buildScriptTag();
			// Execute (add) the script tag
			aObj.addScriptTag();
		},

		resetSearch: function (){
			map.removeLayer(markers);
			markers.destroy();

			markers = new OpenLayers.Layer.Markers( "Markers" );
			map.addLayer(markers);

			this.cleanMessages();
			document.getElementById(this.messageElementId).innerHTML = "";
			dataIdx = 0;
			data = new Array();
		},

		// this function will be called by our JSON callback
		// the parameter jData will contain an array with geonames objects
		getLocation: function (jData) {

			var record = this.data[dataIdx++];

			if (jData == null || jData.totalResultsCount == 0) {
				// There was a problem parsing search results
				var placeNotFound = record[0];
				this.addMessage("N&atilde;o encontrado: " + placeNotFound);
			}
			else{

				var geoname = jData.geonames[0]; //we're specifically calling for just one
				//addMessage("Place: " + geoname.name);

				// Show address
				//var marker = show_address(geoname.lng, geoname.lat,"green",record);
				var marker = record[4];
				var icon = record[5];
				record[6] = geoname.lng;
				record[7] = geoname.lat;
				var marker = this.showMarker(marker,record);
				record[4] = marker;
			}

			if(dataIdx >= data.length && dataIdx > 1){
				var extent = markers.getDataExtent();
				map.zoomToExtent(extent);
			}
			if(dataIdx >= data.length && dataIdx == 1){
				map.setCenter(markers.markers[0].lonlat,4,false,false);
			}
		},

		showMarker: function (oldMarker, record){

			icon = record[5];

			//create marker
			var lon = record[6];
			var lat = record[7];
			var size = new OpenLayers.Size(21,25);
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			var iconObj = new OpenLayers.Icon(icon,size,offset);
			marker = new OpenLayers.Marker(lonLatToMercator(new OpenLayers.LonLat(lon,lat)),iconObj);

			//create a feature to bind marker and record array together
			feature = new OpenLayers.Feature(markers,lonLatToMercator(new OpenLayers.LonLat(lon,lat)),record);
			feature.marker = marker;

			//create mouse down event for marker, set function to marker_click
			marker.events.register('mousedown', feature, DashboardsMap.marker_click);

			//add marker to map
			markers.addMarker(marker);

			return marker;
		},

		marker_click: function (evt){
			click_lonlat = this.lonlat;
			var record = this.data;
			Dashboards.fireChange("selectedPoint", record[0]);
		},

		updateInfoWindow: function ( content ) {

			if(content != null){
				var html = "<table border='0' height = '175' width='175' cellpadding='0' cellspacing='0'><tr><td colspan='1' align='center' width='55'><b>";
				html += "<b>" + this.selectedPointDetails[0][1];
				html += "</b></td></tr><tr><td colspan='1' align='center' width='175'>"+content+"</td></tr></table>";

				show_bubble(click_lonlat,html);
			}
		},

		updateMap: function(){
			var n = this.data.length;
			for( idx=0; idx<n; idx++ ) {
				var value = this.data[idx][2];
				var markers = this.mapMarkers;
				var icon = eval(this.mapExpression);
				var marker = this.data[idx][4];
				this.data[idx][5] = icon;
				this.data[idx][4] = this.showMarker( marker, this.data[idx] ); 
			}
		},


		addMessage: function (msg){
			document.getElementById(this.messageElementId).innerHTML = document.getElementById(this.messageElementId).innerHTML + msg + "\n <br />";
		},

		cleanMessages: function (msg){
			document.getElementById(this.messageElementId).innerHTML = "";
		}

	};
