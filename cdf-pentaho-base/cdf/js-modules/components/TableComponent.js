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
    '../Logger',
    'amd!../lib/underscore',
    './UnmanagedComponent',
    '../dashboard/Sprintf',
    '../lib/jquery',
    'amd!../lib/datatables',
    '../addIns/colTypes'
], function(Logger, _, UnmanagedComponent, sprintf, $) {

  // Ensure we load dataTables before this line. If not, just keep going
  if($.fn.dataTableExt != undefined) {

    /**
     * Changes the number of records on display
     * @param {object} oSettings DataTables settings object
     * @param iDisplay New display length
     * @return {array}
     */
    $.fn.dataTableExt.oApi.fnLengthChange = function(oSettings, iDisplay) {
      oSettings._iDisplayLength = iDisplay;
      oSettings.oApi._fnCalculateEnd(oSettings);

      // If we have space to show extra rows backing up from the end point - then do so
      if(oSettings._iDisplayEnd == oSettings.aiDisplay.length) {
        oSettings._iDisplayStart = oSettings._iDisplayEnd - oSettings._iDisplayLength;
        if(oSettings._iDisplayStart < 0) {
          oSettings._iDisplayStart = 0;
        }
      }

      if(oSettings._iDisplayLength == -1) {
        oSettings._iDisplayStart = 0;
      }

      oSettings.oApi._fnDraw(oSettings);

      $('select', oSettings.oFeatures.l).val(iDisplay);
    };
    /* Example
     * $(document).ready(function() {
     *    var oTable = $('#example').dataTable();
     *    oTable.fnLengthChange(100);
     * });
     */

    /*
     * DataTables 1.10 sorting functions compatibility extension
     */  
    $.extend($.fn.dataTableExt.oSort, {

      /*
       * html sorting (ignore html tags)
       */
      "html-asc": function(a, b) {
        var x = a.replace(/<.*?>/g, "").toLowerCase();
        var y = b.replace(/<.*?>/g, "").toLowerCase();
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      },

      "html-desc": function(a, b) {
        var x = a.replace(/<.*?>/g, "").toLowerCase();
        var y = b.replace(/<.*?>/g, "").toLowerCase();
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
      },

      /*
       * date sorting
       */
      "date-asc": function(a, b) {
        var x = Date.parse(a);
        var y = Date.parse(b);

        if(isNaN(x) || x === "") {
          x = Date.parse("01/01/1970 00:00:00");
        }
        if(isNaN(y) || y === "") {
          y = Date.parse("01/01/1970 00:00:00");
        }

        return x - y;
      },

      "date-desc": function(a, b) {
        var x = Date.parse(a);
        var y = Date.parse(b);

        if(isNaN(x) || x === "") {
          x = Date.parse("01/01/1970 00:00:00");
        }
        if(isNaN(y) || y === "") {
          y = Date.parse("01/01/1970 00:00:00");
        }

        return y - x;
      },

      /* 
       * If table elements have class 'numeric' and values are represented as strings (e.g. "234456.5675")
       * let's try and convert them to numeric values for sorting. Source based on version 1.7.5 of dataTables.js 
       */
      "numeric-asc": function(a, b) {
        a = (a == "-" || a == "") ? 0 : ($.isNumeric(a) ? a * 1 : 0);
        b = (b == "-" || b == "") ? 0 : ($.isNumeric(b) ? b * 1 : 0);
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
      },

      "numeric-desc": function(a, b) {
        a = (a == "-" || a == "") ? 0 : ($.isNumeric(a) ? a * 1 : 0);
        b = (b == "-" || b == "") ? 0 : ($.isNumeric(b) ? b * 1 : 0);
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
      }
    });
  }

  /*
   * DataTables 1.10 `two_button` pagination control compatibility file
   */
  if($.fn.DataTable != undefined && $.fn.DataTable.ext != undefined) {
    $.extend($.fn.DataTable.ext.classes, {
      "sNoFooter": "",

      "sPagePrevEnabled": "paginate_enabled_previous",
      "sPagePrevDisabled": "paginate_disabled_previous",
      "sPageNextEnabled": "paginate_enabled_next",
      "sPageNextDisabled": "paginate_disabled_next"
    });

    $.extend($.fn.DataTable.ext.oJUIClasses, {
      "sNoFooter": "",

      "sSortable": "",
      "sSortAsc": "",
      "sSortDesc": "",
      "sSortColumn": "",

      "sPagePrevEnabled": "fg-button ui-button ui-state-default ui-corner-left",
      "sPagePrevDisabled": "fg-button ui-button ui-state-default ui-corner-left ui-state-disabled",
      "sPageNextEnabled": "fg-button ui-button ui-state-default ui-corner-right",
      "sPageNextDisabled": "fg-button ui-button ui-state-default ui-corner-right ui-state-disabled",
      "sPageJUINext": "ui-icon ui-icon-circle-arrow-e",
      "sPageJUIPrev": "ui-icon ui-icon-circle-arrow-w"
    });

    $.extend($.fn.DataTable.ext.pager, {
      "two_button": {
        "fnInit": function(oSettings, nPaging, fnCallbackDraw) {
          var oLang = oSettings.oLanguage.oPaginate;
          var oClasses = oSettings.oClasses;
          var fnClickHandler = function(e) {
            if(oSettings.oApi._fnPageChange(oSettings, e.data.action)) {
              fnCallbackDraw(oSettings);
            }
          };

          var sAppend = (!oSettings.bJUI)
            ? '<a class="' + oSettings.oClasses.sPagePrevDisabled + '" tabindex="' + oSettings.iTabIndex + '" role="button"></a>' +
              '<a class="' + oSettings.oClasses.sPageNextDisabled + '" tabindex="' + oSettings.iTabIndex + '" role="button"></a>'
            : '<a class="' + oSettings.oClasses.sPagePrevDisabled + '" tabindex="' + oSettings.iTabIndex + '" role="button"><span class="' + oSettings.oClasses.sPageJUIPrev + '"></span></a>' +
              '<a class="' + oSettings.oClasses.sPageNextDisabled + '" tabindex="' + oSettings.iTabIndex + '" role="button"><span class="' + oSettings.oClasses.sPageJUINext + '"></span></a>';
          $(nPaging).append(sAppend);

          var els = $('a', nPaging);
          var nPrevious = els[0],
            nNext = els[1];

          oSettings.oApi._fnBindAction(nPrevious, {
            action: "previous"
          }, fnClickHandler);
          oSettings.oApi._fnBindAction(nNext, {
            action: "next"
          }, fnClickHandler);

          /* ID the first elements only */
          if(!oSettings.aanFeatures.p) {
            nPaging.id = oSettings.sTableId + '_paginate';
            nPrevious.id = oSettings.sTableId + '_previous';
            nNext.id = oSettings.sTableId + '_next';

            nPrevious.setAttribute('aria-controls', oSettings.sTableId);
            nNext.setAttribute('aria-controls', oSettings.sTableId);
          }
        },

        "fnUpdate": function(oSettings, fnCallbackDraw) {
          if(!oSettings.aanFeatures.p) {
            return;
          }

          var oClasses = oSettings.oClasses;
          var an = oSettings.aanFeatures.p;
          var nNode;

          /* Loop over each instance of the pager */
          for(var i = 0, iLen = an.length; i < iLen; i++) {
            nNode = an[i].firstChild;
            if(nNode) {
              /* Previous page */
              nNode.className = (oSettings._iDisplayStart === 0)
                ? oClasses.sPagePrevDisabled
                : oClasses.sPagePrevEnabled;

              /* Next page */
              nNode = nNode.nextSibling;
              nNode.className = (oSettings.fnDisplayEnd() == oSettings.fnRecordsDisplay())
                ? oClasses.sPageNextDisabled
                : oClasses.sPageNextEnabled;
            }
          }
        }
      }
    });
  }

  var TableComponent = UnmanagedComponent.extend({
  
    ph: undefined,

    update: function() {
      var myself = this;
      if(!myself.preExec()) {
        return;
      }
      if(!myself.htmlObject) {
        return myself.error("TableComponent requires an htmlObject");
      }
      try {
        if(!myself.isSilent()) {
          myself.block();
        }
        myself.setup();
        if(myself.chartDefinition.paginateServerside) {
          myself.paginatingUpdate();
        } else {
          /* The non-paging query handler only needs to concern itself
           * with handling postFetch and calling the draw function
           */
          var success = _.bind(function(data) {
            myself.rawData = data;
            myself.processTableComponentResponse(data)
          }, myself);
          var handler = myself.getSuccessHandler(success);

          myself.queryState.setAjaxOptions({async: true});
          // Query doesn't have access to Dashboard object, send parameter values
          var params;
          if(myself.parameters != undefined) {
            // create a copy of the parameters array
            params = $.extend(true, [], myself.parameters);
            // replace the dashboard's parameter name with it's value
            params = _.map(params, function(param) {
              param[1] = myself.dashboard.getParameterValue(param[1]);
              return param;
            });
          } else {
            params = [];
          }
          myself.queryState.fetchData(params, handler);
        }
      } catch(e) {
        /*
         * Something went wrong and we won't have handlers firing in the future
         * that will trigger unblock, meaning we need to trigger unblock manually.
         */
        Logger.exception(e);
        if(!myself.isSilent()) {
          myself.unblock();
        }
      }
    },
    
    paginatingUpdate: function() {
      var cd = this.chartDefinition;
      this.extraOptions = this.extraOptions || [];
      this.extraOptions.push(["bServerSide", true]);
      this.extraOptions.push(["bProcessing", true]);
      this.queryState.setPageSize(parseInt(cd.displayLength || 10));
      
      var success = _.bind(function(values) {
        changedValues = undefined;
        if(typeof this.postFetch == 'function') {
          changedValues = this.postFetch(values);
        }
        if(changedValues != undefined) {
          values = changedValues;
        }
        this.processTableComponentResponse(values);
      }, this);

      this.queryState.setCallback(success);
      this.queryState.setParameters(this.parameters);
      this.queryState.setAjaxOptions({async: true});
      this.queryState.fetchData(this.parameters, success);
     },

    /* Initial setup: clearing out the htmlObject and building the query object */
    setup: function() {
      var cd = this.chartDefinition;
      if(cd == undefined) {
        Logger.log("Fatal - No chart definition passed", "error");
        return;
      }

      // Make sure we have a tableStyle in place
      if(typeof cd.tableStyle === "undefined") {
        cd.tableStyle = this.dashboard.getWcdfSettings().rendererType === "bootstrap" ?
        "bootstrap" : "classic";
      }

      cd["tableId"] = this.htmlObject + "Table";

      // make sure we have no expand parameters set
      var myself = this;
      $(this.expandParameters).each(function f(i, elt) {
        myself.dashboard.setParameter(elt[1], "");
      });

      // Clear previous table
      this.ph = $("#" + this.htmlObject).empty();
      // remove drawCallback from the parameters, or
      // it'll be called before we have an actual table...
      var croppedCd = $.extend({}, cd);
      croppedCd.drawCallback = undefined;
      this.queryState = this.dashboard.getQuery(croppedCd);
      this.query = this.queryState; // for analogy with ccc component's name
      // make sure to clean sort options
      var sortBy = this.chartDefinition.sortBy || [],
        sortOptions = [];
      for(var i = 0; i < sortBy.length; i++) {
        var col = sortBy[i][0];
        var dir = sortBy[i][1];
        sortOptions.push(col + (dir == "asc" ? "A" : "D"));
      }
      this.queryState.setSortBy(sortOptions);
    },

    pagingCallback: function(url, params, callback, dataTable) {
      function p(sKey) {
        for(var i = 0, iLen = params.length; i < iLen ; i++) {
          if(params[i].name == sKey) {
            return params[i].value;
          }
        }
        return null;
      }
      var sortingCols = p("order"), sort = [];
      if(sortingCols.length > 0) {
        for(var i = 0; i < sortingCols.length; i++) {
          var col = sortingCols[i].column;
          var dir = sortingCols[i].dir;
          sort.push(col + (dir == "asc" ? "A" : "D"));
        }
      }
      var query = this.queryState,
      myself = this;
      query.setSortBy(sort.join(","));
      query.setPageSize(parseInt(p("length")));
      query.setPageStartingAt(p("start"));
      query.setSearchPattern(p("search") ? p("search").value : "");
      query.fetchData(function(d) {
        if(myself.postFetch) {
          var mod = myself.postFetch(d, dataTable);
          if(typeof mod !== "undefined") {
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
    
    /* 
     * Callback for when the table is finished drawing. Called every time there
     * is a redraw event (so not only updates, but also pagination and sorting).
     * We handle addIns and such things in here.
     */
    fnDrawCallback: function(dataTableSettings) {
      var dataTable = dataTableSettings.oInstance,
          cd = this.chartDefinition,
          myself = this;
          
      var tableRows = this.ph.find("tbody tr");
          for(var k = 0; k < tableRows.length; k++) {
        /* 
         * Reject rows that are not actually part
         * of the datatable (e.g. nested tables)
         */
        if(dataTable.fnGetPosition(tableRows[k]) == null) {
          return true;
        }
        var tableData = $(tableRows[k]).children("td");
        for(var i = 0; i < tableData.length; i++) {
          var td = tableData[i];
          var $td = $(td);
            var position = dataTable.fnGetPosition(td);
            if(position && typeof position[0] == "number") {
              var rowIdx = position[0],
                  colIdx = position[2];
              var foundAddIn = myself.handleAddIns(dataTable, td, $td, rowIdx, colIdx);
              /* 
               * Process column format for those columns
               * where we didn't find a matching addIn
               */
              if(!foundAddIn && cd.colFormats) {
                var format = cd.colFormats[colIdx],
                  value = myself.rawData.resultset[rowIdx][colIdx];
                if(format && (typeof value != "undefined" && value !== null)) {
                  $td.text(sprintf(format, value));
                }
              }
            }
        }
      }

      /* Old urlTemplate code. This needs to be here for backward compatibility */
      if(cd.urlTemplate != undefined) {
        var td = $("#" + myself.htmlObject + " td:nth-child(1)"); 
        td.addClass('cdfClickable');
        td.bind("click", function(e) {
          var regex = new RegExp("{" + cd.parameterName + "}", "g");
          var f = cd.urlTemplate.replace(regex, $(this).text());
          eval(f);
        });
      }
      /* Handle post-draw callback the user might have provided */
      if(typeof cd.drawCallback == 'function') {
        cd.drawCallback.apply(myself, arguments);
      }
    },

    /* 
     * Handler for when the table finishes initialising. This only happens once,
     * when the table *initialises*, as opposed to every time the table is drawn,
     * so it provides us with a good place to add the postExec callback.
     */
    fnInitComplete: function() {
      this.postExec();
      if(!this.isSilent()) {
        this.unblock();
      }
    },

    /* 
     * Resolve and call addIns for the given td in the context of the given 
     * dataTable. Returns true if there was an addIn and it was successfully
     * called, or false otherwise.
     */
    handleAddIns: function(dataTable, td, $td, rowIdx, colIdx) {
      var cd = this.chartDefinition,
          colType = cd.colTypes[colIdx],     
          state = {},
          target = $td,
          results = this.rawData,
          addIn = this.getAddIn("colType", colType);
      if(!addIn) {
        return false;
      }
      try {
        if(!(target.parents('tbody').length)) {
          return;
        } else if(target.get(0).tagName != 'TD') {
          target = target.closest('td');
        }
        state.rawData = results;
        state.tableData = dataTable.fnGetData();
        state.colIdx = colIdx;
        state.rowIdx = rowIdx;
        state.series = results.resultset[state.rowIdx][0];
        state.category = results.metadata[state.colIdx].colName;
        state.value = results.resultset[state.rowIdx][state.colIdx];
        if(cd.colFormats) {
          state.colFormat = cd.colFormats[state.colIdx];
        }
        state.target = target;
        addIn.call(td, state, this.getAddInOptions("colType", addIn.getName()));
        return true;
      } catch(e) {
        Logger.exception(e);
        return false;
      }
    },

    processTableComponentResponse: function(json) {
      var myself = this,
          cd = myself.chartDefinition,
          extraOptions = {};

      myself.ph.trigger('cdfTableComponentProcessResponse');

      // Set defaults for headers / types
      if(typeof cd.colHeaders === "undefined" || cd.colHeaders.length == 0) {
        cd.colHeaders = json.metadata.map(function(i) { return i.colName; });
      }

      if(typeof cd.colTypes === "undefined" || cd.colTypes.length == 0) {
        cd.colTypes = json.metadata.map(function(i) { return i.colType.toLowerCase(); });
      }

      var dtData0 = TableComponent.getDataTableOptions(cd);

      // Build a default config from the standard options
      $.each(myself.extraOptions ? myself.extraOptions : {}, function(i, e) {
        extraOptions[e[0]] = e[1];
      });
      var dtData = $.extend(cd.dataTableOptions, dtData0, extraOptions);


      /* Configure the table event handlers */
      dtData.fnDrawCallback = _.bind(myself.fnDrawCallback, myself);
      dtData.fnInitComplete = _.bind(myself.fnInitComplete, myself);
      /* fnServerData is required for server-side pagination */
      if(dtData.bServerSide) {
        dtData.fnServerData = function(u, p, c) {
          myself.pagingCallback(u, p, c, this);
        };
      }

      /* We need to make sure we're getting data from the right place,
       * depending on whether we're using CDA
       */
      if(json) { dtData.aaData = json.resultset; }
      
      var tableClassName = dtData.tableStyle == "bootstrap"
        ? 'table table-striped table-bordered form-inline table-responsive'
        : 'tableComponent compact';
    
      myself.ph.html("<table id='" + myself.htmlObject + "Table' class='" + tableClassName + "' width='100%'></table>");

      /* 
       * We'll first initialize a blank table so that we have a
       * table handle to work with while the table is redrawing
       */
      myself.dataTable = $("#" + myself.htmlObject + 'Table').dataTable(dtData);

      // We'll create an Array to keep track of the open expandable rows.
      myself.dataTable.anOpen = [];

      myself.ph.find ('table').bind('click', function(e) {
        if(typeof cd.clickAction === 'function' || myself.expandOnClick) { 
          var state = {},
            target = $(e.target),
            results = myself.rawData; 
          if(!(target.parents('tbody').length)) {
            return;
          } else if(target.get(0).tagName != 'TD') {
            target = target.closest('td');
          }
          var position = myself.dataTable.fnGetPosition(target.get(0));
          state.rawData = myself.rawData;
          state.tableData = myself.dataTable.fnGetData();
          state.colIdx = position[2];
          state.rowIdx = position[0];
          state.series = results.resultset[state.rowIdx][0];
          
          state.category = results.metadata[state.colIdx].colName;
          state.value =  results.resultset[state.rowIdx][state.colIdx];
          state.colFormat = cd.colFormats[state.colIdx];           

          state.target = target;

          if(myself.expandOnClick) {
            myself.handleExpandOnClick(state);
          }
          if(cd.clickAction) {
            cd.clickAction.call(myself,state);
          }
        }
      });
      myself.ph.trigger('cdfTableComponentFinishRendering');
    },

    handleExpandOnClick: function(event) {
      var myself = this,
        detailContainerObj = myself.expandContainerObject,
        activeclass = "expandingClass";

      if(typeof activeclass === 'undefined') {
        activeclass = "activeRow";
      }

      var obj = event.target.closest("tr"),
        a = event.target.closest("a");

      if(a.hasClass('info')) {
        return;
      } else {
        var row = obj.get(0),
          anOpen = myself.dataTable.anOpen,
          i = $.inArray(row, anOpen);
        
        if(obj.hasClass(activeclass)) {
          myself.detachFromRow(row, i, activeclass);

          $(myself.expandParameters).each(function(i, elt) {
            myself.dashboard.setParameter(elt[1], "");
          });

        } else {
          // Closes all open expandable rows .
          for(var j = 0; j < anOpen.length; j++) {
            myself.detachFromRow(anOpen[j], j, activeclass);
          }
          obj.addClass(activeclass);

          myself.attachToRow(row, activeclass);

          //Read parameters and fire changes
          var results = myself.queryState.lastResults();
          var firstChange = null;

          $(myself.expandParameters).each(function(i, elt) {
            //skips the first expandParameter that was updated and calls myself.dashboard.setParameter for the all others
            if(!firstChange && myself.dashboard.getParameterValue(elt[1]) !== results.resultset[event.rowIdx][parseInt(elt[0], 10)]) {
              firstChange = elt;
            } else {
              myself.dashboard.setParameter(elt[1], results.resultset[event.rowIdx][parseInt(elt[0], 10)]);
            }
          });
          if(firstChange !== null) {
            myself.dashboard.fireChange(firstChange[1], results.resultset[event.rowIdx][parseInt(firstChange[0], 10)]);
          }
        }
      }
      $("td.expandingClass").click(
        function(event) {
          //Does nothing but it prevents problems on expandingClass clicks!
          event.stopPropagation();
          return;
        }
      );
    },

    attachToRow: function(row, activeClass) {
      this.dataTable.anOpen.push(row);
      this.dataTable.fnOpen(row, "", activeClass);

      var expandPlace = $(row).next().children().empty();

      var expandObj;
      if(!this.expandClone) {
        var containerId = "#" + this.expandContainerObject;

        expandObj = $( containerId );
        this.expandClone = expandObj.clone(true);
      } else {
        expandObj = this.expandClone;
      }

      expandObj.appendTo(expandPlace).show();
    },

    detachFromRow: function(row, index, activeClass) {

      //remove html from expanded table row
      $(row).next().find("td." + activeClass + " > *").remove();
      
      //close expanded table row
      $(row).removeClass(activeClass);
      this.dataTable.fnClose(row);
      this.dataTable.anOpen.splice(index, 1);

      //event just needs to trigger when row is expanded
      $(".dataTables_wrapper div.dataTables_paginate").off('click');
    }
  },
  {
    getDataTableOptions: function(options) {
      var dtData = {};

      if(options.tableStyle == "themeroller") {
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
      dtData.tableStyle = options.tableStyle;

      if(typeof options.oLanguage == "string") {
        dtData.oLanguage = eval("(" + options.oLanguage + ")");//TODO: er...
      } else {
        dtData.oLanguage = options.oLanguage;
      }

      if(typeof options.language == "string") {
        dtData.language = eval("(" + options.language + ")");//TODO: er...
      } else {
        dtData.language = options.language;
      }

      if(options.colHeaders != undefined) {
        dtData.aoColumns = new Array(options.colHeaders.length);
        for(var i = 0; i < options.colHeaders.length; i++) {
          dtData.aoColumns[i] = {}
          dtData.aoColumns[i].sClass = "column" + i;
        };
        $.each(options.colHeaders,function(i,val) {
          dtData.aoColumns[i].sTitle = val;
          if(val == "") { dtData.aoColumns[i].bVisible = false; }
        });  // colHeaders
        if(options.colTypes != undefined) {
          $.each(options.colTypes,function(i, val) {
            var col = dtData.aoColumns[i];
            // Specific case: hidden cols
            if(val == "hidden") { col.bVisible = false; }
            col.sClass += " " + val;
            col.sType = val;
          });
        };  // colTypes
        if(options.colFormats != undefined) {
          // Changes are made directly to the json
        }; // colFormats

        var bAutoWidth = true;
        if(options.colWidths != undefined) {
          $.each(options.colWidths,function(i, val) {
            if(val != null) {
              dtData.aoColumns[i].sWidth = val;
              bAutoWidth = false;
            }
          })
        }; //colWidths
        dtData.bAutoWidth = bAutoWidth;

        if(options.colSortable != undefined) {
          $.each(options.colSortable, function(i, val) {
            if(val != null && (!val || val == "false")) {
              dtData.aoColumns[i].bSortable = false
            }
          })
        }; //colSortable
        if(options.colSearchable != undefined) {
          $.each(options.colSearchable, function(i, val) {
            if(val != null && (!val || val == "false")) {
              dtData.aoColumns[i].bSearchable = false
            }
          })
        }; //colSearchable

      }

      return dtData;
    }
  });

  return TableComponent;
});
