// Karma configuration
// Generated on Fri Nov 15 2013 00:09:22 GMT+0000 (GMT Standard Time)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],


    // list of files / patterns to load in the browser
   files: [
      'cdf/js/lib/shims.js',
      'cdf/js/lib/pen-shim.js',
      'test-js/testUtils.js',
      'cdf/js/wd.js',
      'cdf/js/json.js',
      'cdf/js/jquery.js',
      'cdf/js/jquery.ui.js',
      'cdf/js/autobox/jquery.templating.js',
      'cdf/js/autobox/jquery.ui.autobox.js',
      'cdf/js/autobox/jquery.ui.autobox.ext.js',
      'cdf/js/jquery.blockUI.js',
      'cdf/js/uriQueryParser/jquery-queryParser.js',
      'cdf/js/underscore.js',
      'cdf/js/backbone.js',
      'cdf/js/mustache.js',
      'cdf/js/Base.js',
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
      '../cdf-pentaho-base/cdf/js/components/jfreechart.js',
      '../cdf-pentaho-base/cdf/js/components/VisualizationApiComponent.js',
      'test-js/lib/test-components.js',
      'test-js/main.js',
      {pattern: 'test-js/**/*-spec.js', included: false}
    ],


    // list of files to exclude
    exclude: [
    ],


    preprocessors: {
        "cdf/js/*.js" : 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    //reporter: coverage
    coverageReporter: {
        type : 'cobertura',
        dir : 'bin/coverage/reports/'
    },

    //reporter: junit
    junitReporter: {
      outputFile: 'bin/test/test-results.xml',
      suite: 'unit'
    },

    // the default configuration
    htmlReporter: {
      outputDir:    'bin/test/karma_html',
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
    autoWatch: true,


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


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
