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
  './ToggleButtonBaseComponent',
  '../lib/jquery'
], function(ToggleButtonBaseComponent, $) {

  return ToggleButtonBaseComponent.extend({
    getValue: function() {
      if(this.currentVal != 'undefined' && this.currentVal != null) {
        return this.currentVal;
      } else {
        return this.placeholder("." + this.name + ":checked").val();
      }
    }
  });

});
