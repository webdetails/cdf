/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

/*
 * Configuration file for cdf core
 */
(function() {

  var requirePaths = requireCfg.paths;

  var isDebug = typeof document == "undefined" || document.location.href.indexOf("debug=true") > 0;

  var prefix;
  if(typeof ENVIRONMENT_CONFIG !== "undefined" && ENVIRONMENT_CONFIG.paths !== "undefined" &&  ENVIRONMENT_CONFIG.paths["cdf"] !== "undefined") { // environment is configured, checking
    prefix = requirePaths['cdf'] = ENVIRONMENT_CONFIG.paths["cdf"];
  } else if(typeof KARMA_RUN !== "undefined") { // unit tests
    prefix = requirePaths['cdf'] = 'bin/test-js/cdf/js';
  } else if(typeof CONTEXT_PATH !== "undefined") { // production

    //if(!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster

    prefix = requirePaths['cdf'] = CONTEXT_PATH + 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '' : '/compressed');
  } else if(typeof FULL_QUALIFIED_URL != "undefined") { // embedded

    //if(!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster

    prefix = requirePaths['cdf'] = FULL_QUALIFIED_URL + 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '' : '/compressed');
  } else { // build
    prefix = requirePaths['cdf'] = "cdf/js";
  }

  /*
   * Because CCC components are in a subfolder named "ccc", we need to set each component path so the
   * same path prefix ("cdf/components") can be used. Avoid specific path preprocessing (e.g. CDE renderer).
   */
  requirePaths['cdf/components/BaseCccComponent'] = prefix + '/components/ccc/BaseCccComponent';
  requirePaths['cdf/components/CccAreaChartComponent'] = prefix + '/components/ccc/CccAreaChartComponent';
  requirePaths['cdf/components/CccBarChartComponent'] = prefix + '/components/ccc/CccBarChartComponent';
  requirePaths['cdf/components/CccBoxplotChartComponent'] = prefix + '/components/ccc/CccBoxplotChartComponent';
  requirePaths['cdf/components/CccBulletChartComponent'] = prefix + '/components/ccc/CccBulletChartComponent';
  requirePaths['cdf/components/CccDotChartComponent'] = prefix + '/components/ccc/CccDotChartComponent';
  requirePaths['cdf/components/CccHeatGridChartComponent'] = prefix + '/components/ccc/CccHeatGridChartComponent';
  requirePaths['cdf/components/CccLineChartComponent'] = prefix + '/components/ccc/CccLineChartComponent';
  requirePaths['cdf/components/CccMetricDotChartComponent'] = prefix + '/components/ccc/CccMetricDotChartComponent';
  requirePaths['cdf/components/CccMetricLineChartComponent'] = prefix + '/components/ccc/CccMetricLineChartComponent';
  requirePaths['cdf/components/CccNormalizedBarChartComponent'] = prefix + '/components/ccc/CccNormalizedBarChartComponent';
  requirePaths['cdf/components/CccParCoordComponent'] = prefix + '/components/ccc/CccParCoordComponent';
  requirePaths['cdf/components/CccPieChartComponent'] = prefix + '/components/ccc/CccPieChartComponent';
  requirePaths['cdf/components/CccStackedAreaChartComponent'] = prefix + '/components/ccc/CccStackedAreaChartComponent';
  requirePaths['cdf/components/CccStackedDotChartComponent'] = prefix + '/components/ccc/CccStackedDotChartComponent';
  requirePaths['cdf/components/CccStackedLineChartComponent'] = prefix + '/components/ccc/CccStackedLineChartComponent';
  requirePaths['cdf/components/CccTreemapChartComponent'] = prefix + '/components/ccc/CccTreemapChartComponent';
  requirePaths['cdf/components/CccWaterfallChartComponent'] = prefix + '/components/ccc/CccWaterfallChartComponent';
  requirePaths['cdf/components/CccSunburstChartComponent'] = prefix + '/components/ccc/CccSunburstChartComponent';

  /*
   * Filter component is in a subfolder of its own
   */

  requireCfg.map = requireCfg.map || {};
  requireCfg.map['*'] = requireCfg.map['*'] || {};
  requireCfg.map['*']['cdf/components/FilterComponent'] = 'cdf/components/filter/FilterComponent';



})();
