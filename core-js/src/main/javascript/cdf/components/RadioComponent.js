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
