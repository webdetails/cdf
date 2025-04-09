/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
// @see http://karma-runner.github.io/0.10/plus/requirejs.html

/* global requireCfg:false, window:false */

(function() {
  var karma = window.__karma__;

  // Karma serves files from '/base'
  var baseUrl = '/base';

  var tests = [];
  for (var file in karma.files)
    if (/\-spec\.js$/.test(file))
    // Load the file as an AMD module, or relative module ids won't work.
      tests.push(
          file.replace(
              new RegExp("^" + baseUrl + "/(.*?)\\.js$", "i"), "$1"));

  // RequireJs is being used to load the tests and to share a few modules with the CDF's RequireJS version.

  requireCfg.baseUrl = baseUrl;
  requireCfg.paths["pentaho"] = "src/test/javascript/cdf/mocks/pentaho";
  requireCfg.paths["cdf"] = "target/test-javascript/cdf/cdf";

  requirejs.config(requireCfg);

  console.log = function() {};
  console.info = function() {};
  console.debug = function() {};
  console.warn = function() {};

  // Ask Require.js to load all test files and start test run
  requirejs(tests, karma.start);

}());
