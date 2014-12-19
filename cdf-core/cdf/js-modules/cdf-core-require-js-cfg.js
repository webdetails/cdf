/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

/**
 * Configuration file for cdf core
 */

(function() {

  var requirePaths = requireCfg.paths;

  requireCfg.urlArgs = "ts=" + (new Date()).getTime();

  var isDebug = typeof document == "undefined" || document.location.href.indexOf("debug=true") > 0;

  var prefix;
  if(typeof KARMA_RUN !== "undefined") { // test
    if(KARMA_RUN === "cdf") {
      prefix = requirePaths['cdf'] = 'cdf/js-modules';
    } else { // Run tests in the context of another plugin
      prefix = requirePaths['cdf'] = 'js-lib/expanded/pentaho-cdf/js';
    }
  } else if(typeof CONTEXT_PATH !== "undefined") { // production vs debug
    prefix = requirePaths['cdf'] = CONTEXT_PATH + 'api/repos/pentaho-cdf/js' + (isDebug ? '' : '/compressed');
  } else if(typeof FULLY_QUALIFIED_URL != "undefined") { // embedded production vs debug
    prefix = requirePaths['cdf'] = FULLY_QUALIFIED_URL + 'api/repos/pentaho-cdf/js' + (isDebug ? '' : '/compressed');
  } else { // build
    prefix = requirePaths['cdf'] = "cdf";
  }

  /*
   * Because CCC components are in a subfolder named "ccc", we need to set each component's path so the
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
  requirePaths['cdf/components/CccStackedDotChart'] = prefix + '/components/ccc/CccStackedDotChart';
  requirePaths['cdf/components/CccStackedLineChartComponent'] = prefix + '/components/ccc/CccStackedLineChartComponent';
  requirePaths['cdf/components/CccTreemapChartComponent'] = prefix + '/components/ccc/CccTreemapChartComponent';
  requirePaths['cdf/components/CccWaterfallChartComponent'] = prefix + '/components/ccc/CccWaterfallChartComponent';
  requirePaths['cdf/components/CccSunburstChartComponent'] = prefix + '/components/ccc/CccSunburstChartComponent';

})();
