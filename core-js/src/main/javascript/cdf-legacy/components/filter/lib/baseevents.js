/* jshint devel:true */


// Main wrapper
//window.componentTest = ( function (  Backbone , _ , Mustache , Base , $ ) {


// BaseEvents: returns Base.js modification that includes Backbone.Events.
//   Also has several static helpers to augment constructors with .extend
//   and events functionality.
var BaseEvents = (function(_, Base, Backbone) {
  //'use strict';

  var rest = _.rest;

  //--------------------------------//

  function extendClass(TargetClass) {
    return Base.extend.apply(TargetClass, rest(arguments));
  }

  function addSelfExtend(TargetClass) {
    return extendClass(TargetClass, {}, {
      extend: Base.extend
    });
  }

  function addEvents(TargetClass) {
    return extendClass(TargetClass, Backbone.Events);
  }

  function convertClass(TargetClass) {
    return extendClass(addEvents(addSelfExtend(TargetClass)), arguments[1], arguments[2]);
  }


  var exports = convertClass(Base);

  //--------------------------------//

  exports.extendClass = extendClass;
  exports.convertClass = convertClass;
  exports.extendWithEvents = convertClass;

  return exports;

})(_, Base, Backbone);


// Base Collection
var BaseCollection = (function(BaseEvents) {
  //'use strict';

  var Collection = BaseEvents.convertClass(Array, {
    push: function() {
      var ret = this.base.apply(this, arguments),
          args = [].slice.call(arguments);
      for (var i = 0, len = args.length; i < len; i++) {
        this.trigger('add', args[i], ret - len + i);
      }
      this.trigger('change');
      return ret;
    },

    pop: function() {
      var ret = this.base.apply(this, arguments);
      this.trigger('remove', ret, this.length);
      this.trigger('change');
      return ret;
    }
  });

  //--------------------------------//

  return Collection;

})(BaseEvents);

//--------------------------------//

// Base View
var BaseView = (function(_, $, Mustache, BaseEvents, Backbone) {
  //'use strict';

  var View = BaseEvents.convertClass(Backbone.View, {
    initialize: function(config) {
      // Create model bindings.
      // TODO: Create smarter bindings to bind only to used properties.
      this.setModel(config.model);
      this.setElement($(config.target));
    },
    getModel: function() {
      return this.model;
    },
    setModel: function(model) {
      this.stopListening();
      this.model = model;
      this.bindToModel();
    },
    bindToModel: function() {
      this.listenTo(this.getModel(), 'change', this.render);
    },
    render: function() {
      return this.$el.html(Mustache.render(this.template, this.model.toJSON()));
    }

  });

  //--------------------------------//

  return View;

})(_, $, Mustache, BaseEvents, Backbone);





// Base Model
var BaseModel = (function(_, BaseEvents, Backbone) {
  //'use strict';

  var Model = BaseEvents.convertClass(Backbone.Model);

  return Model;

})(_, BaseEvents, Backbone);




var BaseController = (function(_, BaseEvents, BaseCollection) {
  //'use strict';

  function SeedController(views, models) {
    this.views = new BaseCollection(views);
    this.models = new BaseCollection(models);
  }

  var Controller = BaseEvents.convertClass(SeedController, {
    addView: function() {
      var ret = this.views.push.apply(this.views, arguments);
      return ret;
    },
    removeView: function() {
      var ret = this.views.pop.apply(this.views, arguments);
      return ret;
    },
    addModel: function() {
      var ret = this.models.push.apply(this.models, arguments);
      return ret;
    },
    removeModel: function() {
      var ret = this.models.pop.apply(this.models, arguments);
      return ret;
    }
  });

  return Controller;


})(_, BaseEvents, BaseCollection);
// Base Element
var BaseElement = (function(Base, _) {
  //'use strict';

  var isFunction = _.isFunction,
      isArray = _.isArray,
      reduce = _.reduce;

  var Element = Base.extend({
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

  return Element;

})(Base, _);



//  return {
// model: myModel,
// view: myView
// };

//})( window.Backbone , window._ , window.Mustache, window.Base, window.$ );
