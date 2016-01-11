(function(_, BaseModel, LoggerMixin, DataHandlers) {
  'use strict';

  /**
   * @module TreeFilter
   * @submodule DataHandlers
   */

  var sanitizeInput = function(input) {
    return _.isString(input) ?
      input.replace("<script>", "&lt;script&gt;")
        .replace("</script>", "&lt;/script&gt;") :
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
   * Import data from multiple sources, populate the model
   * @class Input
   * @uses TreeFilter.Logger
   * @extends BaseModel
   * @constructor
   * @param {Object} options
   */
  DataHandlers.Input = BaseModel.extend(LoggerMixin).extend({
    ID: 'TreeFilter.DataHandlers.Input',
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
    }
  });
})(_, BaseModel, TreeFilter.Logger, TreeFilter.DataHandlers);
