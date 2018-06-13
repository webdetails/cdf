/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  './CdaQuery.ext',
  './BaseQuery',
  '../dashboard/Dashboard.query',
  'amd!../lib/underscore',
  '../dashboard/Utils',
  '../Logger',
  '../lib/jquery'
], function(CdaQueryExt, BaseQuery, Dashboard, _, Utils, Logger, $) {
  "use strict";

  var CDA_CLASS_NAME = "cda";

  /**
   * @class cdf.queries.CdaQuery
   * @summary Class that represents a CDA query.
   * @classdesc <p>Class that represents a CDA query. This class will be registered
   *            globally using the static dashboard function
   *            {@link cdf.dashboard.Dashboard.registerGlobalQuery|registerGlobalQuery}.</p>
   *            <p>The constructor of this class is created dynamically and registered
   *            in the dashboard query container
   *            {@link cdf.dashboard.Dashboard#queryFactories|queryFactories}.</p>
   *            <p>To create a new CDA query use the dashboard function
   *            {@link cdf.dashboard.Dashboard#getQuery|getQuery}.</p>
   *
   * @staticClass
   * @extends cdf.queries.BaseQuery
   *
   * @example
   * dashboard.addDataSource("myCdaQuery", {
   *   queryType: "cda", dataAccessId: "cdaQuery", path: "/public/myQ.cda"
   * });
   * dashboard.getQuery({dataSource: "myCdaQuery"}).doQuery(successCallback, errorCallback);
   */
  var cdaQueryOpts = /** @lends cdf.queries.CdaQuery# */{
    /**
     * @summary The class name.
     * @description The class name.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "cda"
     */
    _name: CDA_CLASS_NAME,
    get name() {
      return this._name;
    },

    /**
     * @summary The class label.
     * @description The class label.
     *
     * @type {string}
     * @const
     * @readonly
     * @protected
     * @default "CDA Query"
     */
    _label: "CDA Query",
    get label() {
      return this._label;
    },

    /**
     * @summary The default properties.
     * @description The default properties.
     *
     * @type {Object}
     * @property {string} url The target endpoint URL.
     * @property {string} file="" The target file name.
     * @property {string} id="" The target identifier.
     * @property {string} outputIdx="1" The default output index.
     * @property {string} sortBy="" The default sorting order.
     * @property {Object} ajaxOptions={async:true,xhrFields:{withCredentials:true}} The {@link http://api.jquery.com/jquery.ajax/|jQuery.ajax} options for the query.
     * @property {string} searchPattern="" The default search pattern.
     * @protected
     */
    defaults: {
      url: CdaQueryExt.getDoQuery(),
      file: "",
      id: "",
      outputIdx: "1",
      sortBy: "",
      ajaxOptions: {
        async: true,
        xhrFields: {
          withCredentials: true
        }
      },
      searchPattern: ""
    },

    /**
     * @summary Initializes a CDA query.
     * @description Initializes a CDA query.
     *
     * @param {object} opts                 The query definition object.
     * @param {string} opts.path            The path to the CDA file.
     * @param {string} opts.dataAccessId    The Data access identifier.
     * @param {string} [opts.sortBy]        The sorting order.
     * @param {number} [opts.pageSize]      The page size.
     * @param {number} [opts.outputIndexId] The output index identifier.
     *
     * @throws {InvalidQuery} If the `opts` parameter does not contain a path
     *                        nor a data access identifier.
     */
    init: function(opts) {
      if(typeof opts.path !== 'undefined' && typeof opts.dataAccessId !== 'undefined') {
        // CDA-style cd object
        this.setOption('file', opts.path);
        this.setOption('id', opts.dataAccessId);

        if(Utils.isString(opts.sortBy) && opts.sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          this.setSortBy(opts.sortBy);
        }

        if(opts.pageSize != null) {
          this.setPageSize(opts.pageSize);
        }

        if(opts.outputIndexId != null) {
          this.setOption('outputIdx', opts.outputIndexId);
        }
      } else {
        throw 'InvalidQuery';
      }
    },

    /**
     * @summary Builds the query definition object.
     * @description Builds the query definition object.
     *
     * @param {object} overrides New query definitions to override any existing query definitions.
     * @return {object} Query definition object.
     */
    buildQueryDefinition: function(overrides) {
      var queryDefinition = {};

      overrides = Array.isArray(overrides) ? Utils.propertiesArrayToObject(overrides) : (overrides || {});
      var cachedParams = this.getOption('params');
      var params = $.extend({}, cachedParams, overrides);

      _.each(params, function(value, name) {
        var paramValue = this.__getDashboardParameterValue(name, value);

        if(Array.isArray(paramValue) && paramValue.length === 1 && String(paramValue[0]).indexOf(';') >= 0) {
          // special case where single element will wrongly be treated as a parsable array by cda
          paramValue = Utils.doCsvQuoting(paramValue[0], ';');
        }

        // else will not be correctly handled for functions that return arrays
        if(Utils.isFunction(paramValue)) {
          paramValue = paramValue();
        }

        queryDefinition['param' + name] = paramValue;
      }, this);

      queryDefinition.path = this.getOption('file');
      queryDefinition.dataAccessId = this.getOption('id');
      queryDefinition.outputIndexId = this.getOption('outputIdx');
      queryDefinition.pageSize = this.getOption('pageSize');
      queryDefinition.pageStart = this.getOption('page');
      queryDefinition.sortBy = this.getOption('sortBy');
      queryDefinition.paramsearchBox = this.getOption('searchPattern');

      return queryDefinition;
    },

    /**
     * @summary Exports the data, according to a specific output type.
     * @description Exports the data, according to a specific output type.
     *
     * @param {string} outputType Output type (CSV, XLS, XML, HTML).
     * @param {object} overrides Overrides for the query definition object.
     * @param {object} options Export options.
     * @param {string} options.separator Separator.
     * @param {string} options.filename File name.
     * @param {string} options.template Template name.
     * @param {object} options.columnHeaders The column headers.
     * @param {object} options.dtFilter Data table filter.
     * @param {object} options.dtSearchableColumns Data table searchable columns.
     * @param {boolean} options.exportPage Export only one page (true) or full data set (false).
     */
    exportData: function(outputType, overrides, options) {
      options = options != null ? options : {};

      var queryDefinition = this.buildQueryDefinition(overrides);
      queryDefinition.outputType = outputType;

      if(outputType === 'csv' && options.separator) {
        queryDefinition.settingcsvSeparator = options.separator;
      }

      if(options.filename) {
        queryDefinition.settingattachmentName = options.filename;
      }

      if(outputType === 'xls' && options.template) {
        queryDefinition.settingtemplateName = options.template;
      }

      if(options.columnHeaders) {
        queryDefinition.settingcolumnHeaders = options.columnHeaders;
      }

      // only relevant for a component with server side pagination
      if(options.exportPage === false) { // only export the entire data set when exportPage is false
        queryDefinition.pageSize = 0;
        queryDefinition.pageStart = 0;
      }

      if(options.dtFilter != null) {
        queryDefinition.settingdtFilter = options.dtFilter;
        if(options.dtSearchableColumns != null) {
          queryDefinition.settingdtSearchableColumns = options.dtSearchableColumns;
        }
      }
      queryDefinition.wrapItUp = 'true';

      $.ajax({
        type: 'POST',
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
        _exportIframe[0].src = CdaQueryExt.getUnwrapQuery({"path": queryDefinition.path, "uuid": uuid});
        _exportIframe.appendTo($('body'));
      }).fail(function(jqXHR, textStatus, errorThrown) {
        Logger.log("Request failed: " + jqXHR.responseText + " :: " + textStatus + " ::: " + errorThrown);
      });
    },

    /**
     * @summary Sets the sort by columns.
     * @description <p>Sets the sort by columns.</p>
     *              <p>CDA expects an array of terms consisting of a number and a letter
     *              that's either "A" or "D". Each term denotes, in order, a column
     *              number and a sort direction: "0A" would then be sorting the first column
     *              ascending, and "1D" would sort the second column in descending order.
     *              This function accepts either an array with the search terms, or
     *              a comma-separated string with the terms:  "0A,1D" would then mean
     *              the same as the array ["0A","1D"], which would sort the results
     *              first by the first column (ascending), and then by the second
     *              column (descending).</p>
     *
     * @param {string|Array<string>} sortBy Sorting columns order.
     * @return {boolean} `true` if the sort by condition has changed,
     *                   `false` if it remained the same.
     * @throws {InvalidSortExpression} If the sort by columns are not correctly defined.
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
      else if(Utils.isString(sortBy)) {
        /* Valid sortBy Strings are column numbers, optionally
         * succeeded by A or D (ascending or descending), and separated by commas.
         */
        if(!sortBy.match("^(?:[0-9]+[adAD]?,?)*$")) {
          throw "InvalidSortExpression";
        }

        /* Break the string into its constituent terms, filter out empty terms, if any. */
        newSort = sortBy.toUpperCase().split(',').filter(function(e) {
          return e !== "";
        });

      } else if(Array.isArray(sortBy)) {
        newSort = sortBy.map(function(d) {
          return d.toUpperCase();
        });
        /* We also need to validate that each individual term is valid. */
        var invalidEntries = newSort.filter(function(e) {
          return !e.match("^[0-9]+[adAD]?,?$");
        });

        if(invalidEntries.length > 0) {
          throw "InvalidSortExpression";
        }
      }

      /* We check whether the parameter is the same as before,
       * and notify the caller on whether it changed.
       */
      var same;
      if(Array.isArray(newSort)) {
        same = newSort.length != myself.getOption('sortBy').length;
        $.each(newSort,function(i, d) {
          same = (same && d == myself.getOption('sortBy')[i]);
          if(!same) {
            return false;
          }
        });
      } else {
        same = (newSort === this.getOption('sortBy'));
      }
      this.setOption('sortBy', newSort);
      return !same;
    },

    /**
     * @summary Sorts the result set.
     * @description Sorts the result set. See the notes on sort columns on the
     *              {@link cdf.queries.CdaQuery#setSortBy|setSortBy} method.
     *
     * @param {string}   sortBy          Sorting columns order.
     * @param {function} outsideCallback Callback to call after the sorting has been processed.
     * @return {boolean|Object} `false` if the sort by conditions have not changed,
     *                          the result of calling `doQuery` otherwise.
     */
    sortBy: function(sortBy, outsideCallback) {
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

  // Registering an object will use it to create a class by extending BaseQuery,
  // and use that class to generate new queries.
  Dashboard.registerGlobalQuery(CDA_CLASS_NAME, cdaQueryOpts);
});
