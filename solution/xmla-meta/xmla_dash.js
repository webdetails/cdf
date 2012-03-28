var level="", members="", catalog={}, lvl_obj={};

levelSelector = 
{
  name: "levelSelector",
  type: "select",
  parameter:"level",
  htmlObject: "object_select",
  queryDefinition: {
    queryType: "xmla_discover",
    catalog: "SampleData",
    query: function(){
      var query = Xmla.DISCOVER_SCHEMA_ROWSETS;
      return query;
    }
  },
  executeAtStart: true,
  postExecution:function(){
	Dashboards.processChange(this.name);
  }
}

memberSelector = 
{
  name: "memberSelector",
  type: "selectMulti",
  listeners:["level"],
  parameter:"members",
  htmlObject: "object_multi",
  size: "10",
  executeAtStart: false,
  queryDefinition: {
    queryType: "xmla_discover",
    query: function() {
      return level;
    }
  },
   preExecution:function(){
      memberSelector.query = function(){
	var query = level;
	return query;
      }
  }
}

    resultsTable = {
        name: "resultsTable",
        type: "TableComponent",
        listeners:["level"],
        chartDefinition: {
            queryType: 'xmla_discover',
            displayLength: 10,
            //catalog: catalog,
            query: function(){
              return level;
            }
        },
	postFetch: function(json){
	  //ADG supply a baseline
	  resultsTable.chartDefinition.colHeaders = [];
	  resultsTable.chartDefinition.colTypes = [];
	  
	  //ADG dynamically read the meatadata and create columns
	  $.each(json.metadata, function(i,e){
	    resultsTable.chartDefinition.colHeaders[i] = e.colName;
	    resultsTable.chartDefinition.colTypes[i]   = e.colType;
	  })	  
	},
	preExecution:function(){
	   memberSelector.query = function(){
	     var query = level;
	     return query;
	   }
       },
      htmlObject: "object_multi",
      executeAtStart: false
    }

var components = [levelSelector, resultsTable];

$(document).ready(
  function(){
    Dashboards.init(components);
  }
)