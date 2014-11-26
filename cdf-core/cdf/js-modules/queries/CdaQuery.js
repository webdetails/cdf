/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(['./CdaQuery.ext', './BaseQuery', '../dashboard/Dashboard.query', '../lib/underscore', '../dashboard/Utils', '../Logger'],
  function(CdaQueryExt, BaseQuery, Dashboard, _, Utils, Logger) {

  var cdaQueryOpts = {
    name: 'cda',
    label: 'CDA Query',
    defaults: {
      url: CdaQueryExt.getDoQuery(),
      file: '',
      id: '',
      outputIdx: '1',
      sortBy: '',
      ajaxOptions: {
        async: true,
        xhrFields: {
          withCredentials: true
        }
      },
      searchPattern: ''
    },

    init: function(opts) {
      if (typeof opts.path != 'undefined' && typeof opts.dataAccessId != 'undefined') {
        // CDA-style cd object
        this.setOption('file' , opts.path );
        this.setOption( 'id' , opts.dataAccessId );
        if(typeof opts.sortBy == 'string' && opts.sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          this.setOption('sortBy', opts.sortBy);
        }
        if(opts.pageSize != null) {
          this.setOption('pageSize' , opts.pageSize);
        }
        if(opts.outputIndexId != null) {
          this.setOption( 'outputIdx' , opts.outputIndexId );
        }
        } else {
          throw 'InvalidQuery';
        }
    },

    buildQueryDefinition: function(overrides) {
      overrides = (overrides instanceof Array)
        ? Utils.propertiesArrayToObject(overrides)
        : (overrides || {});
      var queryDefinition = {};

      var cachedParams = this.getOption('params');
      var params = $.extend( {}, cachedParams , overrides);

      var dash = this.getOption('dashboard');
      _.each( params , function(value, name) {
        value = dash.getParameterValue(value);
        if($.isArray(value) && value.length == 1 && ('' + value[0]).indexOf(';') >= 0) {
          //special case where single element will wrongly be treated as a parseable array by cda
          value = doCsvQuoting(value[0],';');
        }
        //else will not be correctly handled for functions that return arrays
        if(typeof value == 'function') {
          value = value();
        }
        queryDefinition['param' + name] = value;
      });
      queryDefinition.path = this.getOption('file');
      queryDefinition.dataAccessId = this.getOption('id');
      queryDefinition.outputIndexId = this.getOption('outputIdx');
      queryDefinition.pageSize = this.getOption('pageSize');
      queryDefinition.pageStart = this.getOption('page');
      queryDefinition.sortBy = this.getOption('sortBy');
      queryDefinition.paramsearchBox = this.getOption('searchPattern');
      return queryDefinition;
    },

    /*
     * Public interface
     */

    exportData: function(outputType, overrides, options) {
      if(!options) {
        options = {};
      }
      var queryDefinition = this.buildQueryDefinition(overrides);
      queryDefinition.outputType = outputType;
      if(outputType == 'csv' && options.separator) {
        queryDefinition.settingcsvSeparator = options.separator;
      }
      if(options.filename) {
        queryDefinition.settingattachmentName= options.filename ;
      }
      if(outputType == 'xls' && options.template) {
        queryDefinition.settingtemplateName= options.template ;
      }
      if( options.columnHeaders) {
        queryDefinition.settingcolumnHeaders = options.columnHeaders;
      }

      if(options.dtFilter != null) {
        queryDefinition.settingdtFilter = options.dtFilter;
        if(options.dtSearchableColumns != null){
          queryDefinition.settingdtSearchableColumns = options.dtSearchableColumns;
        }
      }
      queryDefinition.wrapItUp = 'true';

      $.ajax({
          type:'POST',
          dataType: 'text',
          async: true,
          data: queryDefinition,
          url: this.getOption('url'),
          xhrFields: {
            withCredentials: true
          }
      }).done(function(uuid) {
          var _exportIframe = $('<iframe style="display:none">');
          _exportIframe.detach();
          _exportIframe[0].src = CdaQueryExt.getUnwrapQuery( {"path": queryDefinition.path, "uuid": uuid} );
          _exportIframe.appendTo($('body')); })
        .fail(function(jqXHR,textStatus,errorThrown) {
          Logger.log("Request failed: " + jqXHR.responseText + " :: " + textStatus + " ::: " + errorThrown); });
    },

    /* Sorting
     *
     * CDA expects an array of terms consisting of a number and a letter
     * that's either 'A' or 'D'. Each term denotes, in order, a column
     * number and sort direction: 0A would then be sorting the first column
     * ascending, and 1D would sort the second column in descending order.
     * This function accepts either an array with the search terms, or
     * a comma-separated string with the terms:  "0A,1D" would then mean
     * the same as the array ["0A","1D"], which would sort the results
     * first by the first column (ascending), and then by the second
     * column (descending).
     */
    setSortBy: function(sortBy) {
      var newSort;
      var myself = this;
      if(sortBy === null || sortBy === undefined || sortBy === '') {
        newSort = '';
      }
      /* If we have a string as input, we need to split it into
       * an array of sort terms. Also, independently of the parameter
       * type, we need to convert everything to upper case, since want
       * to accept 'a' and 'd' even though CDA demands capitals.
       */
      else if(typeof sortBy == "string") {
        /* Valid sortBy Strings are column numbers, optionally
         * succeeded by A or D (ascending or descending), and separated by commas
         */
        if(!sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          throw "InvalidSortExpression";
        }
        /* Break the string into its constituent terms, filter out empty terms, if any */
        newSort = sortBy.toUpperCase().split(',').filter(function(e) {
          return e !== "";
        });
      } else if(sortBy instanceof Array) {
        newSort = sortBy.map(function(d){
          return d.toUpperCase();
        });
        /* We also need to validate that each individual term is valid */
        var invalidEntries = newSort.filter(function(e) {
          return !e.match("^[0-9]+[adAD]?,?$")
        });
        if(invalidEntries.length > 0) {
          throw "InvalidSortExpression";
        }
      }

      /* We check whether the parameter is the same as before,
       * and notify the caller on whether it changed
       */
      var same;
      if(newSort instanceof Array) {
        same = newSort.length != myself.getOption('sortBy').length;
        $.each(newSort,function(i,d) {
          same = (same && d == myself.getOption('sortBy')[i]);
          if(!same) {
            return false;
          }
        });
      } else {
        same = (newSort === this.getOption('sortBy'));
      }
      this.setOption('sortBy' , newSort);
      return !same;
    },

    sortBy: function(sortBy,outsideCallback) {
      /* If the parameter is not the same, and we have a valid state,
       * we can fire the query.
       */
      var changed = this.setSortBy(sortBy);
      if(!changed) {
        return false;
      } else if(this.getOption('successCallback') !== null) {
        return this.doQuery(outsideCallback);
      }
    }
  };
  // Registering an object will use it to create a class by extending Dashboards.BaseQuery,
  // and use that class to generate new queries.
  Dashboard.registerGlobalQuery( "cda", cdaQueryOpts );

});
