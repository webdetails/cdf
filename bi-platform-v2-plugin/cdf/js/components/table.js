/*
 * Function: fnLengthChange
 * Purpose:  Change the number of records on display
 * Returns:  array:
 * Inputs:   object:oSettings - DataTables settings object
 *           int:iDisplay - New display length
 */
if($.fn.dataTableExt != undefined){ // Ensure we load dataTables before this line. If not, just keep going
  $.fn.dataTableExt.oApi.fnLengthChange = function ( oSettings, iDisplay )
  {
    oSettings._iDisplayLength = iDisplay;
    oSettings.oApi._fnCalculateEnd( oSettings );

    // If we have space to show extra rows backing up from the end point - then do so
    if ( oSettings._iDisplayEnd == oSettings.aiDisplay.length )
    {
      oSettings._iDisplayStart = oSettings._iDisplayEnd - oSettings._iDisplayLength;
      if ( oSettings._iDisplayStart < 0 )
      {
        oSettings._iDisplayStart = 0;
      }
    }

    if ( oSettings._iDisplayLength == -1 )
    {
      oSettings._iDisplayStart = 0;
    }

    oSettings.oApi._fnDraw( oSettings );

    $('select', oSettings.oFeatures.l).val( iDisplay );
  };
/* Example
	 * $(document).ready(function() {
	 *    var oTable = $('#example').dataTable();
	 *    oTable.fnLengthChange( 100 );
	 * } );
	 */
}

