/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


define([
  './UnmanagedComponent',
  '../Logger',
  '../dashboard/Utils',
  '../dashboard/Sprintf',
  'amd!../lib/underscore',
  '../lib/jquery',
  'amd!../lib/datatables',
  '../addIns/colTypes',
  'css!./theme/TableComponent'
], function(UnmanagedComponent, Logger, Utils, sprintf, _, $) {

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
      this.isDataPush = false;

      this._throwIfDisposed();

      if(!this.preExec()) {
        return;
      }

      if(!this.htmlObject) {
        return this.error("TableComponent requires an htmlObject");
      }

      try {
        if(!this.isSilent()) {
          this.block();
        }

        this.setup();

        if(this.chartDefinition.paginateServerside) {
          return this.paginatingUpdate();
        }

        /* The non-paging query handler only needs to concern itself
         * with handling postFetch and calling the draw function
         */
        var success = _.bind(function(data) {
          this.rawData = data;

          this.processTableComponentResponse(data);
        }, this);


        // Query doesn't have access to Dashboard object, send parameter values
        var parameters = this.__getParameterValues();
        var handler = this.getSuccessHandler(success);

        this.queryState.setAjaxOptions({async: true});
        var myself = this;
        this.queryState.fetchData(parameters, handler, function() {
          if(myself.failureCallback) {
            myself.failureCallback();
          }
          myself.isDataPush = false;
          myself._maybeUnblock();
          myself.trigger("cdf cdf:error", myself, "", null);
        } );
      } catch(e) {
        /*
         * Something went wrong and we won't have handlers firing in the future
         * that will trigger unblock, meaning we need to trigger unblock manually.
         */
        Logger.exception(e);
        if(!this.isSilent()) {
          this.unblock();
        }
      }
    },

    __getParameterValues: function() {
      var parameters = [];

      if(this.parameters != null) {
        // create a copy of the parameters array
        parameters = $.extend(true, [], this.parameters);

        // replace the dashboard's parameter name with it's value
        parameters = _.map(parameters, function(param) {
          param[1] = this.dashboard.getParameterValue(param[1]);

          return param;
        }, this);
      }

      return parameters;
    },

    paginatingUpdate: function() {
      this.extraOptions = this.extraOptions || [];

      this.extraOptions.push(["bServerSide", true]);
      this.extraOptions.push(["bProcessing", true]);

      var pageSize = parseInt(this.chartDefinition.displayLength || 10);
      this.queryState.setPageSize(pageSize);
      
      var success = _.bind(function(values) {
        var changedValues;

        if(typeof this.postFetch === 'function') {
          changedValues = this.postFetch(values);
        }

        if(changedValues != null) {
          values = changedValues;
        }

        this.processTableComponentResponse(values);
      }, this);

      this.queryState.setCallback(success);

      if(this.parameters) {
        this.queryState.setParameters(this.parameters);
      }

      this.queryState.setAjaxOptions({async: true});
      var myself = this;
      this.queryState.fetchData(this.parameters, success, function() {
        if(myself.failureCallback) {
          myself.failureCallback();
        }
        myself.isDataPush = false;
      } );
    },

    /* Initial setup: clearing out the htmlObject and building the query object */
    setup: function() {
      var chartDefinition = this.chartDefinition;
      if(chartDefinition == null) {
        Logger.log("Fatal - No chart definition passed", "error");
        return;
      }

      // Make sure we have a tableStyle in place
      if(typeof chartDefinition.tableStyle === "undefined") {
        var rendererType = this.dashboard.getWcdfSettings().rendererType;

        chartDefinition.tableStyle = rendererType === "bootstrap" ? "bootstrap" : "classic";
      }

      chartDefinition["tableId"] = this.htmlObject + "Table";

      // make sure we have no expand parameters set
      var myself = this;
      $(this.expandParameters).each(function f(i, elt) {
        myself.dashboard.setParameter(elt[1], "");
      });

      // Clear previous table
      var previousTable = $("#" + this.htmlObject);
      this.ph = this.clearsBeforePreExecution ? previousTable.empty() : previousTable;

      // remove drawCallback from the parameters, or
      // it'll be called before we have an actual table...
      var croppedCd = $.extend({}, chartDefinition);
      croppedCd.drawCallback = undefined;

      this.queryState = this.dashboard.getQuery(croppedCd);
      if(this.query) {
        this.query.dispose();
      }
      this.query = this.queryState; // for analogy with ccc component's name

      // make sure to clean sort options
      var sortBy = chartDefinition.sortBy || [];
      var sortOptions = [];
      for(var i = 0; i < sortBy.length; i++) {
        var col = sortBy[i][0];
        var dir = sortBy[i][1];

        sortOptions.push(col + (dir === "asc" ? "A" : "D"));
      }

      this.queryState.setSortBy(sortOptions);
    },

    pagingCallback: function(url, params, callback, dataTable, json, firstRun) {
      function p(sKey) {
        for(var i = 0, iLen = params.length; i < iLen ; i++) {
          if(params[i].name == sKey) {
            return params[i].value;
          }
        }

        return null;
      }

      var sortingCols = p("order"), sort = [];
      if(sortingCols && sortingCols.length > 0) {
        for(var i = 0; i < sortingCols.length; i++) {
          var col = sortingCols[i].column;
          var dir = sortingCols[i].dir;
          sort.push(col + (dir === "asc" ? "A" : "D"));
        }
      }

      var query = this.queryState;
      query.setSortBy(sort.join(","));
      query.setPageSize(parseInt(p("length")));
      query.setPageStartingAt(p("start"));
      query.setSearchPattern(p("search") ? p("search").value : "");

      var myself = this;
      var success = function(d) {
        if(myself.postFetch) {
          var mod = myself.postFetch(d, dataTable);
          if(typeof mod !== "undefined") {
            d = mod;
          }
        }

        var response;
        if(d.queryInfo) {
          response = {
            iTotalRecords: d.queryInfo.totalRows,
            iTotalDisplayRecords: d.queryInfo.totalRows
          };
        } else {
          response = {
            iTotalRecords: d.resultset.length,
            iTotalDisplayRecords: d.resultset.length
          };
        }

        response.aaData = d.resultset;
        response.sEcho = p("sEcho");
        myself.rawData = d;

        callback(response);
      };

      if(firstRun) {
        query.setCallback(success);
        success(json);
      } else {
        query.fetchData(success, function() {
          if(myself.failureCallback) {
            myself.failureCallback();
          }
          myself.isDataPush = false;
        } );
      }
    },
    
    /* 
     * Callback for when the table is finished drawing. Called every time there
     * is a redraw event (so not only updates, but also pagination and sorting).
     * We handle addIns and such things in here.
     */
    fnDrawCallback: function(dataTableSettings) {
      var dataTable = dataTableSettings.oInstance;
      var chartDefinition = this.chartDefinition;
          
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
          if(position && typeof position[0] === "number") {
            var rowIdx = position[0];
            var colIdx = position[2];

            var foundAddIn = this.handleAddIns(dataTable, td, $td, rowIdx, colIdx);

            /*
             * Process column format for those columns
             * where we didn't find a matching addIn
             */
            if(!foundAddIn && chartDefinition.colFormats) {
              var format = chartDefinition.colFormats[colIdx];
              var value = this.rawData.resultset[rowIdx][colIdx];
              if(format && value != null) {
                $td.text(sprintf(format, value));
              }
            }
          }
        }
      }

      /* Old urlTemplate code. This needs to be here for backward compatibility */
      if(chartDefinition.urlTemplate != undefined) {
        var td = $("#" + this.htmlObject + " td:nth-child(1)");
        td.addClass('cdfClickable');
        td.bind("click", function(/*event*/) {
          var regex = new RegExp("{" + chartDefinition.parameterName + "}", "g");
          var f = chartDefinition.urlTemplate.replace(regex, $(this).text());

          eval(f);
        });
      }

      /* Handle post-draw callback the user might have provided */
      if(typeof chartDefinition.drawCallback === 'function') {
        chartDefinition.drawCallback.apply(this, arguments);
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
      var chartDefinition = this.chartDefinition;
      var colType = chartDefinition.colTypes[colIdx];
      var state = {};
      var target = $td;
      var results = this.rawData;

      var addIn = this.getAddIn("colType", colType);
      if(!addIn) {
        return false;
      }

      try {
        if(!(target.parents('tbody').length)) {
          return;
        } else if(target.get(0).tagName !== 'TD') {
          target = target.closest('td');
        }

        state.rawData = results;
        state.tableData = dataTable.fnGetData();
        state.colIdx = colIdx;
        state.rowIdx = rowIdx;
        state.series = results.resultset[state.rowIdx][0];
        state.category = results.metadata[state.colIdx].colName;
        state.value = results.resultset[state.rowIdx][state.colIdx];

        if(chartDefinition.colFormats) {
          state.colFormat = chartDefinition.colFormats[state.colIdx];
        }

        state.target = target;
        addIn.call(td, state, this.getAddInOptions("colType", addIn.getName()));

        return true;
      } catch(ex) {
        Logger.exception(ex);

        return false;
      }
    },

    processTableComponentResponse: function(json) {
      var myself = this;
      var chartDefinition = this.chartDefinition;
      var tablePlaceholder = this.ph;

      tablePlaceholder.trigger('cdfTableComponentProcessResponse');

      if (this.dataTable != null) {
        this.__removePreviousDataTable();
      }

      // Set defaults for headers / types
      var hasColumnHeaders = chartDefinition.colHeaders !== undefined && chartDefinition.colHeaders.length > 0;
      if(!hasColumnHeaders) {
        chartDefinition.colHeaders = json.metadata.map(function mapColHeaders(meta) {
          return meta.colName;
        });
      }

      var hasColumnTypes = chartDefinition.colTypes !== undefined && chartDefinition.colTypes.length > 0;
      if(!hasColumnTypes) {
        chartDefinition.colTypes = json.metadata.map(function mapColTypes(meta) {
          return meta.colType.toLowerCase();
        });
      }

      var dataTableOptions = this.__getDataTableOptions(chartDefinition);

      /* Configure the table event handlers */
      dataTableOptions.fnDrawCallback = _.bind(this.fnDrawCallback, this);
      dataTableOptions.fnInitComplete = _.bind(this.fnInitComplete, this);

      /* fnServerData is required for server-side pagination */
      if(dataTableOptions.bServerSide) {
        var firstRun = true;
        dataTableOptions.fnServerData = function(u, p, c) {
          myself.pagingCallback(u, p, c, this, json, firstRun);
          firstRun = false;
        };

        // legacy queries do not support server-side pagination
        if(!json.queryInfo) {
          dataTableOptions.iDisplayLength = json.resultset.length;
          dataTableOptions.bLengthChange = false;

          Logger.warn("Please use CDA queries to enable server-side pagination.");          
        }
      }

      /* We need to make sure we're getting data from the right place,
       * depending on whether we're using CDA
       */
      if(json) {
        dataTableOptions.aaData = json.resultset;
      }

      var tableId = this.htmlObject + "Table";
      var tableClassName = dataTableOptions.tableStyle === "bootstrap"
        ? 'table table-striped table-bordered form-inline table-responsive'
        : 'tableComponent compact';

      tablePlaceholder.html("<table id='" + tableId + "' class='" + tableClassName + "' width='100%'></table>");

      /* 
       * We'll first initialize a blank table so that we have a
       * table handle to work with while the table is redrawing
       */
      this.dataTable = $("#" + tableId).dataTable(dataTableOptions);

      // We'll create an Array to keep track of the open expandable rows.
      this.dataTable.anOpen = [];

      tablePlaceholder.find('table').bind('click', function tableClickEvent(event) {
        if(typeof chartDefinition.clickAction === 'function' || myself.expandOnClick) {
          var state = {};
          var target = $(event.target);
          var results = myself.rawData;

          if(!(target.parents('tbody').length)) {
            return;
          } else if(target.get(0).tagName !== 'TD') {
            target = target.closest('td');
          }

          if(!myself.dataTable.api(true).cell(target.get(0)).index()) {
            Logger.warn("Click on invalid data detected.");
            return;
          }

          state.rawData = myself.rawData;
          state.tableData = myself.dataTable.fnGetData();

          var position = myself.dataTable.fnGetPosition(target.get(0));
          state.colIdx = position[2];
          state.rowIdx = position[0];
          state.series = results.resultset[state.rowIdx][0];
          
          state.category = results.metadata[state.colIdx].colName;
          state.value =  results.resultset[state.rowIdx][state.colIdx];
          state.colFormat = chartDefinition.colFormats[state.colIdx];

          state.target = target;

          if(myself.expandOnClick) {
            myself.handleExpandOnClick(state);
          }

          if(chartDefinition.clickAction) {
            chartDefinition.clickAction.call(myself, state);
          }
        }
      });

      tablePlaceholder.trigger('cdfTableComponentFinishRendering');
    },

    __getDataTableOptions: function(chartDefinition) {
      var dataTableOptions = TableComponent.getDataTableOptions(chartDefinition);

      // Build a default config from the standard options
      var extraOptions = {};
      $.each(this.extraOptions != null ? this.extraOptions : {}, function(index, option) {
        extraOptions[option[0]] = option[1];
      });

      return $.extend(chartDefinition.dataTableOptions, dataTableOptions, extraOptions);
    },

    __removePreviousDataTable: function() {
      if (this.dataTable == null) {
        return;
      }

      // Unbind table click event, that handles rows expansion.
      this.ph.find('table').unbind('click');

      // Removes enhancements to DataTables html objects and remove them from the DOM tree.
      var dataTableApi = this.dataTable.DataTable();
      dataTableApi.clear().destroy(true);

      this.dataTable = null;
    },

    handleExpandOnClick: function(event) {
      var activeClass = "expandingClass";

      if(typeof activeClass === 'undefined') {
        activeClass = "activeRow";
      }

      var obj = event.target.closest("tr");
      var a = event.target.closest("a");

      if(a.hasClass('info')) {
        return;
      } else {
        var myself = this;
        var row = obj.get(0);
        var anOpen = this.dataTable.anOpen;
        var i = $.inArray(row, anOpen);
        
        if(obj.hasClass(activeClass)) {
          this.detachFromRow(row, i, activeClass);

          $(this.expandParameters).each(function(i, elt) {
            myself.dashboard.setParameter(elt[1], "");
          });
        } else {
          // Closes all open expandable rows .
          for(var j = 0; j < anOpen.length; j++) {
            this.detachFromRow(anOpen[j], j, activeClass);
          }
          obj.addClass(activeClass);

          this.attachToRow(row, activeClass);

          //Read parameters and fire changes
          var results = this.queryState.lastResults();
          var firstChange = null;

          $(this.expandParameters).each(function(i, elt) {
            //skips the first expandParameter that was updated and calls myself.dashboard.setParameter for the all others
            if(!firstChange && myself.dashboard.getParameterValue(elt[1]) !== results.resultset[event.rowIdx][parseInt(elt[0], 10)]) {
              firstChange = elt;
            } else {
              myself.dashboard.setParameter(elt[1], results.resultset[event.rowIdx][parseInt(elt[0], 10)]);
            }
          });

          if(firstChange !== null) {
            this.dashboard.fireChange(firstChange[1], results.resultset[event.rowIdx][parseInt(firstChange[0], 10)]);
          }
        }
      }

      $("td.expandingClass").click(function(event) {
        //Does nothing but it prevents problems on expandingClass clicks!
        event.stopPropagation();
      });
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
      var dataTableOptions = {};

      if(options.tableStyle === "themeroller") {
        dataTableOptions.bJQueryUI = true;
      }

      dataTableOptions.bInfo = options.info;
      dataTableOptions.iDisplayLength = options.displayLength;
      dataTableOptions.bLengthChange = options.lengthChange;
      dataTableOptions.bPaginate = options.paginate;
      dataTableOptions.bSort = options.sort;
      dataTableOptions.bFilter = options.filter;
      dataTableOptions.sPaginationType = options.paginationType;
      dataTableOptions.sDom = options.sDom;
      dataTableOptions.aaSorting = options.sortBy;
      dataTableOptions.tableStyle = options.tableStyle;

      if(typeof options.oLanguage === "string") {
        dataTableOptions.oLanguage = eval("(" + options.oLanguage + ")");//TODO: er...
      } else {
        dataTableOptions.oLanguage = options.oLanguage;
      }

      if(typeof options.language === "string") {
        dataTableOptions.language = eval("(" + options.language + ")");//TODO: er...
      } else {
        dataTableOptions.language = options.language;
      }

      if(options.colHeaders != undefined) {
        dataTableOptions.aoColumns = new Array(options.colHeaders.length);
        for(var i = 0; i < options.colHeaders.length; i++) {
          dataTableOptions.aoColumns[i] = {};
          dataTableOptions.aoColumns[i].sClass = "column" + i;
        }
        $.each(options.colHeaders,function(i,val) {
          dataTableOptions.aoColumns[i].sTitle = Utils.escapeHtml(val);
          if(val === "") { dataTableOptions.aoColumns[i].bVisible = false; }
        });  // colHeaders

        if((dataTableOptions.aoColumns.length !== 0) && (options.colTypes != undefined)) {
          $.each(options.colTypes,function(i, val) {
            if(i >= dataTableOptions.aoColumns.length){return false;}
            var col = dataTableOptions.aoColumns[i];
            // Specific case: hidden cols
            if(val === "hidden") { col.bVisible = false; }
            col.sClass += " " + val;
            col.sType = val;
          });
        }  // colTypes

        if(options.colFormats != undefined) {
          // Changes are made directly to the json
        } // colFormats

        var bAutoWidth = true;
        if((dataTableOptions.aoColumns.length !== 0) && (options.colWidths != undefined)) {
          $.each(options.colWidths,function(i, val) {
            if(i >= dataTableOptions.aoColumns.length){return false;}
            if(val != null) {
              dataTableOptions.aoColumns[i].sWidth = val;
              bAutoWidth = false;
            }
          })
        } // colWidths
        dataTableOptions.bAutoWidth = bAutoWidth;

        if((dataTableOptions.aoColumns.length != 0) && (options.colSortable != undefined)) {
          $.each(options.colSortable, function(i, val) {
            if(i >= dataTableOptions.aoColumns.length){return false;}
            if(val != null && (!val || val == "false")) {
              dataTableOptions.aoColumns[i].bSortable = false
            }
          })
        } // colSortable

        if((dataTableOptions.aoColumns.length != 0) && (options.colSearchable != undefined)) {
          $.each(options.colSearchable, function(i, val) {
            if(i >= dataTableOptions.aoColumns.length){return false;}
            if(val != null && (!val || val == "false")) {
              dataTableOptions.aoColumns[i].bSearchable = false
            }
          })
        } // colSearchable
      }

      return dataTableOptions;
    }
  });

  return TableComponent;
});
