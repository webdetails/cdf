/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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

// Find and inject tests using require
(function() {
  var karma = window.__karma__;

  var tests = [];
  for(var file in karma.files) {
    if((/test.*\-spec\.js$/).test(file)) {
      tests.push(file);
    }
  }

  requireCfg.baseUrl = '/base';

  // mocks
  requireCfg.paths["pentaho"] = "src/test/javascript/cdf/mocks/pentaho";
  requireCfg.paths["common-ui"] = "src/test/javascript/cdf/mocks/common-ui";
  requireCfg.paths["cdf/lib/CCC"] = "target/dependency/ccc/amd";

  require.config(requireCfg);

  console.log = function() {};
  console.info = function() {};
  console.debug = function() {};
  console.warn = function() {};

  // Ask Require.js to load all test files and start test run
  require(tests, karma.start);
})();
