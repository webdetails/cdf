/*!
 * Copyright 2002 - 2017 Webdetails, a Pentaho company. All rights reserved.
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

/**
 * Configuration file for cdf pentaho
 */

(function() {

  var isDebug = typeof document === "undefined" || document.location.href.indexOf("debug=true") > 0;

  if(typeof ENVIRONMENT_CONFIG !== "undefined" && ENVIRONMENT_CONFIG.paths !== "undefined" &&  ENVIRONMENT_CONFIG.paths["cdf"] !== "undefined") { // environment is configured, checking
    requireCfg.paths['cdf'] = ENVIRONMENT_CONFIG.paths["cdf"];
  } else if(typeof KARMA_RUN !== "undefined") { // unit tests
    requireCfg.paths['cdf'] = 'target/test-javascript/cdf';
  } else if(typeof CONTEXT_PATH !== "undefined") { // production
    //if(!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
    requireCfg.paths['cdf'] = CONTEXT_PATH + 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '' : '/compressed');
  } else if(typeof FULL_QUALIFIED_URL !== "undefined") { // embedded
    //if(!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
    requireCfg.paths['cdf'] = FULL_QUALIFIED_URL + 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '' : '/compressed');
  } else { // build
    requireCfg.paths['cdf'] = "cdf";
  }

  var requireTypes = requireCfg.config["pentaho/service"] || (requireCfg.config["pentaho/service"] = {});
  requireTypes["cdf/components/ccc/config/cdf.vizApi.conf"] = "pentaho.config.spec.IRuleSet";

})();



