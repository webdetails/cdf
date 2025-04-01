/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


/**
 * Configuration file for cdf core
 */
(function() {

  /* globals ENVIRONMENT_CONFIG, CONTEXT_PATH, FULL_QUALIFIED_URL */

  requireCfg.map = requireCfg.map || {};
  requireCfg.map['*'] = requireCfg.map['*'] || {};

  var isDebug = typeof document === "undefined" || document.location.href.indexOf("debug=true") > 0;
  var isCdfPathDefined = typeof ENVIRONMENT_CONFIG !== "undefined" &&
                         typeof ENVIRONMENT_CONFIG.paths !== "undefined" &&
                         typeof ENVIRONMENT_CONFIG.paths["cdf"] !== "undefined";

  if (isCdfPathDefined) { // environment is configured, checking
    requireCfg.paths['cdf'] = ENVIRONMENT_CONFIG.paths["cdf"];

  } else if (typeof KARMA_RUN !== "undefined") { // unit tests
    requireCfg.paths['cdf'] = 'target/test-javascript/cdf/cdf';

  } else {
    var cdfResourcesPath = 'plugin/pentaho-cdf/api/resources/js' + (isDebug ? '' : '/compressed');

    if (typeof CONTEXT_PATH !== "undefined") { // production
      // if (!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
      requireCfg.paths['cdf'] = CONTEXT_PATH + cdfResourcesPath;

    } else if (typeof FULL_QUALIFIED_URL !== "undefined") { // embedded
      // if (!isDebug) { requireCfg.urlArgs = "ts=" + (new Date()).getTime(); } // enable cache buster
      requireCfg.paths['cdf'] = FULL_QUALIFIED_URL + cdfResourcesPath;

    } else { // build
      requireCfg.paths['cdf'] = "cdf";
    }
  }

  // Just reserving CDF's application identifier. Not to be used as a real AMD id right now.
  // Ideally, would be unified with "cdf", by mapping "cdf" to "pentaho/cdf", but there's no time to do this now.
  // The other way round, mapping "pentaho/cdf" to "cdf", is not viable,
  // as "cdf" would need to be passed directly to webcontext.js,
  // revealing the internal temporary implementation detail.
  requireCfg.paths['pentaho/cdf'] = "/";

  /**
   * Because some components are in subfolders, we need to map their module ids
   * so we are able to use the format {plugin}/components/{component_name}
   */
  [
    'BaseCccComponent',

    'CccAreaChartComponent',
    'CccBarChartComponent',
    'CccBoxplotChartComponent',
    'CccBulletChartComponent',
    'CccDotChartComponent',
    'CccHeatGridChartComponent',
    'CccLineChartComponent',
    'CccMetricDotChartComponent',
    'CccMetricLineChartComponent',
    'CccNormalizedBarChartComponent',
    'CccParCoordComponent',
    'CccPieChartComponent',
    'CccStackedAreaChartComponent',
    'CccStackedDotChartComponent',
    'CccStackedLineChartComponent',
    'CccTreemapChartComponent',
    'CccWaterfallChartComponent',
    'CccSunburstChartComponent'
  ].forEach(function(component) {
    requireCfg.map['*']['cdf/components/' + component] = 'cdf/components/ccc/' + component;
  });

  /**
   * Filter component is in a subfolder of its own
   */
  requireCfg.map['*']['cdf/components/FilterComponent'] = 'cdf/components/filter/FilterComponent';

})();
