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


module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../../../../',

    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files: [
      'target/test-javascript/cdf/lib/shims.js',
      'target/test-javascript/cdf/cdf-legacy/lib/pen-shim.js',
      'src/test/javascript/cdf-legacy/context.js',
      'target/test-javascript/cdf/cdf-legacy/wd.js',
      'target/test-javascript/cdf/cdf-legacy/lib/json.js',
      'target/test-javascript/cdf/lib/jQuery/jquery.js',
      'target/test-javascript/cdf/lib/jQuery/jquery.ui.js',
      'target/test-javascript/cdf/lib/blockUI/jquery.blockUI.js',
      'target/test-javascript/cdf/lib/uriQueryParser/jquery-queryParser.js',
      'target/test-javascript/cdf/lib/underscore/underscore.js',
      'target/test-javascript/cdf/lib/backbone/backbone.js',
      'target/test-javascript/cdf/lib/mustache/mustache.js',
      'target/test-javascript/cdf/lib/moment/moment.js',
      'target/test-javascript/cdf/lib/base/Base.js',
      'src/test/javascript/cdf-legacy/cdf-base.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Main.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Query.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Bookmarks.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Startup.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Utils.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Legacy.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.Notifications.js',
      'target/test-javascript/cdf/cdf-legacy/Dashboards.RefreshEngine.js',
      'target/test-javascript/cdf/cdf-legacy/components/core.js',
      'target/test-javascript/cdf/cdf-legacy/components/input.js',
      'target/test-javascript/cdf/cdf-legacy/queries/coreQueries.js',
      'target/test-javascript/cdf/cdf-legacy/components/simpleautocomplete.js',
      'src/test/javascript/cdf-legacy/lib/test-components.js',

      'src/test/javascript/cdf-legacy/karma.main.js',

      {pattern: 'src/test/javascript/cdf-legacy/**/*-spec*.js', included: true}
    ],

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
    browsers: ['Chrome'],//, 'Firefox', 'IE', 'PhantomJS', 'Chrome'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 600000,

    browserNoActivityTimeout: 600000,

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
