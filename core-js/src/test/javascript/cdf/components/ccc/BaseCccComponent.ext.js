/*!
 * Copyright 2017 Webdetails, a Pentaho company. All rights reserved.
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

define('cdf/components/ccc/BaseCccComponent.ext', [
  'pentaho/shim/es6-promise'
], function(Promise){ 

  var getVizDigestedName = function (name, chartDefinition) {
    return name;
  };

  var isValidVisualization = function (name) {
    return true;
  };

  var getExtensionsPromise = function (name, applyVizApiStyles) {
    return Promise.resolve(null);
  }
  
  var getColors = function (type) {
    return ['dummy'];
  }

  return {
    getVizDigestedName: getVizDigestedName,
    isValidVisualization: isValidVisualization,
    getExtensionsPromise: getExtensionsPromise,
    getColors: getColors
  }

});
