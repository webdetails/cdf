/* jshint devel:true */

define([
  'amd!cdf/lib/underscore',
  './baseevents'],
  function( _ , BaseEvents ) {

    var isFunction = _.isFunction,
        isArray = _.isArray,
        reduce = _.reduce;

    var BaseElement = Base.extend({
      initialize: function(opts) {

        this.base(opts);

        // Normalized input handlers
        this._normalizeInputHandlers(opts.inputHandlers);

      },
      _normalizeInputHandlers: function() {
        this._inputHandlers =
          isArray(this.inputHandlers) ? this.inputHandlers :
          isFunction(this.inputHandlers) ? [this.inputHandlers] : [];
      },
      _bindOutputHandlers: function() {

      },
      _inputController: function(newData) {
        var model = this.model,
            transformedData = reduce(this._inputHandlers, function(acc, handler) {
              return handler(acc, model);
            }, newData);

        model.set(transformedData);
      },
      _getViewElement: function() {
        return this.view.$el;
      },
      update: function(newData) {
        // TODO: Add promises here!! ??
        this._inputController(newData);
        return this._getViewElement();
      }
    });

    return BaseElement;
});
