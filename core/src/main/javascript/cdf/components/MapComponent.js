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

  var MapComponent = MapBaseComponent.extend({
    initMap: true, // should this be static?
    update: function() {
      //2010-06-29 enable MapDiv parameter
      var div = 'map';
      if(this.mapDiv != null) {
        div = this.mapDiv;
      }

      //2010-06-29 Ingo: Enable/Disable Layer Selector
      var b_layer_control = true;
      var b_custom_map = false;
      var b_use_mercator = true;
      var str_custom_map = "";

      if(this.showLayerSelector == false) {
        b_layer_control = this.showLayerSelector;
      }

      //2010-07-14 Ingo: Enable custom Map code
      if(this.showCustomMap) {
        b_custom_map = 'true';
        str_custom_map = this.customMapCode;
      }

      //2010-07-15 Ingo: Enable Mercator switch (default = true)
      if(this.useMercator == false) {
        b_use_mercator = 'false';
        this.useMercator = 'false';
      }

      //2010-08-06 Ingo: Enable tool tips (default = false)
      if(this.showToolTip == true) {
        this.showToolTip = 'true';
      } else {
        this.showToolTip = 'false';
      }

      if(this.initMap) {
        this.init_map(
          div,
          this.initPosLon,
          this.initPosLat,
          this.initZoom,
          b_use_mercator,
          b_layer_control,
          b_custom_map,
          str_custom_map
        );

        this.initMap = false;
      }

      this.resetSearch();

      var p = new Array(this.parameters.length);
      for(var i = 0, len = p.length; i < len; i++) {
        var key = this.parameters[i][0];
        var value = this.dashboard.getParameterValue(this.parameters[i][1]);
        p[i] = [key, value];
      }

      var myArray = this.parseArray(
        this.dashboard.pentahoAction(this.solution, this.path, this.action, p, null),
        true);

      var len = myArray.length;
      if(len > 1) {
        var cols = myArray[0];
        var colslength = cols.length;

        var data = this.dashboard.getParameterValue('mapData') || new Array();

        for(var i = 1; i < len; i++) {
          // Get point details
          var details;
          if(colslength > 4) {
            details = new Array(colslength - 4);
            for(var j = 4; j < colslength; j++) {
              details[j - 4] = [cols[j], myArray[i][j]];
            }
          }

          var value = myArray[i][4];

          var markers = this.markers;
          // Store expression and markers for update function
          this.mapExpression = this.expression();
          this.mapMarkers = markers;

          var icon = eval(this.expression());

          data.push(
            new Array(
              myArray[i][0],
              new Array(myArray[i][1], myArray[i][2], myArray[i][3]),
              value,
              details,
              null,
              icon,
              null,
              null)
          );

          this.dashboard.setParameter('mapData', data);

          this.search();
        }
      }
    }
  });
  
  return MapComponent;
    
});
