/*
 * requirejs configuration file used to build the cdf.js file
 */

({
  dir: "../bin/scriptOutput",
  baseUrl: ".",
  optimize: "uglify2",
  optimizeCss: "standard",
  appDir: "module-scripts",
  throwWhen: {
    //If there is an error calling the minifier for some JavaScript,
    //instead of just skipping that file throw an error.
    optimize: true
  },

  paths: {
    requireLib: 'require',
    'common-ui': '../../js-lib/expanded/common-ui',
    'dojo': '../../js-lib/expanded/common-ui/dojo/dojo'
  },

  mainConfigFile: 'requireCfg.js',

  uglify2: {
    output: {
      max_line_len: 80,
      beautify: false
    },
    warnings: true,
    mangle: true
  },

  siteRoot: 'cdf',

  buildCSS: true,

  removeCombined: true,

  preserveLicenseComments: false,

  generateSourceMaps: true,

  separateCSS: true,

  modules: [{
    name: "cdf/Dashboard",
    create: true,
    include: [
      'cdf/Dashboard'
    ],
    exclude: [
        'cdf/cdf-core-require-js-cfg',
        'cdf/lib/cdf-core-lib-require-js-cfg',
        'cdf/lib/require-css/normalize', // according to https://github.com/guybedford/require-css#basic-usage
        'css!cdf/Dashboard'
    ]
  }]
})