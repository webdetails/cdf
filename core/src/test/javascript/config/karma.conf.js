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
      {pattern: 'target/test-javascript/cdf/**/*.css', included: false},
      {pattern: 'target/test-javascript/cdf/**/*.js', included: false},
      {pattern: 'target/test-javascript/cdf/**/*.html', included: false},
      {pattern: 'target/test-javascript/lib/**/*.css', included: false},
      {pattern: 'target/test-javascript/lib/**/*.js', included: false},
      {pattern: 'target/dependency/ccc/amd/**/*.js', included: false},
      {pattern: 'target/dependency/ccc/amd/**/*.css', included: false},
      'src/test/javascript/config/context.js',
      {pattern: 'src/test/javascript/cdf/**/*-spec.js', included: false},
      'target/test-javascript/cdf-core-require-js-cfg.js',
      'target/test-javascript/cdf-core-lib-require-js-cfg.js',
      'src/test/javascript/config/require-config.js',
      {pattern: 'src/test/javascript/cdf/**/*.ext.js', included: true},
      // fix 404 messages
      {pattern: 'target/test-javascript/cdf/**/*.png', watched: false, included: false, served: true},
      {pattern: 'target/test-javascript/cdf/**/*.gif', watched: false, included: false, served: true},
      {pattern: 'target/test-javascript/cdf/**/*.svg', watched: false, included: false, served: true}
    ],

    preprocessors: {'src/test/javascript/cdf/**/*.js': 'coverage'},

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    //reporter: coverage
    coverageReporter: {
      type: 'cobertura',
      dir: 'target/coverage-reports/cdf-javascript'
    },

    //reporter: junit
    junitReporter: {
      outputFile: 'target/js-reports/cdf-results.xml',
      suite: 'unit'
    },

    // the default configuration
    htmlReporter: {
      outputDir: 'target/coverage-reports/cdf-javascript',
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
    logLevel: config.LOG_ERROR,

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
