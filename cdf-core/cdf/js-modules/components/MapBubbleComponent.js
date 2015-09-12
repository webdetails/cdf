/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

define(['./MapBaseComponent'], function(MapBaseComponent) {

  var MapBubbleComponent  = MapBaseComponent.extend({

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

  return MapBubbleComponent;
    
});
