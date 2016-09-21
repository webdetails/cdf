/**
 * Represents the state of the filter as tree structure.
 #
 * @module BaseFilter
 * @submodule Models
 * @class SelectionTree
 * @constructor
 * @extends Tree
 */

define([
  'amd!cdf/lib/underscore',
  './Tree'
], function(_, Tree) {

  /**
   * The selection state representation.
   *
   * @typedef {?boolean} SelectionStates
   * @property {null}  SOME - Some items selected.
   * @property {false} NONE - No items selected.
   * @property {true}  ALL  - All items selected.
   */
  var SelectionStates = {
    SOME: null,
    NONE: false,
    ALL: true
  };

  var BaseSelectionTree = Tree.extend({

    /**
     * Default values for each node in the selection tree.
     *
     * @type     {Object}
     * @property {string}  id                    - The default id.
     * @property {string}  label                 - The default label.
     * @property {boolean} isSelected            - The default selection state.
     * @property {boolean} isVisible             - The default visibility state.
     * @property {boolean} isCollapsed           - The default collapsed state.
     * @property {number}  numberOfSelectedItems - The default number of selected items.
     * @property {number}  numberOfItems         - The default number of items.
     * @property {number}  page                  - The default page.
     */
    defaults: {
      id: void 0,
      label: '',
      isSelected: false,
      isVisible: true,
      numberOfSelectedItems: 0,
      numberOfItems: 0
    },
    constructor: function(attributes, options) {
      if ((attributes != null ? attributes.label : void 0) != null) {
        if ((attributes.id == null) || ((options != null ? options.useValueAsId : void 0) === true)) {
          attributes.id = attributes.label;
        }
      }
      this.base(attributes, options);

      return this;
    },
    initialize: function() {
      this.base.apply(this, arguments);
      if (this.parent()) {
        this._inheritSelectionFromParent();
      }
      var filterText = this.root().get('searchPattern');
      this._filterBy(filterText);

      return this.on('add remove', this.update);
    },
    _inheritSelectionFromParent: function() {
      var parentSelectionState = this.parent().getSelection();
      if (parentSelectionState === SelectionStates.ALL) {
        this.setSelection(SelectionStates.ALL);
      } else if (parentSelectionState === SelectionStates.NONE) {
        this.setSelection(SelectionStates.NONE);
      }
    },

    /**
     * Sets the selection state of the model.
     *
     * @method setSelection
     * @public
     * @param {SelectionStates} newState The new selection state to be set.
     */
    setSelection: function(newState) {
      if (this.getSelection() === newState) {
        return this;
      }
      this.set('isSelected', newState);
      if (newState !== SelectionStates.SOME) {
        if (this.children()) {
          this.children().each(function(child) {
            return child.setSelection(newState);
          });
        }
      }
      if (this.parent()) {
        this.parent().updateSelection();
      }
      return this;
    },

    /**
     * Gets the selection state of the model.
     *
     * @method getSelection
     * @public
     * @return {Boolean}
     */
    getSelection: function() {
      return this.get('isSelected');
    },
    setAndUpdateSelection: function(newState) {
      this.setSelection(newState);
      this.update();
      return this.trigger('selection', this);
    },
    setVisibility: function(newState) {
      var isVisible = this.get('isVisible');
      if (isVisible !== newState) {
        return this.set('isVisible', newState);
      }
    },
    getVisibility: function() {
      return this.get('isVisible');
    },
    getSelectedItems: function(field) {
      var getMyself = (function(_this) {
        return function() {
          return _this.get(field || 'id');
        };
      })(this);
      var isSelected = this.getSelection();
      switch (isSelected) {
        case SelectionStates.SOME:
        case void 0:
          if (this.children()) {
            return _.flatten(this.children().map(function(child) {
              return child.getSelectedItems(field) || [];
            }));
          } else {
            return getMyself();
          }
          break;
        case SelectionStates.ALL:
          return getMyself();
        case SelectionStates.NONE:
          return [];
        default:
          return [];
      }
    },

    /**
     * Mark listed items as selected.
     *
     * @method setSelectedItems
     * @param {Array} idList A list of ids.
     */
    // NOTE: currently acts directly on the model and bypasses any business logic
    // TODO: change implementation to be recursive rather than acting on a flat tree
    setSelectedItems: function(idList) {
      var flatTree = this.flatten();
      flatTree.filter(function(m) {
        return m.children() == null;
      }).each(function(m) {
        var id = m.get('id');
        if (_.contains(idList, id)) {
          return m.setSelection(SelectionStates.ALL);
        } else {
          return m.setSelection(SelectionStates.NONE);
        }
      });
      flatTree.filter(function(m) {
        return m.children() != null;
      }).each(function(m) {
        var id = m.get('id');
        if (_.contains(idList, id)) {
          return m.setSelection(SelectionStates.ALL);
        }
      });
      this.update();
      return this.root().updateSelectedItems({
        silent: true
      });
    },
    updateSelectedItems: function(options) {
      var root = this.root();
      return root.set('selectedItems', root._getSelectionSnapshot(), options);
    },
    restoreSelectedItems: function() {
      var selectedItems = this.root().get('selectedItems');
      if (selectedItems == null) {
        selectedItems = {
          none: this.flatten()
        };
      }
      selectedItems.none.each(function(m) {
        return m.setSelection(SelectionStates.NONE);
      });
      if (selectedItems.all != null) {
        selectedItems.all.each(function(m) {
          return m.setSelection(SelectionStates.ALL);
        });
      }
      return this.update();
    },
    _getSelectionSnapshot: function() {
      var flatTree = this.flatten();
      var selectionSnapshot = {
        none: flatTree.filter(function(m) {
          return m.getSelection() === SelectionStates.NONE;
        }),
        some: flatTree.filter(function(m) {
          return m.getSelection() === SelectionStates.SOME;
        }),
        all: flatTree.filter(function(m) {
          return m.getSelection() === SelectionStates.ALL;
        })
      };
      return selectionSnapshot;
    },
    update: function() {
      this.root().updateSelection();
      var numberOfServerItems = this.root().get('numberOfItemsAtServer');
      if (numberOfServerItems != null) {
        this.root().set('numberOfItems', numberOfServerItems);
      } else {
        this.root().updateCountOfItems('numberOfItems', function(model) {
          return 1;
        });
      }
      this.root().updateCountOfItems('numberOfSelectedItems', function(model) {
        if (model.getSelection() === SelectionStates.ALL) {
          return 1;
        } else {
          return 0;
        }
      });
      return this;
    },
    updateSelection: function() {
      var inferParentSelectionStateFromChildren = function(childrenStates) {
        var all = _.every(childrenStates, function(el) {
          return el === SelectionStates.ALL;
        });
        var none = _.every(childrenStates, function(el) {
          return el === SelectionStates.NONE;
        });
        if (all) {
          return SelectionStates.ALL;
        } else if (none) {
          return SelectionStates.NONE;
        } else {
          return SelectionStates.SOME;
        }
      };
      return this.inferSelection(inferParentSelectionStateFromChildren, function(model, isSelected) {
        if (model.children()) {
          if (model.getSelection() !== isSelected) {
            return model.setSelection(isSelected);
          }
        }
      });
    },
    inferSelection: function(logic, callback) {

      /*
       * calculate the current state based on the state of the children
       * and optionally execute a callback
       */
      var itemCallback = function(node) {
        return node.getSelection();
      };
      var bothCallback = function(node, result) {
        if (_.isFunction(callback)) {
          callback(node, result);
        }
        return result;
      };
      return this.walkDown(itemCallback, logic, bothCallback);
    },
    countItems: function(callback) {
      var count;
      if (this.children()) {
        count = this.children().reduce(function(memo, child) {
          return memo + child.countItems(callback);
        }, 0);
      } else {
        count = callback(this);
      }
      return count;
    },
    updateCountOfItems: function(property, callback) {
      var countItem = function(model) {
        return callback(model);
      };
      var sumItems = function(list) {
        return _.reduce(list, (function(memo, n) {
          return memo + n;
        }), 0);
      };
      var setCountOfItems = function(model, count) {
        if (model.children()) {
          model.set(property, count);
        }
        return count;
      };
      return this.walkDown(countItem, sumItems, setCountOfItems);
    },
    countSelectedItems: function() {
      return this.countItems(function(model) {
        if (model.getSelection() === SelectionStates.ALL) {
          return 1;
        } else {
          return 0;
        }
      });
    },
    updateCountOfSelectedItems: function() {
      var countSelectedItem = function(model) {
        if (model.getSelection() === SelectionStates.ALL) {
          return 1;
        } else {
          return 0;
        }
      };
      var sumSelectedItems = function(list) {
        return _.reduce(list, (function(memo, n) {
          return memo + n;
        }), 0);
      };
      var setSelectedItems = function(model, count) {
        if (model.children()) {
          model.set('numberOfSelectedItems', count);
        }
        return count;
      };
      return this.walkDown(countSelectedItem, sumSelectedItems, setSelectedItems);
    },
    hasChanged: function() {
      var hasChanged = false;
      var previousSelection = this.get('selectedItems');
      if (previousSelection != null) {
        hasChanged = _.any(_.map(this._getSelectionSnapshot(), function(current, state) {
          var intersection, previous;
          previous = previousSelection[state];
          intersection = current.intersection(previous.value()).value();
          return !(current.isEqual(intersection).value() && previous.isEqual(intersection).value());
        }));
      }
      return hasChanged;
    },

    filterBy: function(text){
      this.root().set('searchPattern', text);
      this._filterBy(text);
      return this;
    },
    _filterBy: function(text){
      this._filter(text, "", this.get("matcher"));
      this.root().setVisibility(true);
    },
    _filter: function(text, prefix, customMatcher) {

      /*
       * decide on item visibility based on a match to a filter string
       * The children are processed first in order to ensure the visibility is reset correctly
       * if the user decides to delete/clear the search box
       */
      var isMatch, that = this;
      var fullString = _.chain(['label']).map(function(property) {
        return that.get(property);
      }).compact().value().join(' ');
      if (prefix) {
        fullString = prefix + fullString;
      }
      if (this.children()) {
        isMatch = _.any(this.children().map(function(m) {
          var childIsMatch;
          childIsMatch = m._filter(text, fullString, customMatcher);
          m.setVisibility(childIsMatch);
          return childIsMatch;
        }));
      } else if (_.isEmpty(text)) {
        isMatch = true;
      } else {
        if (_.isFunction(customMatcher)) {
          isMatch = customMatcher(fullString, text);
        } else {
          isMatch = fullString.toLowerCase().indexOf(text.toLowerCase()) > -1;
        }
        this.debug("fullstring  " + fullString + " match to " + text + ": " + isMatch);
      }
      this.setVisibility(isMatch);
      return isMatch;
    }


  }, {
    SelectionStates: SelectionStates
  });

  return BaseSelectionTree;
});
