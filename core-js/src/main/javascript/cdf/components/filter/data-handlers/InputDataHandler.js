/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../baseevents/baseeventsModel',
  '../../../Logger',
  '../HtmlUtils'
], function($, _, BaseModel, Logger, HtmlUtils) {

  var sanitizeInput = function(input) {
    return _.isString(input) ?
      HtmlUtils.sanitizeHtml(input) :
      input;
  };
  var getPageData = function(queryInfo, pageSize) {
    var pageData = {};
    if ((queryInfo != null ? queryInfo.pageStart : void 0) != null) {
      pageData = {
        page: Math.floor(parseInt(queryInfo.pageStart) / pageSize)
      };
    }
    return pageData;
  };
  var itemGenerator = function(idx, pageData) {
    if (!_.isObject(pageData)) {
      pageData = {};
    }
    var createItems = function(rows) {
      return _.map(rows, function(row) {
        var itemData = {
          id: row[idx.id],
          label: sanitizeInput(row[idx.label])
        };
        if (_.isFinite(idx.value) && idx.value >= 0) {
          itemData.value = sanitizeInput(row[idx.value]);
        }
        itemData = $.extend(true, itemData, pageData);
        return itemData;
      });
    };
    return createItems;
  };
  var groupGenerator = function(idx, pageData) {
    var createGroup = function(rows, group) {
      var groupData = {
        id: group != null ? rows[0][idx.parentId] : void 0,
        label: rows[0][idx.parentLabel],
        nodes: itemGenerator(idx, pageData)(rows)
      };
      return groupData;
    };
    return createGroup;
  };

  /**
   * @class cdf.components.filter.data-handlers.InputDataHandler
   * @amd cdf/components/filter/data-handlers/InputDataHandler
   * @extends cdf.components.filter.baseevents.baseeventsModel
   * @classdesc Import data from multiple sources, populate the model.
   * @ignore
   */
  return BaseModel.extend(Logger).extend(/** @lends cdf.components.filter.data-handlers.InputDataHandler# */{
    /**
     * Class identifier.
     *
     * @const
     * @type {string}
     */
    ID: 'BaseFilter.DataHandlers.Input',
    getModel: function() {
      return this.get('model');
    },

    /**
     * Import data into the MVC model, eventually inferring the data format.
     *
     * @param {CDAJson|Array} whatever
     * @return {this}
     */
    updateModel: function(whatever) {
      if (_.isArray(whatever)) {
        this._updateModelFromBidimensionalArray(whatever);
      } else if (this.isCdaJson(whatever)) {
        this._updateModelFromCdaJson(whatever);
      } else {
        this._updateModelFromJson(whatever);
      }
      var model = this.get('model');
      model.set('isBusy', false);
      model.set('isDisabled', this.get('model').children() === null);
      var options = this.get('options');
      if (options.root && options.root.id) {
        model.set('id', options.root.id);
      }
      if (options.hooks && options.hooks.postUpdate) {
        _.each(options.hooks.postUpdate, function(hook) {
          return hook.call(null, null, model, options);
        });
      }
      this.trigger('postUpdate', model);
      return this;
    },
    _updateModelFromCdaJson: function(json) {
      var options = $.extend(true, {}, this.get('options'));
      var pageData = getPageData(json.queryInfo, options.query.getOption('pageSize'));
      this._addDataToModel(json.resultset, pageData);
      var numberOfItems;
      if (json.queryInfo && json.queryInfo.pageStart) {
        numberOfItems = parseInt(json.queryInfo.totalRows);
      }
      var searchPattern = options.query.getOption('searchPattern');
      if (_.isEmpty(searchPattern)) {
        this.get('model').set('numberOfItemsAtServer', numberOfItems);
      }
      return this;
    },
    _updateModelFromJson: function(anyJsonObject) {
      return this;
    },
    _updateModelFromBidimensionalArray: function(rows) {
      this._addDataToModel(rows, undefined);
      return this;
    },
    _addDataToModel: function(rows, pageData) {
      if (rows.length === 0) {
        return this;
      }
      var options = $.extend(true, {}, this.get('options'));
      var parentIndexes = _.chain(options.indexes)
        .pick('parentId', 'parentLabel')
        .filter(_.isFinite)
        .max()
        .value();
      var hasGroups = _.isFinite(parentIndexes) && parentIndexes < rows[0].length;
      var data;
      if (hasGroups) {
        data = _.chain(rows)
          .groupBy(function(row) {
            return row[options.indexes.parentId];
          })
          .map(groupGenerator(options.indexes, pageData))
          .value();
      } else {
        data = itemGenerator(options.indexes, pageData)(rows);
      }
      this.get('model').add(data);
      return this;
    },
    isCdaJson: function(obj) {
      return _.isObject(obj) && _.isArray(obj.resultset) && _.isArray(obj.metadata);
    },

    /**
     * Matches the items against a list and marks the matches as selected.
     *
     * @param {Array} selectedItems Array containing the ids of the selected items.
     * @return {this}
     */
    setValue: function(selectedItems) {
      this.get('model').setSelectedItems(selectedItems);
      this.trigger('setValue', selectedItems);
      return this;
    }
  });

});
