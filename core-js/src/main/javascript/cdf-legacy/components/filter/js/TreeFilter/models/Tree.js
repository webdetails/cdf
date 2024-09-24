'use strict';
(function(_, TreeModel, BaseEvents, Logger, Models) {

  /**
   * @module TreeFilter
   * @submodule Models
   * @class Tree
   * @constructor
   * @extends Backbone.TreeModel
   * @uses Logger
   * @uses BaseEvents
   */
  return Models.Tree = BaseEvents.extendWithEvents(TreeModel).extend(Logger).extend({
    url: '',
    loglevel: 'log',
    children: function() {
      return this.nodes.apply(this, arguments);
    },
    parse: function(response, options) {
      return response;
    },

    /**
     * walk down the tree and do stuff:
     * 1. if the node has no children, call itemCallback and get the result
     * 2. if the node has children, run child.walk for every child and combine the array of results with combineCallback
     *
     *
     *     function combineCallback(model, array){
     *         return _.all(array);
     *     }
     *
     * @method walkDown
     * @param {function} itemCallback
     * @param {function} combineCallback
     * @param {function} alwaysCallback
     */
    walkDown: function(itemCallback, combineCallback, alwaysCallback) {
      var result;
      if (!combineCallback) {
        combineCallback = function(x) {
          return x;
        };
      }
      if (this.children()) {
        result = combineCallback(this.children().map(function(child) {
          return child.walkDown(itemCallback, combineCallback, alwaysCallback);
        }));
      } else {
        result = itemCallback(this);
      }
      if (_.isFunction(alwaysCallback)) {
        result = alwaysCallback(this, result);
      }
      return result;
    },

    /**
     * Returns self and descendants as a flat list
     * @method flatten
     * @return { wrappedList } Returns a list wrapped by _.chain()
     */
    flatten: function() {
      var list;
      list = [this];
      if (this.children()) {
        this.children().each(function(node) {
          return node.flatten().each(function(el) {
            return list.push(el);
          });
        });
      }
      return _.chain(list);
    },

    /**
     * Returns just the leaf-level descendants of a given node
     * @returns {Underscore} Returns a wrapped Underscore object using _.chain()
     */
    leafs: function(){
      return this.flatten().filter(function(m){
        return m.children() === null;
      });
    }
  });
})(_, Backbone.TreeModel, BaseEvents, TreeFilter.Logger, TreeFilter.Models);
