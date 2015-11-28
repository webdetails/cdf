/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../../../../',

    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files: [
      'target/test-javascript/lib/shims.js',
      'target/test-javascript/lib//pen-shim.js',
      'src/test/javascript/cdf-legacy/testUtils.js',
      'target/test-javascript/cdf-legacy/wd.js',
      'target/test-javascript/lib/json.js',
      'target/test-javascript/lib/jQuery/jquery.js',
      'target/test-javascript/lib/jQuery/jquery.ui.js',
      'target/test-javascript/lib/blockUI/jquery.blockUI.js',
      'target/test-javascript/lib/uriQueryParser/jquery-queryParser.js',
      'target/test-javascript/lib/underscore/underscore.js',
      'target/test-javascript/lib/backbone/backbone.js',
      'target/test-javascript/lib/mustache/mustache.js',
      'target/test-javascript/lib/moment/moment.js',
      'target/test-javascript/lib/base/Base.js',
      'src/test/javascript/cdf-legacy/cdf-base.js',
      'target/test-javascript/cdf-legacy/Dashboards.Main.js',
      'target/test-javascript/cdf-legacy/Dashboards.Query.js',
      'target/test-javascript/cdf-legacy/Dashboards.Bookmarks.js',
      'target/test-javascript/cdf-legacy/Dashboards.Startup.js',
      'target/test-javascript/cdf-legacy/Dashboards.Utils.js',
      'target/test-javascript/cdf-legacy/Dashboards.Legacy.js',
      'target/test-javascript/cdf-legacy/Dashboards.Notifications.js',
      'target/test-javascript/cdf-legacy/Dashboards.RefreshEngine.js',
      'target/test-javascript/cdf-legacy/components/core.js',
      'target/test-javascript/cdf-legacy/components/input.js',
      'target/test-javascript/cdf-legacy/queries/coreQueries.js',
      'target/test-javascript/cdf-legacy/components/simpleautocomplete.js',
      'src/test/javascript/cdf-legacy/lib/test-components.js',
      {pattern: 'src/test/javascript/cdf-legacy/**/*-spec*.js', included: true},
      'src/test/javascript/config/karma.main.legacy.config.js'
    ],

    preprocessors: {
      "target/test-javascript/cdf-legacy/*.js" : 'coverage',
      "target/test-javascript/cdf-legacy/components/*.js" : 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    //reporter: coverage
    coverageReporter: {
      type: 'cobertura',
      dir: 'target/coverage-reports/cdf'
    },

    //reporter: junit
    junitReporter: {
      outputFile: 'target/js-reports/cdf-legacy-results.xml',
      suite: 'unit'
    },

    // the default configuration
    htmlReporter: {
      outputDir: 'target/coverage-reports/cdf',
      templatePath: 'node_modules/karma-html-reporter/jasmine_template.html'
    },

    //hostname
    hostname: ['localhost'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // The configuration setting tells Karma how long to wait (in milliseconds) after any changes have occurred before starting the test process again.
    //autoWatchBatchDelay: 250,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],//, 'Firefox', 'IE', 'PhantomJS'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // to avoid DISCONNECTED messages
    // see https://github.com/karma-runner/karma/issues/598
    browserDisconnectTimeout : 10000, // default 2000
    browserDisconnectTolerance : 1, // default 0
    browserNoActivityTimeout : 60000, //default 10000

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-junit-reporter',
      'karma-html-reporter',
      'karma-coverage',
      'karma-phantomjs-launcher'
    ]
  });
};
