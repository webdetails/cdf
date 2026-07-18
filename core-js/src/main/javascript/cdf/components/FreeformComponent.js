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
  './UnmanagedComponent',
  'amd!../lib/underscore'
], function(UnmanagedComponent, _) {

  return UnmanagedComponent.extend({
  
    update: function() {
      var render = _.bind(this.render, this);
      if(typeof this.manageCallee == "undefined" || this.manageCallee) {
        this.synchronous(render);
      } else {
        render();
      }
    },
  
    render: function() {
      var parameters = this.parameters || [];
      this.customfunction(parameters);
    }
  });

});
