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


/**
 * Configuration file for cdf pentaho
 */
(function() {

  /* globals ENVIRONMENT_CONFIG, CONTEXT_PATH, FULL_QUALIFIED_URL */

  var isDebug = typeof document === "undefined" || document.location.href.indexOf("debug=true") > 0;
  var isCdfPathDefined = typeof ENVIRONMENT_CONFIG !== "undefined" &&
                         typeof ENVIRONMENT_CONFIG.paths !== "undefined" &&
                         typeof ENVIRONMENT_CONFIG.paths["cdf"] !== "undefined";

  if (isCdfPathDefined) { // environment is configured, checking
    requireCfg.paths['cdf'] = ENVIRONMENT_CONFIG.paths["cdf"];

  } else if (typeof KARMA_RUN !== "undefined") { // unit tests
    requireCfg.paths['cdf'] = 'target/test-javascript/cdf';

  } else {
    var cdfResourcesPath = 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '' : '/compressed');

    if (typeof CONTEXT_PATH !== "undefined") { // production
      //if(!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
      requireCfg.paths['cdf'] = CONTEXT_PATH + cdfResourcesPath;

    } else if (typeof FULL_QUALIFIED_URL !== "undefined") { // embedded
      //if(!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
      requireCfg.paths['cdf'] = FULL_QUALIFIED_URL + cdfResourcesPath;

    } else { // build
      requireCfg.paths['cdf'] = "cdf";

    }
  }

})();
