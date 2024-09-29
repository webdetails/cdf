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


module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../../../../',

    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files: [
      'src/test/javascript/cdf/context.js',
      'target/test-javascript/cdf-core-require-js-cfg.js',
      'target/test-javascript/cdf-core-lib-require-js-cfg.js',
      'target/test-javascript/cdf-pentaho-require-js-cfg.js',
      'src/test/javascript/cdf/**/*.ext.js',

      'src/test/javascript/cdf/karma.main.js',

      {pattern: 'target/test-javascript/cdf/**/*.css', included: false},
      {pattern: 'target/test-javascript/cdf/**/*.js', included: false},
      {pattern: 'target/test-javascript/cdf/**/*.html', included: false},
      {pattern: 'target/test-javascript/lib/**/*.css', included: false},
      {pattern: 'target/test-javascript/lib/**/*.js', included: false},
      {pattern: 'target/dependency/ccc/amd/**/*.js', included: false},
      {pattern: 'target/dependency/ccc/amd/**/*.css', included: false},
      {pattern: 'src/test/javascript/cdf/**/*.js', included: false},

      // fix 404 messages
      {pattern: 'src/test/javascript/cdf/dashboard/*.properties', watched: false, included: false, served: true},
      {pattern: 'target/test-javascript/**/*.png', watched: false, included: false, served: true},
      {pattern: 'target/test-javascript/**/*.gif', watched: false, included: false, served: true},
      {pattern: 'target/test-javascript/**/*.svg', watched: false, included: false, served: true}
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    //reporter: coverage
    coverageReporter: {
      reporters: [
        {
          type: 'html',
          dir:  'target/coverage-reports/html/cdf-javascript'
        },
        {
          type: 'cobertura',
          dir:  'target/coverage-reports/cdf-javascript'
        }
      ]
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
