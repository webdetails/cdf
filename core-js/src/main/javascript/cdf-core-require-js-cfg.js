/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
 * Configuration file for cdf core
 */
(function() {

  requireCfg.map = requireCfg.map || {};
  requireCfg.map['*'] = requireCfg.map['*'] || {};

  var isDebug = typeof document === "undefined" || document.location.href.indexOf("debug=true") > 0;

  if(typeof ENVIRONMENT_CONFIG !== "undefined" &&
     typeof ENVIRONMENT_CONFIG.paths !== "undefined" &&
     typeof ENVIRONMENT_CONFIG.paths["cdf"] !== "undefined") { // environment is configured, checking
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

  /**
   * Because some components are in subfolders, we need to map their module ids so we are able to use the format {plugin}/componentes/{component_name}
   */
  requireCfg.map['*']['cdf/components/BaseCccComponent'] = 'cdf/components/ccc/BaseCccComponent';
  requireCfg.map['*']['cdf/components/CccAreaChartComponent'] = 'cdf/components/ccc/CccAreaChartComponent';
  requireCfg.map['*']['cdf/components/CccBarChartComponent'] = 'cdf/components/ccc/CccBarChartComponent';
  requireCfg.map['*']['cdf/components/CccBoxplotChartComponent'] = 'cdf/components/ccc/CccBoxplotChartComponent';
  requireCfg.map['*']['cdf/components/CccBulletChartComponent'] = 'cdf/components/ccc/CccBulletChartComponent';
  requireCfg.map['*']['cdf/components/CccDotChartComponent'] = 'cdf/components/ccc/CccDotChartComponent';
  requireCfg.map['*']['cdf/components/CccHeatGridChartComponent'] = 'cdf/components/ccc/CccHeatGridChartComponent';
  requireCfg.map['*']['cdf/components/CccLineChartComponent'] = 'cdf/components/ccc/CccLineChartComponent';
  requireCfg.map['*']['cdf/components/CccMetricDotChartComponent'] = 'cdf/components/ccc/CccMetricDotChartComponent';
  requireCfg.map['*']['cdf/components/CccMetricLineChartComponent'] = 'cdf/components/ccc/CccMetricLineChartComponent';
  requireCfg.map['*']['cdf/components/CccNormalizedBarChartComponent'] = 'cdf/components/ccc/CccNormalizedBarChartComponent';
  requireCfg.map['*']['cdf/components/CccParCoordComponent'] = 'cdf/components/ccc/CccParCoordComponent';
  requireCfg.map['*']['cdf/components/CccPieChartComponent'] = 'cdf/components/ccc/CccPieChartComponent';
  requireCfg.map['*']['cdf/components/CccStackedAreaChartComponent'] = 'cdf/components/ccc/CccStackedAreaChartComponent';
  requireCfg.map['*']['cdf/components/CccStackedDotChartComponent'] = 'cdf/components/ccc/CccStackedDotChartComponent';
  requireCfg.map['*']['cdf/components/CccStackedLineChartComponent'] = 'cdf/components/ccc/CccStackedLineChartComponent';
  requireCfg.map['*']['cdf/components/CccTreemapChartComponent'] = 'cdf/components/ccc/CccTreemapChartComponent';
  requireCfg.map['*']['cdf/components/CccWaterfallChartComponent'] = 'cdf/components/ccc/CccWaterfallChartComponent';
  requireCfg.map['*']['cdf/components/CccSunburstChartComponent'] = 'cdf/components/ccc/CccSunburstChartComponent';
  /**
   * Filter component is in a subfolder of its own
   */
  requireCfg.map['*']['cdf/components/FilterComponent'] = 'cdf/components/filter/FilterComponent';

})();
