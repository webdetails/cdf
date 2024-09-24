var webAppPath = "dummy";

requireCfg = {
  paths: {},
  shim: {},
  config: {}
};

// Backup. `requirejs` is already defined.
var definejs = define;

// Force libs to not load as requirejs modules
define  = undefined;
require = undefined;
