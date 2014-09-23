/*
 * requirejs configuration file used to build the cdf.js file
 */

({
  dir: "script-output",
  baseUrl: ".",
  optimize: "uglify2",
  optimizeCss: "none",
  appDir: "module-scripts",
  throwWhen: {
    //If there is an error calling the minifier for some JavaScript,
    //instead of just skipping that file throw an error.
    optimize: true
  },

  paths: {
    requireLib: 'require',
    'cdf/lib/Base': 'cdf/lib/base/Base'
  },

  mainConfigFile: 'requireCfg.js',

  uglify2: {
    output: {
      beautify: false,
      max_line_len: '1000'
    },
    compress: {
      sequences: false,
      global_defs: {
        DEBUG: false
      }
    },
    warnings: true,
    mangle: false
  },

  removeCombined: true,

  preserveLicenseComments: true,

  modules: [{
    name: "cdf",
    create: true,
    include: [
        'cdf/Dashboard'
    ]
  }]
})