var TableComponent = BaseComponent.extend({
  
  ph: undefined,
  
  update : function() {
    var cd = this.chartDefinition;
    if (cd == undefined){
     Dashboards.log("Fatal - No chart definition passed","error");
      return;
    }
    cd["tableId"] = this.htmlObject + "Table";

    // Clear previous table
    this.ph = $("#"+this.htmlObject);
    this.ph.empty();
    var myself = this;
    // remove drawCallback from the parameters, or
    // it'll be called before we have an actual table...
    var croppedCd = $.extend({},cd);
    croppedCd.drawCallback = undefined;
    this.queryState = new Query(croppedCd);
    this.query = this.queryState; // for analogy with ccc component's name
    // make sure to clean sort options
    var sortBy = this.chartDefinition.sortBy || [],
      sortOptions = [];
    for (var i = 0; i < sortBy.length; i++) {
      var col = sortBy[i][0];
      var dir = sortBy[i][1];
      sortOptions.push( col + (dir == "asc" ? "A" : "D"));
    }
    this.queryState.setSortBy(sortOptions);

    if(cd.paginateServerside) {
      this.extraOptions = this.extraOptions || [];
      this.extraOptions.push(["bServerSide",true]);
      this.extraOptions.push(["bProcessing",true]);
      this.queryState.setPageSize(parseInt(cd.displayLength || 10));
      this.queryState.setCallback(function(values) {
        changedValues = undefined;
        if((typeof(myself.postFetch)=='function')){
          changedValues = myself.postFetch(values);
        }
        if (changedValues != undefined) {
          values = changedValues;
        }
        myself.processTableComponentResponse(values);
      });
      this.queryState.setParameters(this.parameters);
      this.processTableComponentResponse();
    } else {
      this.queryState.fetchData(this.parameters, function(values) {
        changedValues = undefined;
        if((typeof(myself.postFetch)=='function')){
          changedValues = myself.postFetch(values);
        }
        if (changedValues != undefined) {
          values = changedValues;
        }
        myself.rawData = values;
        myself.processTableComponentResponse(values);
      });
    }
  },

  pagingCallback: function(url, params,callback,dataTable) {
    function p( sKey ) {
      for ( var i=0, iLen=params.length ; i<iLen ; i++ ) {
        if ( params[i].name == sKey ) {
          return params[i].value;
        }
      }
      return null;
    }
    var sortingCols = p("iSortingCols"),sort = [];
    if (sortingCols > 0) {
      for (var i = 0; i < sortingCols; i++) {
        var col = p("iSortCol_" + i);
        var dir = p("sSortDir_" + i);
        sort.push( col + (dir == "asc" ? "A" : "D"));
      }
    }
    var query = this.queryState,
    myself = this;
    query.setSortBy(sort.join(","));
    query.setPageSize(parseInt(p("iDisplayLength")));
    query.setPageStartingAt(p("iDisplayStart"));
    query.fetchData(function(d) {
      if (myself.postFetch){
        var mod = myself.postFetch(d,dataTable);
        if (typeof mod !== "undefined") {
          d = mod;
        }
      }
      var response = {
        iTotalRecords: d.queryInfo.totalRows,
        iTotalDisplayRecords: d.queryInfo.totalRows
        };
      response.aaData = d.resultset;
      response.sEcho = p("sEcho");
      myself.rawData = d;
      callback(response);
    });
  },

  processTableComponentResponse : function(json)
  {
    // General documentation here: http://datatables.net
    var myself = this,
      cd = this.chartDefinition,
      extraOptions = {};
   
    myself.ph.trigger('cdfTableComponentProcessResponse');
    
   
    // Set defaults for headers / types
    if(typeof cd.colHeaders === "undefined" || cd.colHeaders.length == 0)
      cd.colHeaders = json.metadata.map(function(i){return i.colName});

    if(typeof cd.colTypes === "undefined" || cd.colTypes.length == 0)
      cd.colTypes = json.metadata.map(function(i){return i.colType.toLowerCase()});

    var dtData0 = TableComponent.getDataTableOptions(cd);

    // Build a default config from the standard options
    $.each(this.extraOptions ? this.extraOptions : {}, function(i,e){
      extraOptions[e[0]] = e[1];
    });
    var dtData = $.extend(cd.dataTableOptions,dtData0,extraOptions);


    // Sparklines still applied to drawcallback
    var myself = this;
    dtData.fnDrawCallback = function(dataTableSettings) {
      var dataTable = this;
      myself.ph.find("tbody tr").each(function(row,tr){
          if (dataTable.fnGetPosition(tr) == null) //Tr not found in datatable, continue
              return true;
        $(tr).children("td").each(function(col,td){
            var position = dataTable.fnGetPosition(td),
                rowIdx = position[0],
                colIdx = position[2];
            var colType = cd.colTypes[colIdx];
            var addIn = myself.getAddIn("colType",colType);
            if (addIn) {
              var state = {},
                target = $(td),
                results = myself.rawData;
              if(!(target.parents('tbody').length)) {
                return;
              } else if (target.get(0).tagName != 'TD') {
                target = target.closest('td');
              }
              state.rawData = results;
              state.tableData = dataTable.fnGetData();
              state.colIdx = colIdx;
              state.rowIdx = rowIdx;
              state.series = results.resultset[state.rowIdx][0];
              state.category = results.metadata[state.colIdx].colName;
              state.value =  results.resultset[state.rowIdx][state.colIdx];
              if(cd.colFormats) {
                state.colFormat = cd.colFormats[state.colIdx];
              }
              state.target = target;
              addIn.call(td,state,myself.getAddInOptions("colType",addIn.getName()));
            } else if(cd.colFormats) {
              var format = cd.colFormats[position[1]],
                value = myself.rawData.resultset[rowIdx][colIdx];
              if (format && (typeof value != "undefined" && value !== null)) {
                $(td).text(sprintf(format,value));
              }
            }
        });
      });

	  // Old urlTemplate code. This needs to be here for backward compatibility
	  if(cd.urlTemplate != undefined){
		  var td =$("#" + myself.htmlObject + " td:nth-child(1)"); 
		  td.addClass('cdfClickable');
		  td.bind("click", function(e){
				  var regex = new RegExp("{"+cd.parameterName+"}","g");
				  var f = cd.urlTemplate.replace(regex,$(this).text());
				  eval(f);
				  });
	  }

      if(typeof cd.drawCallback == 'function'){
        cd.drawCallback.apply(myself,arguments);
      }

    };


    /* We need to make sure we're getting data from the right place,
     * depending on whether we're using CDA
     */
    if (json) {
      dtData.aaData = json.resultset;
    } 
    
    ////else {
    //  dtData.aaData = json;
  //  }
  
  
  
    /* If we're doing server-side pagination, we need to set up the server callback
     */
    if (dtData.bServerSide) {
      dtData.fnServerData = function(u,p,c) {
        myself.pagingCallback(u,p,c,this);
      };
    }
    myself.ph.html("<table id='" + this.htmlObject + "Table' class=\"tableComponent\" width=\"100%\"></table>");
    // We'll first initialize a blank table so that we have a table handle to work with while the table is redrawing
    this.dataTable = $("#"+this.htmlObject+'Table').dataTable(dtData);
  
    // We'll create an Array to keep track of the open expandable rows.
    this.dataTable.anOpen = [];


    myself.ph.find ('table').bind('click',function(e) {
      if (typeof cd.clickAction === 'function' || myself.expandOnClick) { 
        var state = {},
          target = $(e.target),
          results = myself.rawData; //Get postfetch result instead of query lastResults()
        if(!(target.parents('tbody').length)) {
          return;
        } else if (target.get(0).tagName != 'TD') {
          target = target.closest('td');
        }
        var position = myself.dataTable.fnGetPosition(target.get(0));
        state.rawData = myself.rawData;
        state.tableData = myself.dataTable.fnGetData();
        state.colIdx = position[1];
        state.rowIdx = position[0];
        state.series = results.resultset[state.rowIdx][0];
        
        state.category = results.metadata[state.colIdx].colName;
        state.value =  results.resultset[state.rowIdx][state.colIdx];
        state.colFormat = cd.colFormats[state.colIdx];           

          
        state.target = target;

        
        if (myself.expandOnClick) {
        	myself.handleExpandOnClick(state);
        }
        if (cd.clickAction)
	        cd.clickAction.call(myself,state);
      }
    });
    myself.ph.trigger('cdfTableComponentFinishRendering');
  },

   handleExpandOnClick:     function(event){     
        var myself = this,
            detailContainerObj = myself.expandContainerObject,
            activeclass = "expandingClass";
        if(typeof activeclass === 'undefined'){
          activeclass = "activeRow";
        }
        var obj = event.target.closest("tr");
            var a = event.target.closest("a");
            if (a.hasClass ('info')){
                    return;
            }else{
                    var row = obj.get(0);
                   
                    var value = event.series;
                    var htmlContent = $("#" + detailContainerObj).html();
                   
                    var anOpen = myself.dataTable.anOpen;
                    var i = $.inArray( row, anOpen );
                   
                    if( obj.hasClass(activeclass) ){
                      obj.removeClass(activeclass);
                      myself.dataTable.fnClose( row );
                      anOpen.splice(i,1);
                    }
                    else{
                            // Closes all open expandable rows .
                            for ( var j=0; j < anOpen.length; j++ ){
                                $(anOpen[j]).removeClass(activeclass);
                                myself.dataTable.fnClose( anOpen[j] );
                                anOpen.splice(j ,1);
                            }
                            
                            //Closes previously opened expandable row.
                           /* var prev = obj.siblings('.'+activeclass).each(function(i,d){
                                    var curr = $(d);
                                    curr.removeClass(activeclass);
                                    myself.dataTable.fnClose( d );
                            });*/

                            obj.addClass(activeclass);
                            
                            //Read parameters and fire changes
                            var results = myself.queryState.lastResults();
                            $(myself.expandParameters).each(function f(i, elt) {                            
                            	Dashboards.fireChange(elt[1], results.resultset[event.rowIdx][parseInt(elt[0],10)]);                            
                            });
                            myself.dataTable.fnOpen( row, htmlContent, activeclass );
                            anOpen.push( row );
                    };
            };
    }
},
{
  getDataTableOptions : function(options) {
    var dtData = {};

    if(options.tableStyle == "themeroller"){
      dtData.bJQueryUI = true;
    }
    dtData.bInfo = options.info;
    dtData.iDisplayLength = options.displayLength;
    dtData.bLengthChange = options.lengthChange;
    dtData.bPaginate = options.paginate;
    dtData.bSort = options.sort;
    dtData.bFilter = options.filter;
    dtData.sPaginationType = options.paginationType;
    dtData.sDom = options.sDom;
    dtData.aaSorting = options.sortBy;
    
    if (typeof options.oLanguage == "string"){
      dtData.oLanguage = eval("(" + options.oLanguage + ")");//TODO: er...
	}
    else {
      dtData.oLanguage = options.oLanguage;
	}

    if(options.colHeaders != undefined){
      dtData.aoColumns = new Array(options.colHeaders.length);
      for(var i = 0; i< options.colHeaders.length; i++){
        dtData.aoColumns[i]={}
        dtData.aoColumns[i].sClass="column"+i;
      };
      $.each(options.colHeaders,function(i,val){
        dtData.aoColumns[i].sTitle=val;
        if(val == "") dtData.aoColumns[i].bVisible=false;
      });  // colHeaders
      if(options.colTypes!=undefined){
        $.each(options.colTypes,function(i,val){
          var col = dtData.aoColumns[i];
          // Specific case: hidden cols
          if(val == "hidden") col.bVisible=false;
          col.sClass+=" "+val;
          col.sType=val;

        })
      };  // colTypes
      if(options.colFormats!=undefined){
      // Changes are made directly to the json

      };  // colFormats

      var bAutoWidth = true;
      if(options.colWidths!=undefined){
        $.each(options.colWidths,function(i,val){
          if (val!=null){
            dtData.aoColumns[i].sWidth=val;
            bAutoWidth = false;
          }
        })
      }; //colWidths
      dtData.bAutoWidth = bAutoWidth;

      if(options.colSortable!=undefined){
        $.each(options.colSortable,function(i,val){
          if (val!=null && ( !val || val == "false" ) ){
            dtData.aoColumns[i].bSortable=false
          }
        })
      }; //colSortable
      if(options.colSearchable!=undefined){
        $.each(options.colSearchable,function(i,val){
          if (val!=null && ( !val || val == "false" ) ){
            dtData.aoColumns[i].bSearchable=false
          }
        })
      }; //colSearchable

    }

    return dtData;
  }

}
);

