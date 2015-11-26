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

/**
 * @module BaseFilter
 * @submodule DataHandlers
 */

define([
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../baseevents/baseeventsModel',
  '../../../Logger'
], function($, _, BaseModel, Logger) {

  var getPageData = function(queryInfo, pageSize) {
    var pageData;
    pageData = {};
    if ((queryInfo != null ? queryInfo.pageStart : void 0) != null) {
      pageData = {
        page: Math.floor(parseInt(queryInfo.pageStart) / pageSize)
      };
    }
    return pageData;
  };
  var itemGenerator = function(idx, pageData) {
    var createItems;
    if (!_.isObject(pageData)) {
      pageData = {};
    }
    createItems = function(rows) {
      return _.map(rows, function(row) {
        var itemData;
        itemData = {
          id: row[idx.id],
          label: row[idx.label]
        };
        if (_.isFinite(idx.value) && idx.value >= 0) {
          itemData.value = row[idx.value];
        }
        itemData = $.extend(true, itemData, pageData);
        return itemData;
      });
    };
    return createItems;
  };
  var groupGenerator = function(idx, pageData) {
    var createGroup;
    createGroup = function(rows, group) {
      var groupData;
      groupData = {
        id: group != null ? rows[0][idx.parentId] : void 0,
        label: rows[0][idx.parentLabel],
        nodes: itemGenerator(idx, pageData)(rows)
      };
      return groupData;
    };
    return createGroup;
  };

  /**
   * Import data from multiple sources, populate the model
   * @class Input
   * @uses BaseFilter.Logger
   * @extends BaseModel
   * @constructor
   * @param {Object} options
   */
  return BaseModel.extend( Logger ).extend({
    ID: 'BaseFilter.DataHandlers.Input',
    getModel: function() {
      return this.get('model');
    },

    /**
     * Import data into the MVC model, eventually inferring the data format
     * @method updateModel
     * @param {CDAJson | Array} whatever
     * @chainable
     * @public
     */
    updateModel: function(whatever) {
      if (_.isArray(whatever)) {
        this._updateModelFromBidimensionalArray(whatever);
      } else if (this.isCdaJson(whatever)) {
        this._updateModelFromCdaJson(whatever);
      } else {
        this._updateModelJson(whatever);
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
      var data;
      if (_.chain(options.indexes).map(_.identity).max().value() < json.metadata.length) {
        data = _.chain(json.resultset).groupBy(function(row) {
          return row[options.indexes.parentId];
        }).map(groupGenerator(options.indexes, pageData)).value();
      } else {
        data = itemGenerator(options.indexes, pageData)(json.resultset);
      }
      this.get('model').add(data);
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
      var data, idx;
      /* if (rows.length > 0) {
        return this;
      } */
      idx = {
        id: 0,
        label: 1,
        value: void 0
      };
      data = itemGenerator(idx)(rows);
      this.get('model').add(data);
      return this;
    },
    isCdaJson: function(obj) {
      var result;
      result = false;
      if (_.isObject(obj)) {
        if (_.isArray(obj.resultset)) {
          if (_.isArray(obj.metadata)) {
            result = true;
          }
        }
      }
      return result;
    },

    /**
     * Matches the items against a list and marks the matches as selected
     * @method setValue
     * @param {Array} selectedItems Arrays containing the ids of the selected items
     * @chainable
     * @public
     */
    setValue: function(selectedItems) {
      this.get('model').setSelectedItems(selectedItems);
      this.trigger('setValue', selectedItems);
      return this;
    },
    injectFakeData: function(label, level) {
      var generateData;
      generateData = function(label, level) {
        return [
          {
            label: label,
            id: level + ".all",
            value: Math.pow(10, level - 1) + _.random(Math.pow(10, level)),
            nodes: _.map(_.range(Math.pow(10, level)), function(v) {
              var node;
              node = {
                label: "Item " + level + "." + v,
                value: _.random(100),
                id: level + "." + v
              };
              return node;
            })
          }
        ];
      };
      return this.get('model').add(generateData(label, level));
    }
  });

});
