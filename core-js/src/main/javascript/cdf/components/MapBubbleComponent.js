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


define(['./MapBaseComponent'], function(MapBaseComponent) {

  return MapBaseComponent.extend({

    update: function() {
      this.selectedPointDetails = null;
      var data = this.dashboard.getParameterValue('mapData');

      // when karma testing there is no div with appropriate id, so for now return
      if(!data){ return; }

      var L = data.length;
      for(var i = 0; i < L; i++) {
        if(this.dashboard.getParameterValue("selectedPoint") == data[i][0]) {
          this.selectedPointDetails = data[i][3];
          break;
        }
      }

      // when karma testing there is no div with appropriate id, so for now return
      if(!this.selectedPointDetails){ return; }

      this.updateInfoWindow(this.dashboard.pentahoAction(this.solution, this.path, this.action, this.selectedPointDetails, null));
    }
  });
    
});
