/*
Copyright (c) 2013 Dominick Pham <dominick@dph.am>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function() {

	var ArrMethods = {
		where: function(attrs) {
			var nodes = [];
			_.each(this, function(model) {
				nodes = nodes.concat(model.where(attrs));
			});
			return wrapArray(_.uniq(nodes));
		}
	};
	var wrapArray = function(array) { return _.extend(array, ArrMethods); };

	var TreeModel = Backbone.TreeModel = Backbone.Model.extend({
		nodesAttribute: 'nodes',
		constructor: function tree(node) {
			Backbone.Model.prototype.constructor.apply(this, arguments);
			// Don't let the TreeCollection assume that it knows what model it should use.
			// We may be utilizing an extended TreeModel here.
			this._nodes = new TreeCollection(undefined, {
				model: this.constructor
			});
			this._nodes.parent = this;
		    if(node && node[this.nodesAttribute]){
			this.add(node[this.nodesAttribute]);
			this.unset(this.nodesAttribute);
		    }


			//Pass the events to the root node.
			this._nodes.on("all", function(event, model, collection, options) {
				this.root().trigger.apply(this.root(), arguments);
			}, this);
		},

		/**
		 * returns JSON object representing tree, account for branch changes
		 */
		toJSON: function() {
			var jsonObj = Backbone.Model.prototype.toJSON.apply(this, arguments);
			var children = this._nodes.toJSON();
			if(children.length) jsonObj[this.nodesAttribute] = children;
			return jsonObj;
		},

		/**
		 * returns descendant matching :id
		 */
		find: function(id) { return this.findWhere({id: id}); },

		/**
		 * return first matched descendant
		 */
		findWhere: function(attrs) { return this.where(attrs, true); },

		/**
		 * return all matched descendants
		 */
		where: function(attrs, first, excludeCurrentNode) {
			var nodes = [], matchedNode;

			// manual (non-collection method) check on the current node
			if(!excludeCurrentNode && _.where([this.toJSON()], attrs)[0]) nodes.push(this);

			if(first) {
				// return if first/current node is a match
				if(nodes[0]) return nodes[0];

				// return first matched node in children collection
				matchedNode = this._nodes.where(attrs, true);
				if(_.isArray(matchedNode)) matchedNode = matchedNode[0];
				if(matchedNode instanceof Backbone.Model) return matchedNode;

				// recursive call on children nodes
				for(var i=0, len=this._nodes.length; i<len; i++) {
					matchedNode = this._nodes.at(i).where(attrs, true, true);
					if(matchedNode) return matchedNode;
				}
			} else {
				// add all matched children
				nodes = nodes.concat(this._nodes.where(attrs));

				// recursive call on children nodes
				this._nodes.each(function(node) {
					nodes = nodes.concat(node.where(attrs, false, true));
				});

				// return all matched nodes
				return wrapArray(nodes);
			}
		},

		/**
		 * returns true if current node is root node
		 */
		isRoot: function() { return this.parent() === null; },

		/**
		 * returns the root for any node
		 */
		root: function() { return this.parent() && this.parent().root() || this; },

		/**
		 * checks if current node contains argument node
		 */
		contains: function(node) {
			if(!node || !(node.isRoot && node.parent) || node.isRoot()) return false;
			var parent = node.parent();
			return (parent === this) || this.contains(parent);
		},

		/**
		 * returns the parent node
		 */
		parent: function() { return this.collection && this.collection.parent || null; },

		/**
		 * returns the children Backbone Collection if children nodes exist
		 */
		nodes: function() { return this._nodes.length && this._nodes || null; },

		/**
		 * returns index of node relative to collection
		 */
		index: function() {
			if(this.isRoot()) return null;
			return this.collection.indexOf(this);
		},

		/**
		 * returns the node to the right
		 */
		next: function() {
			if(this.isRoot()) return null;
			var currentIndex = this.index();
			if(currentIndex < this.collection.length-1) {
				return this.collection.at(currentIndex+1);
			} else {
				return null;
			}
		},

		/**
		 * returns the node to the left
		 */
		prev: function() {
			if(this.isRoot()) return null;
			var currentIndex = this.index();
			if(currentIndex > 0) {
				return this.collection.at(currentIndex-1);
			} else {
				return null;
			}
		},

		/**
		 * removes current node if no attributes arguments is passed,
		 * otherswise remove matched nodes or first matched node
		 */
		remove: function(attrs, first) {
			if(!attrs) {
				if(this.isRoot()) return false; // can't remove root node
				this.collection.remove(this);
				return true;
			} else {
				if(first) {
					this.where(attrs, true).remove();
				} else {
					_.each(this.where(attrs), function(node) {
						if(node.collection) node.remove();
					});
				}
				return this;
			}
		},

		/**
		 * removes all children nodes
		 */
		empty: function() {
			this._nodes.reset();
			return this;
		},

		/**
		 * add child/children nodes to Backbone Collection
		 */
		add: function(node) {
			if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
			this._nodes.add.apply(this._nodes, arguments);
			return this;
		},

		/**
		 * inserts a node before the current node
		 */
		insertBefore: function(node) {
			if(!this.isRoot()) {
				if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
				this.parent().add(node, {at: this.index()});
			}
			return this;
		},

		/**
		 * inserts a node after the current node
		 */
		insertAfter: function(node) {
			if(!this.isRoot()) {
				if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
				this.parent().add(node, {at: this.index()+1});
			}
			return this;
		},

		/**
		 * shorthand for getting/inserting nodes before
		 */
		before: function(nodes) {
			if(nodes) return this.insertBefore(nodes);
			return this.prev();
		},

		/**
		 * shorthand for getting/inserting nodes before
		 */
		after: function(nodes) {
			if(nodes) return this.insertAfter(nodes);
			return this.next();
		}
	});

	var TreeCollection = Backbone.TreeCollection = Backbone.Collection.extend({
		where: function(attrs, opts) {
			if(opts && opts.deep) {
				var nodes = [];
				this.each(function(model) {
					nodes = nodes.concat(model.where(attrs));
				});
				return wrapArray(nodes);
			} else {
				return Backbone.Collection.prototype.where.apply(this, arguments);
			}
		}
	});
}).call(this);
