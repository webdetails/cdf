/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files: [
      '../cdf-core/cdf/js-lib/shims.js',
      '../cdf-core/cdf/js-lib/pen-shim.js',
      '../cdf-core/test-js/legacy/testUtils.js',
      '../cdf-core/cdf/js/wd.js',
      '../cdf-core/cdf/js-lib/json.js',
      '../cdf-core/cdf/js-lib/jQuery/jquery.js',
      '../cdf-core/cdf/js-lib/jQuery/jquery.ui.js',
      '../cdf-core/cdf/js-lib/autobox/jquery.templating.js',
      '../cdf-core/cdf/js-lib/autobox/jquery.ui.autobox.js',
      '../cdf-core/cdf/js-lib/autobox/jquery.ui.autobox.ext.js',
      '../cdf-core/cdf/js-lib/blockUI/jquery.blockUI.js',
      '../cdf-core/cdf/js-lib/uriQueryParser/jquery-queryParser.js',
      '../cdf-core/cdf/js-lib/underscore/underscore.js',
      '../cdf-core/cdf/js-lib/backbone/backbone.js',
      '../cdf-core/cdf/js-lib/mustache/mustache.js',
      '../cdf-core/cdf/js-lib/base/Base.js',
      'cdf/js/cdf-base.js',
      '../cdf-core/cdf/js/Dashboards.Main.js',
      '../cdf-core/cdf/js/Dashboards.Query.js',
      '../cdf-core/cdf/js/Dashboards.Bookmarks.js',
      '../cdf-core/cdf/js/Dashboards.Startup.js',
      '../cdf-core/cdf/js/Dashboards.Utils.js',
      '../cdf-core/cdf/js/Dashboards.Legacy.js',
      '../cdf-core/cdf/js/Dashboards.Notifications.js',
      '../cdf-core/cdf/js/Dashboards.RefreshEngine.js',
      '../cdf-core/cdf/js/components/core.js',
      'cdf/js/components/Pentaho.Reporting.js',
      '../cdf-core/cdf/js/components/input.js',
      '../cdf-core/cdf/js/queries/coreQueries.js',
      '../cdf-core/test-js/legacy/lib/test-components.js',
      '../cdf-core/test-js/legacy/main.js',
      {pattern: 'test-js/legacy/**/*.js', included: false}
    ],

    // list of files to exclude
    exclude: [],

    preprocessors: {'cdf/js/*.js': 'coverage'},

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    //reporter: coverage
    coverageReporter: {
      type: 'cobertura',
      dir: 'bin/test-reports-legacy/coverage/reports/'
    },

    //reporter: junit
    junitReporter: {
      outputFile: 'bin/test-reports-legacy/test-results.xml',
      suite: 'unit'
    },

    // the default configuration
    htmlReporter: {
      outputDir:    'bin/test-reports-legacy/cdf-pentaho5/karma_html',
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
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // The configuration setting tells Karma how long to wait (in milliseconds) after any changes have occurred before starting the test process again.
    autoWatchBatchDelay: 250,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],//, 'Firefox', 'IE', 'PhantomJS'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    //browserNoActivityTimeout: 20000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-junit-reporter',
      'karma-html-reporter',
      'karma-coverage',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher'
    ]
  });
};
