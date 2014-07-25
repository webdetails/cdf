// @see http://karma-runner.github.io/0.10/plus/requirejs.html

(function() {
    var karma = window.__karma__;
    var baseUrl = '/base';

    var tests = [];
    for(var file in karma.files)
        if(/\-spec\.js$/.test(file))
            // Load the file as an AMD module, or relative module ids won't work.
            tests.push(
                file.replace(
                    new RegExp("^" + baseUrl + '/../..' + "/(.*?)\\.js$", "i"), "$1"));

    requirejs.config({
        // Karma serves files from '/base'
        baseUrl: "http://localhost:9876/base/cdf/js-modules",
        paths: {
//            'ccc':    'bin/stage/ccc/amd',
           'jquery': '../../cdf/js-lib/jquery',
           'jquery.blockUI': '../../cdf/js-lib/jquery.blockUI',           
           'jquery.ui': '../../cdf/js-lib/jquery.ui',                      
           'underscore': '../../cdf/js-lib/underscore',
           'mustache': '../../cdf/js-lib/mustache',
           'backbone': '../../cdf/js-lib/backbone'
        },
        shim: {
//            'jquery': {exports: 'jQuery'}
        }
    });

    // Ask Require.js to load all test files and start test run
    require(tests, karma.start);

} ());
