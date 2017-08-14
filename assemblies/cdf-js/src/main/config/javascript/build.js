/*
 * requirejs configuration file used to build the compiled/minified CDF js files.
 * Based on https://github.com/jrburke/r.js/blob/master/build/example.build.js
 */

({
  //The directory path to save the output. All relative paths are relative to the build file.
  dir: "${project.build.directory}/build-javascript/cdf",

  //As of RequireJS 2.0.2, the dir above will be deleted before the
  //build starts again. If you have a big build and are not doing
  //source transforms with onBuildRead/onBuildWrite, then you can
  //set keepBuildDir to true to keep the previous dir. This allows for
  //faster rebuilds, but it could lead to unexpected errors if the
  //built code is transformed in some way.
  keepBuildDir: false,

  //By default, all modules are located relative to this path. If appDir is set, then
  //baseUrl should be specified as relative to the appDir.
  baseUrl: ".",

  //How to optimize all the JS files in the build output directory.
  optimize: "uglify2",

  //Allow CSS optimizations. Allowed values:
  //- "standard": @import inlining and removal of comments, unnecessary
  //whitespace and line returns.
  //Removing line returns may have problems in IE, depending on the type
  //of CSS.
  //- "standard.keepLines": like "standard" but keeps line returns.
  //- "none": skip CSS optimizations.
  //- "standard.keepComments": keeps the file comments, but removes line
  //returns.  (r.js 1.0.8+)
  //- "standard.keepComments.keepLines": keeps the file comments and line
  //returns. (r.js 1.0.8+)
  //- "standard.keepWhitespace": like "standard" but keeps unnecessary whitespace.
  optimizeCss: "standard",

  //The top level directory that contains your app. If this option is used
  //then it assumed your scripts are in a subdirectory under this path.
  //If this option is specified, then all the files from the app directory
  //will be copied to the dir: output area, and baseUrl will assume to be
  //a relative path under this directory.
  appDir: "${project.build.directory}/src-javascript",

  //Introduced in 2.1.3: Some situations do not throw and stop the optimizer
  //when an error occurs. However, you may want to have the optimizer stop
  //on certain kinds of errors and you can configure those situations via
  //this option
  throwWhen: {
    //If there is an error calling the minifier for some JavaScript,
    //instead of just skipping that file throw an error.
    optimize: true
  },

  //Set paths for modules. If relative paths, set relative to baseUrl above.
  //If a special value of "empty:" is used for the path value, then that
  //acts like mapping the path to an empty file. It allows the optimizer to
  //resolve the dependency to path, but then does not include it in the output.
  //Useful to map module names that are to resources on a CDN or other
  //http: URL when running in the browser and during an optimization that
  //file should be skipped because it has no dependencies.
  paths: {
    'requireLib': 'require',
    'common-ui/util/URLEncoder': 'empty:'
  },

  //By default all the configuration for optimization happens from the command
  //line or by properties in the config file, and configuration that was
  //passed to requirejs as part of the app's runtime "main" JS file is *not*
  //considered. However, if you prefer the "main" JS file configuration
  //to be read for the build so that you do not have to duplicate the values
  //in a separate configuration, set this property to the location of that
  //main JS file. The first requirejs({}), require({}), requirejs.config({}),
  //or require.config({}) call found in that file will be used.
  //As of 2.1.10, mainConfigFile can be an array of values, with the last
  //value's config take precedence over previous values in the array.
  mainConfigFile: "${project.build.directory}/requireCfg.js",

  //If using UglifyJS2 for script optimization, these config options can be
  //used to pass configuration values to UglifyJS2.
  //For possible `output` values see:
  //https://github.com/mishoo/UglifyJS2#beautifier-options
  //For possible `compress` values see:
  //https://github.com/mishoo/UglifyJS2#compressor-options
  uglify2: {
    output: {
      max_line_len: 80,
      beautify: false
    },
    warnings: false,
    mangle: true
  },

  //If set to true, any files that were combined into a build bundle will be
  //removed from the output folder.
  removeCombined: true,

  //By default, comments that have a license in them are preserved in the
  //output when a minifier is used in the "optimize" option.
  //However, for a larger built files there could be a lot of
  //comment files that may be better served by having a smaller comment
  //at the top of the file that points to the list of all the licenses.
  //This option will turn off the auto-preservation, but you will need
  //work out how best to surface the license information.
  //NOTE: As of 2.1.7, if using xpcshell to run the optimizer, it cannot
  //parse out comments since its native Reflect parser is used, and does
  //not have the same comments option support as esprima.
  preserveLicenseComments: false,

  //Introduced in 2.1.2 and considered experimental.
  //If the minifier specified in the "optimize" option supports generating
  //source maps for the minified code, then generate them. The source maps
  //generated only translate minified JS to non-minified JS, it does not do
  //anything magical for translating minified JS to transpiled source code.
  //Currently only optimize: "uglify2" is supported when running in node or
  //rhino, and if running in rhino, "closure" with a closure compiler jar
  //build after r1592 (20111114 release).
  //The source files will show up in a browser developer tool that supports
  //source maps as ".js.src" files.
  generateSourceMaps: false,

  //If you only intend to optimize a module (and its dependencies), with
  //a single file as the output, you can specify the module options inline,
  //instead of using the 'modules' section. 'exclude',
  //'excludeShallow', 'include' and 'insertRequire' are all allowed as siblings
  //to name. The name of the optimized file is specified by 'out'.
  exclude: [
    //According to https://github.com/guybedford/require-css#basic-usage
    'cdf/lib/require-css/normalize'
  ],

  //Introduced in 2.1.3: Seed raw text contents for the listed module IDs.
  //These text contents will be used instead of doing a file IO call for
  //those modules. Useful if some module ID contents are dynamically
  //based on user input, which is common in web build tools.
  //rawText: {},

  //Sets up a map of module IDs to other module IDs. For more details, see
  //the http://requirejs.org/docs/api.html#config-map docs.
  //map: {},

  //List the modules that will be optimized. All their immediate and deep
  //dependencies will be included in the module's file when the build is
  //done. If that module or any of its dependencies includes i18n bundles,
  //only the root bundles will be included unless the locale: section is set above.
  modules: [
    //Just specifying a module name means that module will be converted into
    //a built file that contains all of its dependencies. If that module or any
    //of its dependencies includes i18n bundles, they may not be included in the
    //built file unless the locale: section is set above.
    {
      name: "cdf/Dashboard.Blueprint",
      //create: true can be used to create the module layer at the given
      //name, if it does not already exist in the source location. If
      //there is a module at the source location with this name, then
      //create: true is superfluous.
      //create: true,

      //Also combines all the dependencies of the modules listed below
      //and any of their dependencies into one file.
      include: [
        'cdf/Dashboard',

        'cdf/dashboard/Container',
        'cdf/dashboard/Dashboard.addIns',
        'cdf/dashboard/Dashboard.bookmarkable',
        'cdf/dashboard/Dashboard.components',
        'cdf/dashboard/Dashboard.context',
        'cdf/dashboard/Dashboard.i18n',
        'cdf/dashboard/Dashboard',
        'cdf/dashboard/Dashboard.legacy',
        'cdf/dashboard/Dashboard.lifecycle',
        'cdf/dashboard/Dashboard.notifications',
        'cdf/dashboard/Dashboard.parameters',
        'cdf/dashboard/Dashboard.dataSources',
        'cdf/dashboard/Dashboard.query',
        'cdf/dashboard/Dashboard.storage',
        'cdf/dashboard/Dashboard.views',
        'cdf/dashboard/OptionsManager',
        'cdf/dashboard/Popups',
        'cdf/dashboard/Query',
        'cdf/dashboard/RefreshEngine',

        'cdf/Logger',

        "cdf/queries/BaseQuery",
        "cdf/queries/CdaQuery",
        "cdf/queries/CpkQuery",
        "cdf/queries/XmlaQuery"
      ],

      //Exclude the modules listed bellow and their dependencies from the built file. If you want
      //to exclude a module that is also another module being optimized, it is more
      //efficient if you define that module optimization entry before using it
      exclude: [
        // CSSs
        'css!cdf/Dashboard',
        "css!cdf/OlapUtils",
        'css!cdf/lib/blueprint/screen',
        "css!cdf/lib/impromptu/jquery-impromptu",
        "css!cdf/lib/theme/cupertino/jquery-ui-1.10.4.custom",
        "css!cdf/components/TableComponent",
        "css!cdf/components/MultiButtonComponent",
        "css!cdf/dashboard/Dashboard.legacy",
        "css!cdf/dashboard/Dashboard.notifications",
        "css!cdf/dashboard/Popups",

        //exclude core included jquery libs otherwise we will not be able to use them without load issues
        'cdf/lib/jquery',
        'amd!cdf/lib/jquery.ui',
        'amd!cdf/lib/jquery.blockUI',
        'amd!cdf/lib/jquery.impromptu',
        'amd!cdf/lib/jquery.i18n',
        'cdf/lib/Base',
        "amd!cdf/lib/underscore",
        "amd!cdf/lib/backbone",
        "cdf/lib/shims",
        "amd!cdf/lib/queryParser",
        "cdf/lib/mustache",
        "cdf/lib/cdf.jquery.i18n",
        "cdf/lib/base64",

        //files that need to be accessible to other AMD modules (e.g. addIns)
        "cdf/components/BaseComponent",
        "cdf/components/UnmanagedComponent",
        "cdf/dashboard/Sprintf",
        "cdf/dashboard/Utils",
        "cdf/dashboard/Utf8Encoder",

        // Extensions might need to be accessed from a context other than Dashboard.Blueprint
        "cdf/components/XactionComponent.ext",
        "cdf/dashboard/Dashboard.ext",
        "cdf/dashboard/Dashboard.context.ext",
        "cdf/dashboard/Dashboard.notifications.ext",
        "cdf/dashboard/Dashboard.storage.ext",
        "cdf/dashboard/Dashboard.views.ext",
        "cdf/queries/CdaQuery.ext",
        "cdf/queries/XmlaQuery.ext"
      ]
    },
    {
      name: "cdf/Dashboard.Bootstrap",

      //Also combines all the dependencies of the modules listed below
      //and any of their dependencies into one file.
      include: [
        'cdf/Dashboard',

        'cdf/dashboard/Container',
        'cdf/dashboard/Dashboard.addIns',
        'cdf/dashboard/Dashboard.bookmarkable',
        'cdf/dashboard/Dashboard.components',
        'cdf/dashboard/Dashboard.context',
        'cdf/dashboard/Dashboard.i18n',
        'cdf/dashboard/Dashboard',
        'cdf/dashboard/Dashboard.legacy',
        'cdf/dashboard/Dashboard.lifecycle',
        'cdf/dashboard/Dashboard.notifications',
        'cdf/dashboard/Dashboard.parameters',
        'cdf/dashboard/Dashboard.dataSources',
        'cdf/dashboard/Dashboard.query',
        'cdf/dashboard/Dashboard.storage',
        'cdf/dashboard/Dashboard.views',
        'cdf/dashboard/OptionsManager',
        'cdf/dashboard/Popups',
        'cdf/dashboard/Query',
        'cdf/dashboard/RefreshEngine',

        'cdf/Logger',

        "cdf/queries/BaseQuery",
        "cdf/queries/CdaQuery",
        "cdf/queries/CpkQuery",
        "cdf/queries/XmlaQuery"
      ],

      //Exclude the modules listed bellow and their dependencies from the built file. If you want
      //to exclude a module that is also another module being optimized, it is more
      //efficient if you define that module optimization entry before using it
      exclude: [
        // CSSs
        "css!cdf/Dashboard",
        "css!cdf/OlapUtils",
        "css!cdf/lib/Bootstrap/css/bootstrap",
        "css!cdf/lib/font-awesome/css/font-awesome",
        "css!cdf/lib/impromptu/jquery-impromptu",
        "css!cdf/lib/theme/cupertino/jquery-ui-1.10.4.custom",
        "css!cdf/components/MultiButtonComponent",
        "css!cdf/components/TableComponent",
        "css!cdf/dashboard/Dashboard.legacy",
        "css!cdf/dashboard/Dashboard.notifications",
        "css!cdf/dashboard/Popups",

        //exclude core included jquery libs otherwise we will not be able to use them without load issues
        "cdf/lib/jquery",
        "amd!cdf/lib/jquery.ui",
        "amd!cdf/lib/jquery.blockUI",
        "amd!cdf/lib/jquery.impromptu",
        "amd!cdf/lib/jquery.i18n",
        "cdf/lib/Base",
        "amd!cdf/lib/underscore",
        "amd!cdf/lib/backbone",
        "cdf/lib/shims",
        "amd!cdf/lib/queryParser",
        "cdf/lib/mustache",
        "cdf/lib/cdf.jquery.i18n",
        "cdf/lib/base64",

        "cdf/lib/bootstrap",
        "cdf/lib/html5shiv",
        "cdf/lib/respond",

        //files that need to be accessible to other AMD modules (e.g. addIns)
        "cdf/components/BaseComponent",
        "cdf/components/UnmanagedComponent",
        "cdf/dashboard/Sprintf",
        "cdf/dashboard/Utils",
        "cdf/dashboard/Utf8Encoder",

        // Extensions might need to be accessed from a context other than Dashboard.Bootstrap
        "cdf/dashboard/Dashboard.ext",
        "cdf/components/XactionComponent.ext",
        "cdf/dashboard/Dashboard.ext",
        "cdf/dashboard/Dashboard.context.ext",
        "cdf/dashboard/Dashboard.notifications.ext",
        "cdf/dashboard/Dashboard.storage.ext",
        "cdf/dashboard/Dashboard.views.ext",
        "cdf/queries/CdaQuery.ext",
        "cdf/queries/XmlaQuery.ext"
      ]
    },
    {
      name: "cdf/Dashboard.Clean",
      //create: true can be used to create the module layer at the given
      //name, if it does not already exist in the source location. If
      //there is a module at the source location with this name, then
      //create: true is superfluous.
      //create: true,

      //Also combines all the dependencies of the modules listed below
      //and any of their dependencies into one file.
      include: [
        'cdf/Dashboard',

        'cdf/dashboard/Container',
        'cdf/dashboard/Dashboard.addIns',
        'cdf/dashboard/Dashboard.bookmarkable',
        'cdf/dashboard/Dashboard.components',
        'cdf/dashboard/Dashboard.context',
        'cdf/dashboard/Dashboard.i18n',
        'cdf/dashboard/Dashboard',
        'cdf/dashboard/Dashboard.legacy',
        'cdf/dashboard/Dashboard.lifecycle',
        'cdf/dashboard/Dashboard.notifications',
        'cdf/dashboard/Dashboard.parameters',
        'cdf/dashboard/Dashboard.dataSources',
        'cdf/dashboard/Dashboard.query',
        'cdf/dashboard/Dashboard.storage',
        'cdf/dashboard/Dashboard.views',
        'cdf/dashboard/OptionsManager',
        'cdf/dashboard/Popups',
        'cdf/dashboard/Query',
        'cdf/dashboard/RefreshEngine',

        'cdf/Logger',

        "cdf/queries/BaseQuery",
        "cdf/queries/CdaQuery",
        "cdf/queries/CpkQuery",
        "cdf/queries/XmlaQuery"
      ],

      //Exclude the modules listed bellow and their dependencies from the built file. If you want
      //to exclude a module that is also another module being optimized, it is more
      //efficient if you define that module optimization entry before using it
      exclude: [
        // CSSs
        'css!cdf/Dashboard',
        "css!cdf/OlapUtils",
        "css!cdf/lib/impromptu/jquery-impromptu",
        "css!cdf/components/MultiButtonComponent",
        "css!cdf/components/TableComponent",
        "css!cdf/dashboard/Dashboard.legacy",
        "css!cdf/dashboard/Dashboard.notifications",
        "css!cdf/dashboard/Popups",

        //exclude core included jquery libs otherwise we will not be able to use them without load issues
        'cdf/lib/jquery',
        'amd!cdf/lib/jquery.ui',
        'amd!cdf/lib/jquery.blockUI',
        'amd!cdf/lib/jquery.impromptu',
        'amd!cdf/lib/jquery.i18n',
        'cdf/lib/Base',
        "amd!cdf/lib/underscore",
        "amd!cdf/lib/backbone",
        "cdf/lib/shims",
        "amd!cdf/lib/queryParser",
        "cdf/lib/mustache",
        "cdf/lib/cdf.jquery.i18n",
        "cdf/lib/base64",

        //files that need to be accessible to other AMD modules (e.g. addIns)
        "cdf/components/BaseComponent",
        "cdf/components/UnmanagedComponent",
        "cdf/dashboard/Sprintf",
        "cdf/dashboard/Utils",
        "cdf/dashboard/Utf8Encoder",

        // Extensions might need to be accessed from a context other than Dashboard.Clean
        "cdf/components/XactionComponent.ext",
        "cdf/dashboard/Dashboard.ext",
        "cdf/dashboard/Dashboard.context.ext",
        "cdf/dashboard/Dashboard.notifications.ext",
        "cdf/dashboard/Dashboard.storage.ext",
        "cdf/dashboard/Dashboard.views.ext",
        "cdf/queries/CdaQuery.ext",
        "cdf/queries/XmlaQuery.ext",

        // Exclude css files

      ]
    }
  ]
})
