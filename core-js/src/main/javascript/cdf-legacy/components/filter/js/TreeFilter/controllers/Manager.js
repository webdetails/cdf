'use strict';

/**
 * @module TreeFilter
 * @submodule Controllers
 */
(function(_, TreeFilter, Controllers, Tree) {
  'use strict';

  /**
   * Controller responsible for managing the hierarchy of views and controllers.
  #
   * When data is added to the model, the Manager reacts by creating
   * the appropriate views and respective controllers
  #
   * @class Manager
   * @constructor
   * @extends Tree
   */
  Controllers.Manager = Tree.extend({
    ID: 'TreeFilter.Controllers.Manager',
    defaults: {
      model: null,
      view: null,
      controller: null,
      configuration: null
    },
    constructor: function(options) {
      this.base.apply(this, arguments);
      var loglevel = this.get('configuration').loglevel;
      if (!_.isUndefined(loglevel)) {
        this.loglevel = loglevel;
      }
      this.updateChildren();
      return this;
    },
    initialize: function(options) {
      if (this.get('view') == null) {
        this.addViewAndController(this.get('model'));
      }
      this.applyBindings();
      return this;
    },
    close: function() {
      this.empty();
      this.get('view').close();
      this.get('controller').stopListening().off();
      this.stopListening();
      this.off();
      this.clear();
      return this;
    },
    empty: function() {
      if(!this.children()) return;
      this.children().each(function(child) {
        child.close();
      });
      this.base();
    },
    applyBindings: function() {
      var that = this;
      var throttleScroll = function(f) {
        var throttleTimeMilliseconds = that.get('configuration').pagination.throttleTimeMilliseconds;
        return _.throttle(f, throttleTimeMilliseconds || 0, {
          trailing: false
        });
      };
      var throttleFilter = function(f) {
        var throttleTimeMilliseconds = that.get('view').config.view.throttleTimeMilliseconds;
        return _.debounce(f, throttleTimeMilliseconds);
      };

      /**
       * Declare bindings to model and view
       */
      var bindings = {
        model: {
          'add': this.onNewData,
          'change:selectedItems': this.onApply,
          'selection': this.sortSiblings
        },
        view: {
          'filter': throttleFilter(this.onFilterChange),
          'scroll:reached:top': throttleScroll(this.getPreviousPage),
          'scroll:reached:bottom': throttleScroll(this.getNextPage)
        }
      };

      /**
       * Create listeners
       */
      _.each(bindings, function(bindingList, object) {
        return _.each(bindingList, function(method, event) {
          return that.listenTo(that.attributes[object], event, _.bind(method, that));
        });
      });
      this.on('post:child:selection request:child:sort', throttleFilter(this.renderSortedChildren));
      this.on('post:child:add', throttleFilter(this.onUpdateChildren));
      return this;
    },
    addViewAndController: function(newModel) {

      /**
       * Decide which view to use
       */
      var Controller, View, childConfig, configuration, controller, newController, newView, shareController, target, that;
      shareController = true;
      if (this.parent() != null) {

        /**
         * This node is either a Group or an Item
         * Use the parent's configuration
         */
        that = this.parent();
        configuration = that.get('configuration');
        childConfig = configuration[that.get('view').type].view.childConfig;
        target = that.get('view').createChildNode();
        if (newModel.children()) {
          View = TreeFilter.Views[childConfig.withChildrenPrototype];
        } else {
          View = TreeFilter.Views[childConfig.withoutChildrenPrototype];
        }
        Controller = TreeFilter.Controllers.RootCtrl;
        controller = that.get('controller');
      } else {

        /**
         * This node is the Root.
         * A configuration object must have been passed as an option
         */
        configuration = this.get('configuration');
        target = configuration.target;
        View = TreeFilter.Views.Root;
        Controller = TreeFilter.Controllers.RootCtrl;
        controller = null;
      }

      /**
       * Create new view
       */
      newView = new View({
        model: newModel,
        configuration: configuration,
        target: target
      });
      this.set('view', newView);

      /**
       * Reuse the existing controller, or create a new one, if needed
       */
      if (shareController === true && controller !== null) {
        newController = controller;
        newController.bindToView(newView);
      } else {
        newController = new Controller({
          model: newModel,
          view: newView,
          configuration: configuration
        });
      }
      this.set('controller', newController);
      this.debug("addViewAndController is done for " + (newModel.get('id')) + " : " + (newModel.get('label')));
      return this;
    },
    onNewData: function(item, collection, obj) {
      var itemParent;
      this.debug("New data (" + (item.get('label')) + ") caught by " + (this.get('model').get('label')));
      itemParent = this.where({
        model: item.parent()
      });
      if (itemParent.length === 1) {
        return itemParent[0].trigger("post:child:add");
      }
    },
    onUpdateChildren: function() {
      this.debug("New data added to " + (this.get('model').get('label')) + " : updating children");
      this.updateChildren();
      this.restoreScroll();
      return this.trigger('post:update:children', this);
    },
    restoreScroll: function() {
      if (this.get('view')._scrollBar != null) {
        this.debug("This group has a scrollbar");
        if (this.previousPosition != null) {
          this.debug("Scrolling back");
          this.get('view').setScrollBarAt(this.previousPosition);
          return this.previousPosition = null;
        }
      }
    },

    /**
     * Pagination
     */
    getNextPage: function(model, event) {
      var listOfChildren = this._listChildren(this.children());
      var sortedChildren = this.sortChildren(listOfChildren);
      var penultimateChild = _.last(sortedChildren, 2)[0];
      this.previousPosition = penultimateChild != null ? penultimateChild.target : undefined;
      return this.getPage('next', model, event);
    },
    getPreviousPage: function(model, event) {
      var listOfChildren = this._listChildren(this.children());
      var sortedChildren = this.sortChildren(listOfChildren);
      var secondChild = _.first(sortedChildren, 2)[1];
      this.previousPosition = secondChild != null ? secondChild.target : undefined;
      return this.getPage('previous', model, event);
    },
    getPage: function(page, model, event) {
      this.debug("Item " + (model.get('label')) + " requested page " + page);
      var searchPattern = "";
      if (this.get('configuration').search.serverSide === true) {
        searchPattern = model.root().get('searchPattern')
      }
      return this.requestPage(page,searchPattern);
    },
    requestPage: function(page, searchPattern) {
      var getPage = this.get('configuration').pagination.getPage;
      if (!_.isFunction(getPage)) {
        return this;
      }
      var that = this;
      return getPage(page, searchPattern).then(function(json) {
        if (json.resultset != null) {
          that.debug("getPage: got " + json.resultset.length + " more items");
        } else {
          that.debug("getPage: no more items");
        }
      });
    },

    /**
     * Child management
     */
    updateChildren: function() {
      var models = this.get('model').children();
      if (models != null) {
        var that = this;
        models.each(function(m) {
          var hasModel = false;
          if (that.children()) {
            hasModel = _.any(that.children().map(function(child) {
              return child.get('model') === m;
            }));
          }
          if (!hasModel) {
            that.debug("adding child model " + (m.get('label')));
            return that.addChild(m);
          }
        });
        this.renderSortedChildren();
        this.get('view').updateScrollBar();
      }
      return this;
    },

    /**
     * Create a new manager for this MVC tuple
     * @method addChild
     * @chainable
     */
    addChild: function(newModel) {
      var newManager = {
        model: newModel,
        configuration: this.get('configuration')
      };
      this.add(newManager);
      return this;
    },
    removeChild: function(model) {
      throw new Error("NotImplemented");
    },
    sortSiblings: function(model) {
      this.debug("sortSiblings: " + (this.get('model').get('label')) + " was triggered from " + (model.get('label')) + ":" + (model.getSelection()));
      if (this.get('model') !== model) {
        return this;
      }
      if (this.parent()) {
        return this.parent().trigger('request:child:sort');
      }
    },
    /**
     * Gets an array containing the sorter functions. The most significant
     * sorter function should be placed at the beginning of the array.
     *
     * @method getSorters
     * @return {Array} an array with the available sorter functions
     */
    getSorters: function() {
      var type = this.children().first().get('view').type;
      var customSorters = this.get('configuration')[type].sorter;

      if (_.isFunction(customSorters)) {
        return [customSorters];
      } else if (_.isArray(customSorters)) {
        return customSorters;
      } else {
        return [];
      }
    },
    /**
     * Sorts a collection according to one or more custom sorter functions.
     * This function uses underscore's sortBy function. In order to
     * support multiple sorter functions we need to apply them in reverse order,
     * starting with the least significant and ending with the most significant.
     * The most significant should be placed at the beginning of the custom sorter
     * functions array.
     *
     * @method sortChildren
     * @param {Array} children the array to be sorted
     * @return {Array} the sorted array
     */
    sortChildren: function(children) {
      var customSorters = this.getSorters();
      if (_.isEmpty(customSorters)) {
        return children;
      }

      var sorterIdx = customSorters.length;
      var configuration = this.get('configuration');
      var orderedChildren = _.chain(children);

      // apply sorters in reverse order, from least to most important sorter
      while(sorterIdx--) {
        orderedChildren = orderedChildren.sortBy(function(child, idx) {
          return customSorters[sorterIdx](null, child.item.get('model'), configuration);
        });
      }
      return orderedChildren.value();
    },
    /**
     * Renders an array of sorted children.
     *
     * @method renderSortedChildren
     * @chainable
     */
    renderSortedChildren: function() {
      var $nursery;
      if (!this.children()) {
        return this;
      }

      $nursery = this.get('view').getChildrenContainer();
      $nursery.hide();
      this._appendChildren(this.sortChildren(this._detachChildren()));
      $nursery.show();

      return this;
    },
   _listChildren: function() {
      var children;
      if (this.children()) {
        children = this.children().map(function(child) {
          return {
            item: child,
            target: child.get('view').$el
          };
        });
      } else {
        children = null;
      }
      return children;
    },
    _detachChildren: function(){
        var list = this._listChildren();
        list.forEach(function(obj){
            obj.target.detach();
        });
        return list;
    },
    _appendChildren: function(children) {
      if (children != null) {
        _.each(children, (function(_this) {
          return function(child) {
            return _this.get('view').appendChildNode(child.target);
          };
        })(this));
      }
      return this;
    },

    /**
     * React to the user typing in the search box
     * @method onFilterChange
     * @param {String} text the new search pattern
     * @for Manager
     */
    onFilterChange: function(text) {
      if (this.get('configuration').search.serverSide === true) {
        this.requestPage(0, text)
      }
      this.get('model').filterBy(text);
    },

    /**
     * Management of selected items
     */
    onApply: function(model) {
      return this.onFilterChange('');
    }
  });
})(_, TreeFilter, TreeFilter.Controllers, TreeFilter.Models.Tree);
