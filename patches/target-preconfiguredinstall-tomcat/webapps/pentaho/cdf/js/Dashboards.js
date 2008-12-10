$.ajaxSetup({ type: "POST", async: false });


var GB_ANIMATION = true;
var CDF_CHILDREN = 1;
var CDF_SELF = 2;
var TRAFFIC_RED = "cdf/images/traffic_red.png";
var TRAFFIC_YELLOW = "cdf/images/traffic_yellow.png";
var TRAFFIC_GREEN = "cdf/images/traffic_green.png";

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
		args: [],
		initMap: true,
		monthNames : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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
	if (object.tooltip != undefined){
		object._tooltip = typeof object["tooltip"]=='function'?object.tooltip():object.tooltip;
	}
	var objectType = typeof object["type"]=='function'?object.type():object.type;
	switch(objectType)
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
	case "trafficComponent":
		this.updateTrafficComponent(object);
		break;
	case "timePlotComponent":
		this.updateTimePlotComponent(object);
		break;
	case "text":
		$("#"+object.htmlObject).html(object.expression());
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

		var vid = object.valueAsId==false?false:true;
		for(var i= 0, len  = myArray.length; i < len; i++){
			if(myArray[i]!= null && myArray[i].length>0)
				selectHTML += "<option value = '" + myArray[i][vid?1:0] + "' >" + myArray[i][1] + "</option>";
		} 

		selectHTML += "</select>";

		//update the placeholder
		$("#"+object.htmlObject).html(selectHTML)
		$("#"+object.name).val(eval(object.parameter));
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
			$("#"+object.htmlObject).html($("<input/>").attr("id",object.name).attr("value",eval(object.parameter)).css("width","80px"));
			Calendar.setup({inputField: object.name, ifFormat : "%Y-%m-%d",  onUpdate: function(){Dashboards.processChange(object.name)} });
			break;
		case "dateRangeInput":
			var dr;
			if (object.singleInput == undefined || object.singleInput == true){
				dr = $("<input/>").attr("id",object.name).attr("value",eval(object.parameter[0]) + " > " + eval(object.parameter[1]) ).css("width","170px");
				$("#"+object.htmlObject).html(dr);

			}
			else{
				dr = $("<input/>").attr("id",object.name).attr("value",eval(object.parameter[0])).css("width","80px");
				$("#"+object.htmlObject).html(dr);
				dr.after($("<input/>").attr("id",object.name + "2").attr("value",eval(object.parameter[1])).css("width","80px"));
				if(object.inputSeparator != undefined){
					dr.after(object.inputSeparator);
				}
			
			}
			var offset = dr.offset();
			$(function(){ $("#" + object.htmlObject + " input").daterangepicker({posX: offset.left , posY: offset.top + 15, onDateSelect: function(rangeA, rangeB){ Dashboards.fireDateRangeInputChange( object.name ,rangeA,rangeB); }}); });
			//$(function(){ dr.daterangepicker({posX: offset.left , posY: offset.top + 15}); });
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
			OlapUtils.updateMdxQueryGroup(object);
			break;
		case "executeXaction":
			this.generateXActionComponent (object);
			break;
		case "autocompleteBox":
			this.generateAutocompleteBoxComponent (object);
			break;
		}	
		if(!(typeof(object.postExecution)=='undefined')){
			object.postExecution();
		}
		// if we have a tooltip component, how is the time.
		if (object._tooltip != undefined){
			$("#" + object.htmlObject).attr("title",object._tooltip).tooltip({delay:0, track: true, fade: 250});
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
	
	Dashboards.addArgs = function(url){
		if(url != undefined)
			this.args = getURLParameters(url);
	}

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
		case "autocompleteBox":
			value = object.value;
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

Dashboards.fireDateRangeInputChange = function(comp, rangeA, rangeB){
	var parameters = eval(comp + ".parameter");
	/*console.log("Date Select: " + comp +"; Range: " +  rangeA + " > " + rangeB);*/
	// set the second date and fireChange the first
	eval( parameters[1] + "= encode_prepare(\"" + rangeB + "\")"); 
	Dashboards.fireChange(parameters[0],rangeA);

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
	// Merge the stuff with a chartOptions element
	if (cd == undefined){
		alert("Fatal - No chartDefinition passed");
		return;
	}
	var cd0 = $.extend({},Dashboards.ev(cd.chartOptions), cd);

	//go through parametere array and update values
	var parameters = [];
	for(p in cd0){
		var key = p;
		var value = typeof cd0[p]=='function'?cd0[p]():cd0[p];
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
		alert("Fatal - No chartDefinition passed");
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

Dashboards.updateTrafficComponent = function( object ){

	var cd = object.trafficDefinition;
	if (cd == undefined){
		alert("Fatal - No trafficDefinition passed");
		return;
	}
	
	var intervals = cd.intervals;
	if (intervals == undefined){
		cd.intervals = [-1,1];
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
	var result = pentahoAction("cdf", "components", "traffic.xaction", parameters,null);

	if(cd.showValue != undefined && cd.showValue == true){
		var tooltip = object._tooltip;
		object._tooltip = "Value: " + result + " <br /><img align='middle' src='" + TRAFFIC_RED + "'/> &le; "  + cd.intervals[0] + " &lt;  <img align='middle' src='" + TRAFFIC_YELLOW + "'/> &lt; " + cd.intervals[1] + " &le; <img align='middle' src='" + TRAFFIC_GREEN + "'/> <br/>" + (tooltip != undefined?tooltip:""); 
	}

	//alert("Traffic result: " + result);
	var i = $("<img>").attr("src",result<=cd.intervals[0]?TRAFFIC_RED:(result>=cd.intervals[1]?TRAFFIC_GREEN:TRAFFIC_YELLOW));
	$('#'+object.htmlObject).html(i);

};

if (typeof Timeplot != "undefined"){
	Dashboards.timePlotColors = [new Timeplot.Color('#820000'),
	new Timeplot.Color('#13E512'), new Timeplot.Color('#1010E1'), 
	new Timeplot.Color('#E532D1'), new Timeplot.Color('#1D2DE1'), 
	new Timeplot.Color('#83FC24'), new Timeplot.Color('#A1D2FF'), 
	new Timeplot.Color('#73F321')]
}

Dashboards.updateTimePlotComponent = function( object ){

	if (typeof Timeplot != "undefined" && Dashboards.timePlotColors == undefined ){
		Dashboards.timePlotColors = [new Timeplot.Color('#820000'),
		new Timeplot.Color('#13E512'), new Timeplot.Color('#1010E1'), 
		new Timeplot.Color('#E532D1'), new Timeplot.Color('#1D2DE1'), 
		new Timeplot.Color('#83FC24'), new Timeplot.Color('#A1D2FF'), 
		new Timeplot.Color('#73F321')]
	}

	var timePlotTimeGeometry = new Timeplot.DefaultTimeGeometry({
			gridColor: "#000000",
			axisLabelsPlacement: "top",
			gridType: "short"
		});

	var timePlotValueGeometry = new Timeplot.DefaultValueGeometry({
			gridColor: "#000000",
			min: 0,
			axisLabelsPlacement: "left",
			gridType: "short",
			toolTipFormat : function (value){ return toFormatedString(value);}
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
			showValues: cd.showValues,
			toolTipFormat: function (value,plot){ return  plot._id + " = " + toFormatedString(value);}
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
			object.result = json;
		});

};

/*Dashboards.uptdateEvolutionComponent = function(object){

	
	var cd = object.chartDefinition;
	
	if (cd == undefined){
		alert("Fatal - No chart definition passed");
		return;
	}
	

	
	if(cd.query == undefined || cd.queryNotDefined == true ){
		
		cd.queryNotDefined = true;
		
		var options = Dashboards.clone (cd)
		for (var o in options) {
			if(typeof options[o] == 'function')
				options[o] = options[o]();
		}
		
		object.chartDefinition.query = (new OlapUtils.EvolutionQuery(options)).getQuery();
	}	
	
	Dashboards.generateTableComponent(object)
}*/

Dashboards.generateTableComponent = function(object){

	var cd = object.chartDefinition;
	if (cd == undefined){
		alert("Fatal - No chart definition passed");
		return;
	}
	cd["tableId"] = object.htmlObject + "Table";
	
	//Clear previous table
	$("#"+object.htmlObject).empty();
	
	$.getJSON("ViewAction?solution=cdf&path=components&action=jtable.xaction", cd, function(json){
			Dashboards.processTableComponentResponse(object,json);
		});

};


Dashboards.processTableComponentResponse = function(object,json)
{
	// General documentation here: http://sprymedia.co.uk/article/DataTables
	
	var cd = object.chartDefinition;
	// Build a default config from the standard options
	var dtData0 = Dashboards.getDataTableOptions(cd);
	var dtData = $.extend(cd.dataTableOptions,dtData0);
	dtData.aaData = json;
	$("#"+object.htmlObject).html("<table id='" + object.htmlObject + "Table' class=\"tableComponent\" width=\"100%\"></table>");

	dtData.fnFinalCallback = function( aData, iRowCount ){
		$("#" + object.htmlObject + " td.sparkline").each(function(i){
				$(this).sparkline($(this).text().split(/,/));
			});
		if(cd.urlTemplate != undefined){
			var td =$("#" + object.htmlObject + " td:nth-child(1)"); 
			td.addClass('cdfClickable');
			td.bind("click", function(e){
					var regex = new RegExp("{"+cd.parameterName+"}","g");
					var f = cd.urlTemplate.replace(regex,$(this).text());
					/*alert (cd.parameterName + " - " + $(this).text() + " - " + f);*/
					eval(f);
				});
		}
	};
	$("#"+object.htmlObject+'Table').dataTable( dtData );
};

Dashboards.path = Dashboards.getParameter("path");

Dashboards.solution = Dashboards.getParameter("solution");

Dashboards.getDataTableOptions = function(options)
{
	var dtData = {};
	if(options.info != undefined){dtData.bInfo = options.info};
	if(options.displayLength != undefined){dtData.iDisplayLength = options.displayLength};
	if(options.lengthChange != undefined){dtData.bLengthChange = options.lengthChange};
	if(options.paginate != undefined){dtData.bPaginate = options.paginate};
	if(options.sort != undefined){dtData.bSort = options.sort};
	if(options.filter != undefined){dtData.bFilter = options.filter};
	if(options.colHeaders != undefined){
		dtData.aoColumns = new Array(options.colHeaders.length);
		for(var i = 0; i< options.colHeaders.length; i++){dtData.aoColumns[i]={}};
		$.each(options.colHeaders,function(i,val){ 
			dtData.aoColumns[i].sTitle=val; 
			if(val == "") dtData.aoColumns[i].bVisible=false;
		});  // colHeaders
		if(options.colTypes!=undefined){$.each(options.colTypes,function(i,val){ 
					var col = dtData.aoColumns[i];
					if(val=='sparkline'){
						col.sClass=val; 
						col.bSearchable=false;
						col.bSortable=false;
					}
					else{
						col.sClass=val;
						col.sType=val;
					}
				})};  // colTypes
		if(options.colFormats!=undefined){$.each(options.colFormats,function(i,val){ if (val!=null){dtData.aoColumns[i].fnRender=
							function ( obj ) { return sprintf(val,obj.aData[obj.iDataRow][obj.iDataColumn]); }
					}})};  // colFormats

		if(options.colWidths!=undefined){$.each(options.colWidths,function(i,val){ if (val!=null){dtData.aoColumns[i].sWidth=val}})}; //colWidths
		dtData.aaSorting=options.sortBy;
	}
	
	return dtData;

};

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

Dashboards.generateXActionComponent = function(object){

	$("#"+ object.htmlObject).bind("click", function(){
		Dashboards.executeXAction(object);
	});
}

Dashboards.generateAutocompleteBoxComponent = function(object){

	Dashboards.makeQuery(object);
	
	var list = [];
	
	for(p in object.result){	
		var obj = {};
		obj.text = object.result[p][0];
		list.push(obj);
	}
	
	$("#"+ object.htmlObject).empty();
	
	$("#" + object.htmlObject ).autobox({
        list: list,
		match: function(typed) { return this.text.match(new RegExp(typed, "i")); },
        insertText: function(o) {return o.text },
		processChange: function(obj,obj_value) {obj.value = obj_value;Dashboards.processChange(obj.name);},
		multiSellection: object.selectMulti == undefined ? false : object.selectMulti,
		checkValue: object.checkValue == undefined ? true : object.checkValue,
		parent: object
      });
	
}

Dashboards.executeXAction = function(object){

	var url = "/pentaho/ViewAction?solution=" + object.solution + "&path=" + object.path + "&action=" + object.action + "&";

	var p = new Array(object.parameters.length);
	var parameters = [];
	for(var i= 0, len = p.length; i < len; i++){
		var key = object.parameters[i][0];
		var value = eval(object.parameters[i][1]);
		parameters.push(key + "=" + encodeURIComponent(value));
	}
	
	url += parameters.join("&");

	var _href = url.replace(/'/g,"&#39;");
	GB_show("Report",_href, $(window).height() - 50 , $(window).width() - 100);
};

Dashboards.getArgValue  = function(key)
{
	for (i=0;i<this.args.length;i++){
		if(this.args[i][0] == key){
			return this.args[i][1];
		}
	}
	
	return undefined;
}

Dashboards.ev = function(o){return typeof o == 'function'?o():o};


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

function getURLParameters(sURL) 
	{	
		if (sURL.indexOf("?") > 0){
		
			var arrParams = sURL.split("?");
			var arrURLParams = arrParams[1].split("&");
			var arrParam = [];
			
			for (i=0;i<arrURLParams.length;i++){
				var sParam =  arrURLParams[i].split("=");
				
				if (sParam[0].indexOf("param",0) == 0){
					var parameter = [sParam[0].substring(5,sParam[0].length),unescape(sParam[1])];
					arrParam.push(parameter);
				}
			}

		}

		return arrParam;
	};

function toFormatedString(value) {
		value += '';
		x = value.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1))
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		return x1 + x2;
	};


sprintfWrapper = {

    init : function () {

        if (typeof arguments == 'undefined') { return null; }
        if (arguments.length < 1) { return null; }
        if (typeof arguments[0] != 'string') { return null; }
        if (typeof RegExp == 'undefined') { return null; }

        var string = arguments[0];
        var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
        var matches = new Array();
        var strings = new Array();
        var convCount = 0;
        var stringPosStart = 0;
        var stringPosEnd = 0;
        var matchPosEnd = 0;
        var newString = '';
        var match = null;

        while (match = exp.exec(string)) {
            if (match[9]) { convCount += 1; }

            stringPosStart = matchPosEnd;
            stringPosEnd = exp.lastIndex - match[0].length;
            strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

            matchPosEnd = exp.lastIndex;
            matches[matches.length] = {
                match: match[0],
                left: match[3] ? true : false,
                sign: match[4] || '',
                pad: match[5] || ' ',
                min: match[6] || 0,
                precision: match[8],
                code: match[9] || '%',
                negative: parseInt(arguments[convCount]) < 0 ? true : false,
                argument: String(arguments[convCount])
            };
        }
        strings[strings.length] = string.substring(matchPosEnd);

        if (matches.length == 0) { return string; }
        if ((arguments.length - 1) < convCount) { return null; }

        var code = null;
        var match = null;
        var i = null;

        for (i=0; i<matches.length; i++) {
			var m =matches[i];

            if (m.code == '%') { substitution = '%' }
            else if (m.code == 'b') {
                m.argument = String(Math.abs(parseInt(m.argument)).toString(2));
                substitution = sprintfWrapper.convert(m, true);
            }
            else if (m.code == 'c') {
                m.argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(m.argument)))));
                substitution = sprintfWrapper.convert(m, true);
            }
            else if (m.code == 'd') {
				m.argument = toFormatedString(String(Math.abs(parseInt(m.argument))));
                substitution = sprintfWrapper.convert(m);
            }
            else if (m.code == 'f') {
				m.argument = toFormatedString(String(Math.abs(parseFloat(m.argument)).toFixed(m.precision ? m.precision : 6)));
                substitution = sprintfWrapper.convert(m);
            }
            else if (m.code == 'o') {
                m.argument = String(Math.abs(parseInt(m.argument)).toString(8));
                substitution = sprintfWrapper.convert(m);
            }
            else if (m.code == 's') {
                m.argument = m.argument.substring(0, m.precision ? m.precision : m.argument.length)
                substitution = sprintfWrapper.convert(m, true);
            }
            else if (m.code == 'x') {
                m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
                substitution = sprintfWrapper.convert(m);
            }
            else if (m.code == 'X') {
                m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
                substitution = sprintfWrapper.convert(m).toUpperCase();
            }
            else {
                substitution = m.match;
            }

            newString += strings[i];
            newString += substitution;

        }
        newString += strings[i];

        return newString;

    },

    convert : function(match, nosign){
        if (nosign) {
            match.sign = '';
        } else {
            match.sign = match.negative ? '-' : match.sign;
        }
        var l = match.min - match.argument.length + 1 - match.sign.length;
        var pad = new Array(l < 0 ? 0 : l).join(match.pad);
        if (!match.left) {
            if (match.pad == '0' || nosign) {
                return match.sign + pad + match.argument;
            } else {
                return pad + match.sign + match.argument;
            }
        } else {
            if (match.pad == '0' || nosign) {
                return match.sign + match.argument + pad.replace(/0/g, ' ');
            } else {
                return match.sign + match.argument + pad;
            }
        }
    }
}

sprintf = sprintfWrapper.init;

