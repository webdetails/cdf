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

define([
  './BaseCccComponent',
  '../../lib/CCC/pvc'
], function(BaseCccComponent, pvc) {

  return BaseCccComponent.extend({
    cccType: pvc.BoxplotChart
  });

});
