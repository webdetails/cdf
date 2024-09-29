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


define('cdf/components/ccc/BaseCccComponent.ext', [
  'pentaho/shim/es6-promise'
], function(Promise){

  var getMatchingVizViewId = function (name, chartDefinition) {
    return name;
  };

  var getExtensionsPromise = function (name, applyVizApiStyles) {
    return Promise.resolve(null);
  };

  var getColors = function (type) {
    return ['dummy'];
  };

  return {
    getMatchingVizViewId: getMatchingVizViewId,
    getExtensionsPromise: getExtensionsPromise,
    getColors: getColors
  }

});
