var OlapUtils= {};
//
// MDXQuery

var OlapUtils = 
	{
		mdxGroups: {},
		evolutionType: "Week"
	}

OlapUtils.mdxQuery = function(hash){
	this.query = {};
	this.originalHash = {};
	this.update(hash);
	this.axisPos = 0;
	this.axisDepth = 0;
};

OlapUtils.mdxQuery.prototype.reset = function(){
	this.update(this.originalHash); 

};

OlapUtils.mdxQuery.prototype.resetFilters = function(){
	this.query["filters"] = Dashboards.clone(this.originalHash["filters"]) || {rows:{},columns: {}};
}


OlapUtils.mdxQuery.prototype.update = function(hash){

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

OlapUtils.mdxQuery.prototype.clone = function() {
	var c = Dashboards.clone(this);
	return c;
};


OlapUtils.mdxQuery.prototype.generateAxisPart = function(axisDrill, axis, axisLevels, orderBy){
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


OlapUtils.mdxQuery.prototype.getQuery = function(){
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
			query += " set " + value + " \n";
		}
		for(m in _eh["members"]){
			var value = typeof _eh["members"][m]=='function'?_eh["members"][m]():_eh["members"][m];
			query += " member " + value + " \n";
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

OlapUtils.mdxQuery.prototype.addFilter = function(axis, dimension, value){
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

OlapUtils.mdxQuery.prototype.addCondition = function(key, condition){

	this.query["where"][key] = condition;
}

OlapUtils.mdxQuery.prototype.removeCondition = function(key){

	delete this.query["where"][key];
}

OlapUtils.mdxQuery.prototype.addSet = function(key, set){

	this.query["sets"][key] = set;
}

OlapUtils.mdxQuery.prototype.addMember = function(key, member){

	this.query["members"][key] = member;
}


OlapUtils.initMdxQueryGroup = function(obj){

	var mdxQueryGroup = new OlapUtils.mdxQueryGroup(obj.name);

	for(m in obj.mdxQueries){

		mdxQueryGroup.addMdxQuery( 
			obj.mdxQueries[m].name,
			obj.mdxQueries[m].query,
			obj.mdxQueries[m].dimension,
			obj.mdxQueries[m].axis,   
			obj.mdxQueries[m].chart
		);
	}

	OlapUtils.mdxGroups[obj.name] = mdxQueryGroup;

	if(("#" + obj.htmlObject + "_evolutionType")  != undefined)
		$("#" + obj.htmlObject+ "_evolutionType").html(mdxQueryGroup.printEvolutionType(obj.htmlObject + "_evolutionType"));

	return mdxQueryGroup;
}


OlapUtils.updateMdxQueryGroup = function(obj){

	var mdxGroup = OlapUtils.mdxGroups[obj.name];
	if (mdxGroup == undefined){
		mdxGroup = OlapUtils.initMdxQueryGroup(obj);
	}

	$("#" + obj.htmlObject).html(mdxGroup.printConditions());

}


OlapUtils.mdxQueryGroup = function(name){
	this.name = name;
	this.mdxQueries = {};
	this.clickedIdx = -1;
	this.clickedValue = "";
	this.activeFilters = {};
	this.activeConditions = {};
};


OlapUtils.mdxQueryGroup.prototype.addMdxQuery = function(idx,mdxQuery,filterDimension, filterAxis, chartObject){
	this.mdxQueries[idx] = {mdxQuery: mdxQuery, filterDimension: filterDimension, filterAxis: filterAxis,chartObject:chartObject};
};

OlapUtils.mdxQueryGroup.prototype.removeMdxQuery = function(idx){
	delete this.mdxQueries.idx;
};

OlapUtils.buttonsDescription = {
	"Drill": 'Drill down to the selected value and add the condition to the other charts',
	'Focus': "Focus on this value, adding the conditions to the other charts", 
	'Exclude': "Exclude this value from the chart",
	"Expand":'Expand the depth of the chart, showing an extra sublevel',
	"Collapse":'Collapse all previous expansions to the top most level',
	"Reset All": 'Reset all filters and conditions from this chart group, returning to the original conditions',
	"Cancel": "Cancel" 
}

OlapUtils.fireMdxGroupAction = function( mdxQueryGroup,idx, value){

	value = encode_prepare(value);
	var mdxQueryGroup = OlapUtils.mdxGroups[mdxQueryGroup];
	if (value == 'Others')
		return; // do nothing

	OlapUtils.lastClickedMdxQueryGroup = mdxQueryGroup;
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
	$.each(buttonsHash, function(key,value){msg+="<li>" + OlapUtils.buttonsDescription[key] + "</li>"});
	msg += "</ul>";
	$.prompt(msg
		,{buttons: buttonsHash, callback: OlapUtils.mdxQueryGroupActionCallback }
	);

}

OlapUtils.lastClickedMdxQueryGroup;

OlapUtils.mdxQueryGroup.prototype.printConditions = function(){

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
		out += " <a href='javascript:OlapUtils.mdxGroups[\"" + this.name + "\"].resetAll()'>Reset</a>";

	return out;
}

OlapUtils.mdxQueryGroup.prototype.printEvolutionType = function(object){
	var out = "";
	var myArray = [["Week","Week"],["Month","Month"],["Year","Year"]];

	for(var i= 0, len  = myArray.length; i < len; i++){
		out += "<input onclick='OlapUtils.changeEvolutionType(\"" + object + "radio\")'";
		if(i==0){
			out += " CHECKED ";
		}		
		out += "type='radio' id='" + object + "radio' name='" + object + "radio' value=" + myArray[i][1] + " /> " + myArray[i][1] + (object.separator == undefined?"":object.separator);
	} 

	return out;
}

OlapUtils.changeEvolutionType = function(object){


	var value = "";
	var selector = document.getElementsByName(object);
	for(var i= 0, len  = selector.length; i < len; i++){
		if(selector[i].checked){
			value = selector[i].value;
			continue;
		};
	} 

	this.fireChange("OlapUtils.evolutionType",value);


}


OlapUtils.mdxQueryGroup.prototype.resetAll = function(){

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

OlapUtils.mdxQueryGroupActionCallback = function(value,m){

	if (value == "cancel")
		return;  // do nothing.

	var mqg = OlapUtils.lastClickedMdxQueryGroup;
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

OlapUtils.getAxisPathString = function(axis,axisPath){
	var a = [];
	$.each(axisPath, function(i,v){ a.push("["+ v +"]"); });
	return axis + "." + a.join(".");
}


/* GENERIC QUERIES */


OlapUtils.GenericMdxQuery = Base.extend({

		mdxQuery : {},

		options : {},

		genericDefaults : {
			dateDim: '[Date]',
			dateLevel: '[Date]',
			dateLevelMonth: '[Month]',
			from: '[CubeName]',
			nonEmptyRows: true,
			rowDrill: true,
			measuresDim: '[Measures]',
			orderBy: undefined,
			debug: false
		},

		constructor: function(options){
		},

		getQuery: function(){

			this.mdxQuery = new OlapUtils.mdxQuery(this.queryBase);
			this.query = this.mdxQuery.getQuery();
			if(this.options.debug == true){
				alert(this.query);
			}
			return this.query;
		}

	}); 


OlapUtils.EvolutionQuery = OlapUtils.GenericMdxQuery.extend({

		thisMonth :"",
		lastMonth :"",
		lastYearMonth :"",

		specificDefaults : {
			baseDate: '2008-10-01',
			rows: '[Locale Codes]',
			rowLevels: ['Code'],
			measure: '[Total Month Requests]',
			debug: true
		},

		constructor: function(options){

			this.options = jQuery.extend({}, this.genericDefaults, this.specificDefaults, options);
			var options = this.options;
			var thisMonth = options.dateDim+".[TodaysMonth]";
			var lastMonth = options.dateDim+".[LastMonth]";
			var lastYearMonth = options.dateDim+".[LastYearMonth]";

			this.queryBase = {
				from: options.from,
				rows: options.rows,
				rowLevels: options.rowLevels,
				rowDrill: options.rowDrill,
				nonEmptyRows: options.nonEmptyRows,
				columns:  ""+options.measuresDim+"."+options.measure+","+options.measuresDim+".[% m/m],"+options.measuresDim+".[% m/m-12],"+options.measuresDim+".[sparkdatamonths]",
				swapRowsAndColumns: false,
				orderBy: options.orderBy,
				sets: {
					"last12Months":
					function(){return "last12Months as LastPeriods(12.0, Ancestor("+options.dateDim+"."+options.dateLevel+".["+ options.baseDate + "],"+options.dateDim+"."+options.dateLevelMonth+")) "}
				},
				members: {
					thisMonth: thisMonth + " as 'Ancestor("+options.dateDim+"."+options.dateLevel+".["+ options.baseDate + "],"+options.dateDim+"."+options.dateLevelMonth+")' ",
					lastMonth: lastMonth + " as Ancestor("+options.dateDim+"."+options.dateLevel+".["+ options.baseDate + "],"+options.dateDim+"."+options.dateLevelMonth+").Lag(1.0) ",
					lastYearMonth: lastYearMonth + " as Ancestor("+options.dateDim+"."+options.dateLevel+".["+ options.baseDate + "],"+options.dateDim+"."+options.dateLevelMonth+").Lag(12.0) ",
					lastMonthMeasure:""+options.measuresDim+".[LastMonth] as Aggregate("+options.dateDim+".[LastMonth]*"+options.measure+") ",
					lastYearMonthMeasure:""+options.measuresDim+".[LastYearMonth] as Aggregate("+options.dateDim+".[LastYearMonth]*"+options.measure+") ",
					mmMeasure:""+options.measuresDim+".[% m/m] as 100.0*("+options.measuresDim+"."+options.measure+" / "+options.measuresDim+".[LastMonth] - 1.0)  ",
					mm12Measure:""+options.measuresDim+".[% m/m-12] as 100.0*("+options.measuresDim+"."+options.measure+" / "+options.measuresDim+".[LastYearMonth] - 1.0)  ",
					sparkdatamonths:""+options.measuresDim+".[sparkdatamonths] as Generate([last12Months], Cast(("+options.measuresDim+"."+options.measure+") + 0.0 as String), \" , \") "
				},
				where:{
					dateBase: ""+options.dateDim+".[TodaysMonth]",
				}

			};

		},

		queryBase : {},

	});


/*
 this.getQuery = function(){
 this.query = this.mdxQuery.getQuery();
 if(options.debug == true){
 return(this.query);
		}
	}*/

