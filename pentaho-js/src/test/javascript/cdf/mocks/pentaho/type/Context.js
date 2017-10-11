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

define(function() {

  /* global Promise:false */

  function Context() {
    this.instances = {
      getById: function(paletteId) {
        switch(paletteId) {
          case "pentaho/visual/color/palettes/nominalPrimary":
          case "pentaho/visual/color/palettes/quantitativeBlue3":
            return {
              colors: {
                toArray: function(){
                  return [
                    {value: "dummy"}
                  ];
                }
              }
            };
        }
      },

      getByType: function(typeId) {
        switch(typeId) {
          case "pentaho/visual/color/palette":
            return {
              colors: {
                toArray: function(){
                  return [
                    {value: "dummy"}
                  ];
                }
              }
            };
        }
      }
    };
  }

  Context.createAsync = function(envSpec) {
    return Promise.resolve(new Context());
  };

  Context.prototype.get = function (factory) {
    if(typeof factory === "function") {
      return factory.call(this);
    }

    return {
      type: ""
    }
  };

  Context.prototype.getDependencyAsync = function() {
    return Promise.resolve();
  };

  Context.prototype.getAsync = function(id) {
    var me = this;

    if(id === "pentaho/visual/base/view") {
      function BaseView() {}

      BaseView.createAsync = function(viewSpec) {

        var view = {
          width: (viewSpec && viewSpec.width),
          height: (viewSpec && viewSpec.height),
          $type: {
            context: me
          },
          model: {
            $type: {
              context: me
            },
            set: function(p, v) {
              this[p] = v;
            }
          },

          update: function () {
            return Promise.resolve();
          },

          set: function(p, v) {
            this[p] = v;
          }
        };

        return Promise.resolve(view);
      };

      return Promise.resolve(BaseView);
    }

    function Model() {
    }

    Model.prototype.set = function() {};

    Model.prototype.$type =  {
      context: me
    };

    Model.type = {
      extensionEffective: {
        definition: 'dummy'
      }
    };

    return Promise.resolve(Model);
  };

  Context.prototype.enterChange = function() {
    // TransactionScope
    var scope = {
      accept: function() {
      },
      using: function(f, x) {
        return f.call(x, scope);
      }
    };

    return scope;
  };

  return Context;
});
