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


define(['./BaseComponent'], function(BaseComponent) {

  return BaseComponent.extend({
    update: function() {
      this.customfunction(this.parameters || []);
    }
  });

});
