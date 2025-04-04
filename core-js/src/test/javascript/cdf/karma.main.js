/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


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

  requireCfg.paths["common-ui"] = "src/test/javascript/cdf/mocks/common-ui";
  requireCfg.paths["pentaho"] = "src/test/javascript/cdf/mocks/pentaho";
  requireCfg.paths["cdf/lib/CCC"] = "target/dependency/ccc/amd";

  require.config(requireCfg);

  console.log = function() {};
  console.info = function() {};
  console.debug = function() {};
  console.warn = function() {};

  // Ask Require.js to load all test files and start test run
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  require(tests, karma.start);
})();
