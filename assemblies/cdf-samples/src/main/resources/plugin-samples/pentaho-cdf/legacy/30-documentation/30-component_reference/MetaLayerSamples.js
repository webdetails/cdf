/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



var evaluateCode = function(cleanComponents) {
  // Clean dashboard components or else they would be added
  if(cleanComponents) {
    Dashboards.components = [];
  }
  try {
    eval($('#samplecode').val());
  } catch(e) {
    Dashboards.log(e, 'exception');
    return;
  }
  tabs.tabs("option", "active", 0);
};
