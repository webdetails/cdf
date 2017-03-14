/*!
 * Copyright 2002 - 2017 Webdetails, a Pentaho company. All rights reserved.
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
  }

  Context.prototype.get = function () {
      return {
        type: ""
      }
  };

  Context.prototype.getAsync = function() {
    var me = this;

    function Model() {
    }

    Model.prototype.set = function() {};

    Model.prototype.type =  {
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
