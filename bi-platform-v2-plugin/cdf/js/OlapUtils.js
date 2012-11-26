/******************************************************************************************************/
/**************************************** OLAP UTILS**************************************************/
/******************************************************************************************************/


var OlapUtils= {};

var OlapUtils = {

	mdxGroups: {},
	evolutionType: "Week"
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

OlapUtils.buttonsDescription = {
	"Drill Down": 'Drill down to the selected value and add the condition to the other charts',
	"Drill Up": 'Drill up and add the condition to the other charts',
	'Focus': "Focus on this value, adding the conditions to the other charts", 
	'Exclude': "Exclude this value from the chart",
	"Expand":'Expand the depth of the chart, showing an extra sublevel',
	"Collapse":'Collapse all previous expansions to the top most level',
	"Reset All": 'Reset all filters and conditions from this chart group, returning to the original conditions',
	"Cancel": "Cancel" 
}


OlapUtils.fireMdxGroupAction = function(mdxQueryGroup,idx,param1, param2, param3){

	/**         http://jira.pentaho.com/browse/BISERVER-3542	   *
	 *								   *
	 * Prior to Pentaho 3.5, this function received only 3 parameters: *
	 *(query,idx,PARAM). 						   *
	 * In Pentaho 3.5, the behavior	of the x/y and TimeSeries Charts   *
	 *changed, and this function passed to receive 5 parameters:
	 *(query,idx,chartDefinition,PARAM,SERIES).			   *
	 * When chartType == AreaChart, the value used to drill through is *
	 *SERIES, otherwise it's PARAM.					   */

	if(param2 != undefined && param3 != undefined){
	  cType = Dashboards.ev(param1.chartType);

	    if(cType == "AreaChart")
	      value = encode_prepare(param3);
	    else 
	      value = encode_prepare(param2);
	}
	else
	  value = encode_prepare(param1);


	var mdxQueryGroup = OlapUtils.mdxGroups[mdxQueryGroup];
	if (value == 'Others')
		return; // do nothing

	OlapUtils.lastClickedMdxQueryGroup = mdxQueryGroup;
	mdxQueryGroup.clickedIdx = idx;
	mdxQueryGroup.clickedValue = value;

	var clickedObj = mdxQueryGroup.mdxQueries[idx];

	var buttonsHash = { 
		"Drill Down": 'drilldown',
		"Drill Up": 'drillup',
		'Focus': "focus", 
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
		delete buttonsHash["Drill Down"];
		delete buttonsHash.Expand;
	}
	else{
		delete buttonsHash.Focus;
	}
	
	if(clickedObj.mdxQuery.axisPos == 0)
		delete buttonsHash["Drill Up"];

	// Expanded ones can't drill || focus
	if (clickedObj.mdxQuery.axisDepth > 0){
		delete buttonsHash["Drill Down"];
		delete buttonsHash.Focus;
		delete buttonsHash.Exclude;
	}


	var msg = "Available conditions: <br/> <ul>" ;
	$.each(buttonsHash, function(key,value){msg+="<li>" + OlapUtils.buttonsDescription[key] + "</li>"});
	msg += "</ul>";
	$.prompt(msg
		,{buttons: buttonsHash, callback: OlapUtils.mdxQueryGroupActionCallback }
	);

}

	
/******************************************************************************************************/
/***************************************** MDX QUERY ************************************************/
/******************************************************************************************************/


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

OlapUtils.mdxQuery.prototype.resetFilter = function(value){
	var rf = this.query["filters"]["rows"];
	var index = rf.indexOf(value);
	rf.splice(index,1);
	return index;
}

OlapUtils.mdxQuery.prototype.resetFilters = function(){
	this.query["filters"] = Dashboards.clone((this.originalHash["filters"] || {rows:[],columns: []}));
}

OlapUtils.mdxQuery.prototype.resetCondition = function(key){
	delete this.query["members"][key];
	delete this.query["sets"][key];
	if(this.query["conditions"][key+"InitialValue"] != undefined)
		this.query["where"][key] = this.query["conditions"][key+"InitialValue"];
	else
		delete this.query["where"][key];
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
	this.query["nonEmptyRows"] = hash["nonEmptyRows"] && true;
	this.query["nonEmptyColumns"] = hash["nonEmptyColumns"] && true;
	this.query["swapRowsAndColumns"] = hash["swapRowsAndColumns"] || false;
	this.query["filters"] = hash["filters"] || {rows:[],columns: []};
	this.query["where"] = hash["where"] || {};
	this.query["extra"] = hash["extra"] || {};
	this.query["conditions"] = [];
	this.query["drills"] = [];
};


OlapUtils.mdxQuery.prototype.clone = function() {
	var c = Dashboards.clone(this);
	return c;
};


OlapUtils.mdxQuery.prototype.generateAxisPart = function(axisDrill, axis, axisLevels, orderBy){
	if (axisDrill == false){
		return axis;
	}

	//var dim = axis.indexOf(".") == -1?axis:axis.substr(0,axis.indexOf("."));
	var dim = axis.indexOf("].") == -1?axis:axis.substr(0,axis.indexOf("].")+1);
	var axisLevel = this.axisPos + this.axisDepth;
	if (axisLevel > axisLevels.length - 1){
		axisLevel = axisLevels.length - 1
	}
	var q = "Descendants("  + axis + ", "+ dim + ".["  + axisLevels[axisLevel] + "],SELF)"
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
	$.each(_eh["filters"]["rows"],function(j,k){
		rowFilter.push(_eh["rows"] + ".Dimension.currentMember.Name <> '" + k+"' ");
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
			var el = typeof obj == 'function'?obj():obj
			if(el.length>0) whereArray.push(el);
		});
	if (whereArray.length>0){
		query += " where ( " + whereArray.join(' , ') + " )";
	}
	//alert(query);
	return query;

}

OlapUtils.mdxQuery.prototype.exclude = function(value){
	this.query["filters"]["rows"].push(value);
}

OlapUtils.mdxQuery.prototype.drillDown = function(value){
	
	//Clear previous excludes
	this.resetFilters();
	
	this.query["drills"].push(this.query.rows);
	this.query.rows = value;
	this.axisPos++;
}

OlapUtils.mdxQuery.prototype.drillUp = function(){
	this.axisPos--;
	return (this.query.rows = this.query["drills"].pop());
}

OlapUtils.mdxQuery.prototype.addCondition = function(key,value){
	return this.addConditionAux(key,value,'focus');
}

OlapUtils.mdxQuery.prototype.addInitialCondition = function(key,value){
	this.addConditionAux(key,value);
}

OlapUtils.mdxQuery.prototype.removeFilter = function(key,value){
	this.removeCondition(key,value,'exclude');
	
	//Re add previous foucs that was removed by exclude.
	var lastExclude = true
	for(v in this.query["conditions"][key]){lastExclude = false; break;}
	if(lastExclude && this.query["conditions"][key+"previousDrillValue"]  != undefined){
		this.addCondition(key,this.query["conditions"][key+"previousDrillValue"]);
		delete this.query["conditions"][key+"previousDrillValue"];
	}
}

OlapUtils.mdxQuery.prototype.removeCondition = function(key,value,op){
	
	if(this.query["conditions"][key]!= undefined){
		if(this.query["conditions"][key][value]!= undefined)
			delete this.query["conditions"][key][value];
		else {//Focus not present because exclusion condition set after focus => Remove all.
			delete this.query["conditions"][key];
			this.resetCondition(key);
			return true;
		}
	}
	
	var condition = value.substr(0,value.indexOf("]")+1) + ".[Filter]"; 
	this.setCondition(key,condition,op);
	return false;
}

OlapUtils.mdxQuery.prototype.removeConditions = function(key){
	this.query["conditions"][key] = [];
	this.resetCondition(key);
}

/**** NEXT FUNCTIONS ARE FOR INTERNAL USE ONLY *******/
OlapUtils.mdxQuery.prototype.replaceConditionsByDrill = function(key,value){

	//Clear previous focus and excludes
	if(this.query["conditions"][key] != undefined)
		this.query["conditions"][key] = [];
	
	return this.addConditionAux(key,value,'drill');
}

OlapUtils.mdxQuery.prototype.replaceConditionByExclude = function(key,value){
	return this.addConditionAux(key,value,'exclude');
}

OlapUtils.mdxQuery.prototype.addConditionAux = function(key,value,op){

	if(op == undefined){
		this.query["where"][key] = value;
		return;
	}
	
	var condition = value.substr(0,value.indexOf("]")+1) + ".[Filter]"; 
	
	//Store initial where cause for this key
	if(this.query["conditions"][key] == undefined){
		this.query["conditions"][key] = [];
		if(this.query["where"][key] != undefined)
			this.query["conditions"][key+"InitialValue"] = this.query["where"][key];
	}
	
	if(this.query["members"][key] == undefined){
		if (op == 'exclude'){
			//this.addMember(key,condition + " as (( "+value+".parent) - ("+value+"))");
		}
		else
			this.addMember(key,condition + " as Aggregate(" + key + "Filter)");
	
	}
		
	this.query["conditions"][key][value] = op
	
	if(op != 'exclude')
		delete this.query["conditions"][key+"previousDrillValue"];
	
	//Remove previous focus and drills for this value
	if(op != 'drill'){
		var aux = [];
		for(v in this.query["conditions"][key]){
			//Store previous focus for first exclude
			if(op == 'exclude' && this.query["conditions"][key+"previousDrillValue"] == undefined && this.query["conditions"][key][v] == 'drill'){
				this.query["conditions"][key+"previousDrillValue"] = v;
			}
			if(this.query["conditions"][key][v] == op) aux[v] = op;
		}
		this.query["conditions"][key] = aux;
	}
	
	return this.setCondition(key,condition,op);
}


OlapUtils.mdxQuery.prototype.setCondition = function(key,condition,op)
{	
	var set = [];
	for(v in this.query["conditions"][key])
		set.push(v);
		
	if(set.length > 0){
		if(op == "focus" || op == "drill")
			this.addSet(key,key + "Filter as {" + set.join(",") + "}");
		else{
			this.addMember(key,condition + " as ( ( "+ set[0] +".parent) - ("+ set.join(") - (") +"))");
		}
		if(condition != undefined)
			this.query["where"][key] = condition;
	}
	else
		this.resetCondition(key);

	return set;
}

OlapUtils.mdxQuery.prototype.addSet = function(key, set){

	this.query["sets"][key] = set;
}

OlapUtils.mdxQuery.prototype.addMember = function(key, member){

	this.query["members"][key] = member;
}

/******************************************************************************************************/
/************************************ MDX QUERYGROUP ***********************************************/
/******************************************************************************************************/

OlapUtils.lastClickedMdxQueryGroup;

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


OlapUtils.mdxQueryGroup.prototype.printConditions = function(){

	var out = "";
	var filters = 0;
	var conds = 0;

	for (i in this.activeFilters){
		var a = this.activeFilters[i];
		if (a.length > 0 && ++filters == 1)
			out += "<i>Exclusions: </i>";
		var mdxGroupName = this.name;
		var o = [];
		$.each(a,function(j,k){
			o.push(k[1] + " <a class=\"resetFilterButton\" href='javascript:OlapUtils.mdxGroups[\"" + mdxGroupName + "\"].removeFilter(\"" + i + "\",\"" + k[0] + "\")'>X</a>");
			++filters;
		});
		
		if(o.length > 0)
			out+= o.join(" , ") + " ;";

	}
	for (i in this.activeConditions){
		var a = this.activeConditions[i];
		if (a.length > 0 &&  ++conds == 1)
			out += " <i>Focus: </i>";
		var mdxGroupName = this.name;
		var o = [];
		$.each(a,function(j,k){
			o.push(k + " <a class=\"resetFilterButton\" href='javascript:OlapUtils.mdxGroups[\"" + mdxGroupName + "\"].removeCondition(\"" + i + "\",\"" + k + "\")'>X</a>");
			++conds;
		});
		if(o.length > 0)
			out+= o.join(" , ") + "; ";
	}

	if ((conds + filters)>2)
		out += " <a  style=\"padding-left:15px;\" href='javascript:OlapUtils.mdxGroups[\"" + this.name + "\"].resetAll()'>Reset All</a>";

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

OlapUtils.mdxQueryGroup.prototype.drillDown = function(key,value){

	Dashboards.incrementRunningCalls();
	var conditions = [];
	
	//CLean previous conditions,drill, and exclude messages for this id
	if(this.activeFilters != undefined) delete this.activeFilters[key];
	if(this.activeConditions != undefined) delete this.activeConditions[key];
			
	for (i in this.mdxQueries){
		var obj = this.mdxQueries[i];
		
		if (i == key){
			obj.mdxQuery.drillDown(value);
		}
		else
			conditions = obj.mdxQuery.replaceConditionsByDrill(key,value);
				
		Dashboards.update(obj.chartObject);
	}
	if(conditions.length > 0)
		this.activeConditions[key] = conditions;
		
	Dashboards.update(Dashboards.getComponent(this.name));
	Dashboards.decrementRunningCalls();
}

OlapUtils.mdxQueryGroup.prototype.drillUp = function(key){

	Dashboards.incrementRunningCalls();
	var conditions = [];
	
	//CLean previous conditions,drill, and exclude messages for this id
	if(this.activeFilters != undefined) delete this.activeFilters[key];
	if(this.activeConditions != undefined) delete this.activeConditions[key];
	
	var keyObj = this.mdxQueries[key];	
	var value =  keyObj.mdxQuery.drillUp();
	for (i in this.mdxQueries){
		var obj = this.mdxQueries[i];
		
		if (i != key){
			if(keyObj.mdxQuery.axisPos > 0)
				conditions = obj.mdxQuery.replaceConditionsByDrill(key,value);
			else
				obj.mdxQuery.removeCondition(key,value,'drill');
		}
				
		Dashboards.update(obj.chartObject);
	}
	if(conditions.length > 0)
		this.activeConditions[key] = conditions;

		
	Dashboards.update(Dashboards.getComponent(this.name));
	Dashboards.decrementRunningCalls();
}

OlapUtils.mdxQueryGroup.prototype.replaceFocus = function(key,values){
	
	for (i in this.mdxQueries)
		if(i != key)
			this.mdxQueries[i].mdxQuery.removeConditions(key);		
	
	this.focus(key,values);
}

OlapUtils.mdxQueryGroup.prototype.focus = function(key,values){
	
	var conditions = [];
	
	Dashboards.incrementRunningCalls();
	
	//CLean previous conditions,drill, and exclude messages for this id
	if(this.activeFilters != undefined) delete this.activeFilters[key];
	if(this.activeConditions != undefined) delete this.activeConditions[key];
			
	for (i in this.mdxQueries){
		if(i != key){
			var obj = this.mdxQueries[i];
			
			for(i = 0; i < values.length; i++){
				conditions = obj.mdxQuery.addCondition(key,values[i]);
			}
				
			Dashboards.update(obj.chartObject);
			
		}
	}
	if(conditions.length > 0)
		this.activeConditions[key] = conditions;
		
	Dashboards.update(Dashboards.getComponent(this.name));
	Dashboards.decrementRunningCalls();
}

OlapUtils.mdxQueryGroup.prototype.exclude = function(key,value){

		Dashboards.incrementRunningCalls();
		var members = value.split("].[");
		var memberValue = members[members.length-1].replace("]","");
		this.mdxQueries[key].mdxQuery.exclude(memberValue)
		Dashboards.update(this.mdxQueries[key].chartObject);
		
		var a = this.activeFilters[key] || [];
		a.push([memberValue,value]);
		this.activeFilters[key] = a;
		
		//Replace focus from active conditions by exclude
		for (i in this.mdxQueries){
			var query = this.mdxQueries[i];
			if (i != key){
				query.mdxQuery.replaceConditionByExclude(key,value);
				Dashboards.update(query.chartObject);
			}
		}
		
		//Remove previous focus message
		if(this.activeConditions[key] != undefined)
			var indexCondition = this.activeConditions[key].indexOf(value);
			if(indexCondition >= 0)
				this.activeConditions[key].splice(indexCondition,1);
		
		Dashboards.decrementRunningCalls();
		
}

OlapUtils.mdxQueryGroup.prototype.expand = function(key){
	this.mdxQueries[key].mdxQuery.axisDepth++;
	Dashboards.update(this.mdxQueries[key].chartObject);
}

OlapUtils.mdxQueryGroup.prototype.collapse = function(key){
	this.mdxQueries[key].mdxQuery.axisDepth--;
	Dashboards.update(this.mdxQueries[key].chartObject);
}

OlapUtils.mdxQueryGroup.prototype.resetAll = function(){

	Dashboards.incrementRunningCalls();
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
	Dashboards.decrementRunningCalls();

}

OlapUtils.mdxQueryGroup.prototype.removeCondition = function(key,value){
	
	Dashboards.incrementRunningCalls();
	
	for (i in this.mdxQueries){
		var obj = this.mdxQueries[i];
		//Remove Conditions and related filters(because filters are added after drill down)
		if(i != key){
			if(obj.mdxQuery.removeCondition(key,value,'focus') && this.activeFilters[key] != undefined )
				delete this.activeFilters[key];
		}
		else {
			obj.mdxQuery.query.rows = typeof obj.mdxQuery.originalHash.rows == 'function'? obj.mdxQuery.originalHash.rows(): obj.mdxQuery.originalHash.rows;
			obj.mdxQuery.axisPos = 0;	
			obj.mdxQuery.resetFilters();
		}
		
		Dashboards.update(obj.chartObject);
	}

	this.activeConditions[key].splice(this.activeConditions[key].indexOf(value),1);
		
	Dashboards.update(Dashboards.getComponent(this.name));
	Dashboards.decrementRunningCalls();
}

OlapUtils.mdxQueryGroup.prototype.removeFilter = function(key,value){
	
	Dashboards.incrementRunningCalls();
	var index = this.mdxQueries[key].mdxQuery.resetFilter(value);
	for (i in this.mdxQueries){
		var obj = this.mdxQueries[i];
		if(i != key)
			obj.mdxQuery.removeFilter(key,this.activeFilters[key][index][1]);
		Dashboards.update(obj.chartObject);
	}
	this.activeFilters[key].splice(index,1);
	if(this.activeFilters[key].length ==0)
		delete this.activeFilters[key];
		
	Dashboards.update(Dashboards.getComponent(this.name));
	Dashboards.decrementRunningCalls();
}

OlapUtils.mdxQueryGroupActionCallback = function(value,m){

	if (value == "cancel")
		return;  // do nothing.

	Dashboards.incrementRunningCalls();
	
	var mqg = OlapUtils.lastClickedMdxQueryGroup;
	var clickedObj = mqg.mdxQueries[mqg.clickedIdx];
	var axis = typeof clickedObj.mdxQuery.query.rows == 'function'?clickedObj.mdxQuery.query.rows():clickedObj.mdxQuery.query.rows;

	if (value == "drilldown"){
		mqg.drillDown(mqg.clickedIdx,axis + ".[" + mqg.clickedValue + "]");
	}
	else if (value == "drillup"){
		mqg.drillUp(mqg.clickedIdx,axis + ".[" + mqg.clickedValue + "]");
	}
	else if (value == "focus"){
		mqg.focus(mqg.clickedIdx,[axis + ".[" + mqg.clickedValue + "]"]);
	}
	else if( value == "filter" ){
		mqg.exclude(mqg.clickedIdx,axis + ".[" + mqg.clickedValue + "]");
	}
	else if (value == "expand"){
		mqg.expand(mqg.clickedIdx);
	}
	else if (value == "collapse"){
		mqg.collapse(mqg.clickedIdx);
	}
	else if (value == "resetall"){
		mqg.resetAll();
	}
	
	Dashboards.update(Dashboards.getComponent(mqg.name));
	Dashboards.decrementRunningCalls();
}

OlapUtils.getAxisPathString = function(axis,axisPath){
	var a = [];
	$.each(axisPath, function(i,v){ a.push("["+ v +"]"); });
	return axis + "." + a.join(".");
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

/******************************************************************************************************/
/************************************ GENERIC QUERIES **********************************************/
/******************************************************************************************************/


OlapUtils.GenericMdxQuery = Base.extend({

		mdxQuery : undefined,

		options : {},
		tableDefaults: {},
		chartDefaults: {},

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

			/*for(o in this.options)
				this.options[o] = OlapUtils.ev(this.options[o]);*/
				
			this.query = this.mdxQuery.getQuery();
				
			if(this.options.debug == true){
				alert(this.query);
			}
			
			
			
			return this.query;
		},

		getDataTableOptions: function(options){
			$.extend(this.tableDefaults,options);
			return TableComponent.getDataTableOptions(this.tableDefaults);
		},

		getChartOptions: function(options){
			$.extend(this.chartDefaults,options);
			return this.chartDefaults;
		}


	}); 
	

OlapUtils.EvolutionQuery = OlapUtils.GenericMdxQuery.extend({

		mdxQuery : undefined,
		thisMonth :"",
		lastMonth :"",
		lastYearMonth :"",
		
		specificDefaults : {
			baseDate: '2008-10-01',
			rows: '[Locale Codes]',
			rowLevels: ['Code'],
			measure: '[Total Month Requests]',
			debug: false
		},
		
		tableDefaults : {
			colHeaders: ["Dimension",'Total', '% m/m', '% m/m-12', 'Last 12 months'],
			colTypes: ['string', 'numeric', 'numeric', 'numeric', 'sparkline'],
			colFormats: [null, '%.0f', '%.2f', '%.2f', null],
			colWidths: ['100px', '50px', '50px' , '50px', '80px'],
			displayLength: 10,
			sparklineType: "line",
			sortBy: [[1,'desc']]
		},
		
		
		constructor: function(options,object){

			this.options = jQuery.extend({}, this.genericDefaults, this.specificDefaults, options);
			var options = this.options;
			//options.baseDate = OlapUtils.ev(options.baseDate);
			var thisPeriod = options.dateDim+".[This Period]";
			var lastPeriod = options.dateDim+".[Previous Period]";
			var lastYearPeriod = options.dateDim+".[Last Year Period]";
			var nonEmptyMeasure = ".[Not Null Measure]";		
			
			this.queryBase = {
				from: options.from,
				rows: options.rows,
				rowLevels: options.rowLevels,
				rowDrill: options.rowDrill,
				nonEmptyRows: options.nonEmptyRows,
				columns:  ""+options.measuresDim+nonEmptyMeasure+","+options.measuresDim+".[% m/m],"+options.measuresDim+".[% m/m-12],"+options.measuresDim+".[sparkdatamonths]",
				swapRowsAndColumns: false,
				orderBy: options.orderBy,
				sets: {
					"now": function(){return "now as [Date].[Date].[" + Dashboards.ev(options.baseDate) + "].Lag(30.0)" + ":" + " [Date].[Date].[" + Dashboards.ev(options.baseDate) + "]" },
					"oneMonthAgo": function(){return "oneMonthAgo as [Date].[Date].[" + Dashboards.ev(options.baseDate) + "].Lag(60.0)" + ":" + " [Date].[Date].[" + Dashboards.ev(options.baseDate) + "].Lag(30.0)" },
					"oneYearAgo": function(){return "oneYearAgo as [Date].[Date].[" + Dashboards.ev(options.baseDate) + "].Lag(395.0)" + ":" + " [Date].[Date].[" + Dashboards.ev(options.baseDate) + "].Lag(365.0)" },
					"last12Months":	function(){return "last12Months as LastPeriods(12.0, Ancestor("+options.dateDim+"."+options.dateLevel+".["+  Dashboards.ev(options.baseDate) + "],"+options.dateDim+"."+options.dateLevelMonth+")) "}
				},
				members: {
					todaysMonth: function(){return "[Date].[TodaysMonth] as Aggregate( now )"},
					notNullMeasure: function(){return ""+options.measuresDim+nonEmptyMeasure + " as Iif(isEmpty(" + options.measuresDim+"."+options.measure + "), 0 , "+options.measuresDim+"."+options.measure+") "},
					thisPeriodMeasure: function(){return ""+options.measuresDim+".[This Period] as Aggregate(now*"+options.measuresDim+nonEmptyMeasure+") "},
					previousPeriodMeasure:function(){return ""+options.measuresDim+".[Previous Period] as Aggregate(oneMonthAgo*"+options.measuresDim+nonEmptyMeasure+") "},
					lastYearPeriodMeasure:function(){return ""+options.measuresDim+".[Last Year Period] as Aggregate(oneYearAgo*"+options.measuresDim+nonEmptyMeasure+") "},
					mmMeasure:function(){return ""+options.measuresDim+".[% m/m] as 100.0*("+options.measuresDim+nonEmptyMeasure+" / "+options.measuresDim+".[Previous Period] - 1.0)  "},
					mm12Measure:function(){return ""+options.measuresDim+".[% m/m-12] as 100.0*("+options.measuresDim+nonEmptyMeasure+" / "+options.measuresDim+".[Last Year Period] - 1.0)  "},
					sparkdatamonths:function(){return ""+options.measuresDim+".[sparkdatamonths] as Generate([last12Months], Cast(("+options.measuresDim+nonEmptyMeasure+") + 0.0 as String), \" , \") "}
				},
				where:{
					dateBase: ""+options.dateDim+".[TodaysMonth]"
				}

			};
			// Init this querybase
			this.mdxQuery = new OlapUtils.mdxQuery(this.queryBase);

		},

		queryBase : {}
		

	});



OlapUtils.DimensionAnalysisQuery = OlapUtils.GenericMdxQuery.extend({

		chartTypesTranslation: {},
		translationHash: {},
		mdxQuery : undefined,
		thisMonth :"",
		lastMonth :"",
		lastYearMonth :"",
		
		specificDefaults : {
			startDate: '2008-10-01',
			endDate: '2008-11-01',
			rows: '[Product Operating Systems]',
			rowLevels: ["Platform","Version"],
			measure: '[Total Requests]',
			defaultChartType: "bar",
			debug: false,
			where: {}
		},
		
		tableDefaults : {
			colHeaders: ['Name','Value'],
			colTypes: ['string','numeric'],
			colFormats: [null, '%.0f'],
			sortBy:[[1,'desc']],
			lengthChange: false
		},

		chartDefaults : {
				domainLabelRotationDir: "up",
				domainLabelRotation: "0",
				orientation: "horizontal",
				title: "",
				isStacked: "true",
				is3d: false,
				foregroundAlpha: 0.8,
				showValues: true,
				chartType: function(){ return this.parent.queryBase.extra.translationHash.chartType;},
				datasetType: function(){return this.parent.queryBase.extra.translationHash.datasetType;},
				includeLegend: function(){return this.parent.queryBase.extra.translationHash.includeLegend;},
				topCountAxis: function(){return this.parent.queryBase.extra.translationHash.axis[1];}

			},
		
		constructor: function(options,object){

			this.options = jQuery.extend({}, this.genericDefaults, this.specificDefaults, options);
			var options = this.options;

			this.chartTypesTranslation= {
				"pie": {
					type: "jFreeChartComponent",
					chartType: "PieChart", 
					datasetType: "CategoryDataset", 
					axis:["columns","rows"], 
					member: "("+options.dateDim+".[Date Range], "+options.measuresDim+".[Avg])", 
					includeLegend: false
				},
				"bar": {
					type: "jFreeChartComponent",
					chartType: "BarChart", 
					datasetType: "CategoryDataset", 
					axis:["columns","rows"], 
					member: "("+options.dateDim+".[Date Range], "+options.measuresDim+".[Avg])", 
					includeLegend: false
				},
				"table": {
					type: "tableComponent",
					chartType: "PieChart", 
					datasetType: "CategoryDataset", 
					axis:["columns","rows"], 
					member: "("+options.dateDim+".[Date Range], "+options.measuresDim+".[Avg])", 
					includeLegend: false
				},
				"trend": {
					type: "jFreeChartComponent",
					chartType: "AreaChart",
					datasetType: "TimeSeriesCollection",
					axis:["rows","columns"], 
					member: "a",
					includeLegend: true
				}
			};

			this.queryBase= {
				from: options.from,
				rows: options.rows,
				rowLevels: options.rowLevels,
				rowDrill: options.rowDrill,
				nonEmptyRows: options.nonEmptyRows,
				columns:  function(){return this.extra.translationHash["member"]} ,
				swapRowsAndColumns: function(){return this.extra.translationHash["axis"][0]=="rows" },
				orderBy: "Avg(a,"+options.measuresDim+"."+options.measure+")",

				sets: {
					"a":
					function(){return "a as '("+options.dateDim+"."+options.dateLevel+".[" + Dashboards.ev(options.startDate) + "]:"+options.dateDim+"."+options.dateLevel+".["+ Dashboards.ev(options.endDate) + "])'"}
				},
				members: {
					daterange: ""+options.dateDim+".[Date Range] as Aggregate(a)",
					average: ""+options.measuresDim+".[Avg] as 'Avg(a,"+options.measuresDim+"."+options.measure+")'"
				},
				where: options.where,				
				extra: {}
			};

			// pass the properties of this to the chartDefaults
			var _chart = Dashboards.clone(this);
			delete _chart.chartDefaults;
			this.chartDefaults.parent = _chart;
			
			this.setChartType(options.defaultChartType);

			// Init this querybase
			this.mdxQuery = new OlapUtils.mdxQuery(this.queryBase);

		},

		setChartType: function(chartType){
			this.queryBase.extra.translationHash = this.chartTypesTranslation[chartType];
			this.chartDefaults.parent.queryBase.extra.translationHash = this.chartTypesTranslation[chartType];
		},

		getComponentType: function(){
			return this.chartDefaults.parent.queryBase.extra.translationHash.type;
		},

		queryBase : {}
		

	});
