/*!
 * Copyright 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
define([
  "pentaho/type/Context"
], function(Context) {

  "use strict";

  var _contextPromise;

  return {
    load: function(name, require, onLoad, config) {
      if (config.isBuild) {
        // Don't include dependencies in the build.
        // These are resolved dynamically in the "browser".
        // If a specific dependency should be included in the build,
        // it must be included explicitly and directly,
        // by specifying its AMD module id.
        onLoad();
      } else {
        if (!_contextPromise) {
          _contextPromise = createContextAsync();
        }

        _contextPromise.then(onLoad);
      }
    }
  };

  function createContextAsync() {

    var context;

    return Context.createAsync({application: "pentaho-cdf"})
        .then(function(_context) {

          context = _context;

          // Pre-load any VizAPI dependencies that later need to be used synchronously.
          return context.getDependencyAsync([
            // Pre-load VizAPI Color palettes needed for CDF/CCC VizAPI-like styling.
            {$instance: {type: ["pentaho/visual/color/palette"]}}
          ]);
        })
        .then(function() {
          return context;
        });
  }
});
