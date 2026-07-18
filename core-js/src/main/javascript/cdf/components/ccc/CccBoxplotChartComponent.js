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



define([
  './BaseCccComponent',
  '../../lib/CCC/pvc'
], function(BaseCccComponent, pvc) {

  return BaseCccComponent.extend({
    cccType: pvc.BoxplotChart
  });

});
