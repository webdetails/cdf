// Karma configuration
// Generated on Fri Nov 15 2013 00:09:22 GMT+0000 (GMT Standard Time)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files: [
      'cdf/js-lib/shims.js',
      'cdf/js-lib/pen-shim.js',
      'test-js/legacy/testUtils.js',
      'cdf/js/wd.js',
      'cdf/js-lib/json.js',
      'cdf/js-lib/jQuery/jquery.js',
      'cdf/js-lib/jQuery/jquery.ui.js',
      'cdf/js-lib/autobox/jquery.templating.js',
      'cdf/js-lib/autobox/jquery.ui.autobox.js',
      'cdf/js-lib/autobox/jquery.ui.autobox.ext.js',
      'cdf/js-lib/blockUI/jquery.blockUI.js',
      'cdf/js-lib/uriQueryParser/jquery-queryParser.js',
      'cdf/js-lib/underscore/underscore.js',
      'cdf/js-lib/backbone/backbone.js',
      'cdf/js-lib/mustache/mustache.js',
      'cdf/js-lib/base/Base.js',
      '../cdf-pentaho5/cdf/js/cdf-base.js',
      'cdf/js/Dashboards.Main.js',
      'cdf/js/Dashboards.Query.js',
      'cdf/js/Dashboards.Bookmarks.js',
      'cdf/js/Dashboards.Startup.js',
      'cdf/js/Dashboards.Utils.js',
      'cdf/js/Dashboards.Legacy.js',
      'cdf/js/Dashboards.Notifications.js',
      'cdf/js/Dashboards.RefreshEngine.js',
      'cdf/js/components/core.js',
      'cdf/js/components/input.js',
      'cdf/js/queries/coreQueries.js',
      'cdf/js/components/simpleautocomplete.js',
      {pattern: '../cdf-pentaho-base/cdf/js/**/*.js', included: true},
      'test-js/legacy/lib/test-components.js',
      'test-js/legacy/main.js',
      {pattern: 'test-js/legacy/**/*.js', included: true}
    ],

    // list of files to exclude
    exclude: ['../cdf-pentaho-base/cdf/js/components/ccc.js'],

    preprocessors: {
      "cdf/js/*.js" : 'coverage',
      "cdf/js/components/*.js" : 'coverage'        
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    //reporter: coverage
    coverageReporter: {
      type: 'cobertura',
      dir: 'bin/test-legacy/coverage/reports/'
    },

    //reporter: junit
    junitReporter: {
      outputFile: 'bin/test-legacy/test-results.xml',
      suite: 'unit'
    },

    // the default configuration
    htmlReporter: {
      outputDir:    'bin/test-legacy/karma_html',
      templatePath: 'node_modules/karma-html-reporter/jasmine_template.html'
    },

    //hostname
    hostname: [
      'localhost'
    ],
    
    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

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
    captureTimeout: 1200000,

    browserNoActivityTimeout: 2400000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

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
