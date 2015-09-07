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

define([
  './BaseComponent',
  '../lib/jquery',
  '../lib/OpenLayers',
  '../lib/OpenStreetMap'
], function(BaseComponent, $, OpenLayers) {

  var MapBaseComponent = BaseComponent.extend({

    //
    // From open_maps.js <-------
    //

    map: null,
    slayer: null,
    layerMapnik: null,
    layerTah: null,
    center_point: null,
    markers: null,
    show_layer_control: null,
    popup: null,
    feature: null,
    marker: null,
    zoom_level: null,
    show_custom_map: null,
    custom_map_code: null,
    use_mercator: false,

    /** 
     * Converts a LonLat Object using the Mercator formula.
     *
     * @method lonLatToMercator
     * @param {OpenLayers.LonLat} ll the coordinate object.
     * @return {OpenLayers.LonLat} the transformed coordinates
     */
    lonLatToMercator: function(ll) {
      var lon = ll.lon * 20037508.34 / 180;
      var lat = Math.log(Math.tan((90 + ll.lat) * Math.PI / 360)) / (Math.PI / 180);
      lat = lat * 20037508.34 / 180;
      return new OpenLayers.LonLat(lon, lat);
    },

    /** 
     * Constructs and sets some initial values and calls show_map.
     *
     * @method init_map
     * @param {String} div the id of the div that contains the map
     * @param {Float} lon The longitude coordinate.
     * @param {Float} lat The latitude coordinate.
     * @param {Integer} zoom  Zoom level for initial display.
     * @param {String} b_layer_control <tt>true</tt> to show Layer selector
     * @param {String} b_use_mercator <tt>true</tt> to show custom map
     * @param {String} b_custom_map <tt>true</tt> to show custom map
     * @param {String} str_custom_map Custom map definition
     */
    init_map: function(div, lon, lat, zoom, b_use_mercator, b_layer_control, b_custom_map, str_custom_map) {

      map_div = div; 
      //2010-08-18 Ingo
      //empty map div in case a map has added before
      //get the div Object
      oDiv = document.getElementById(map_div);

      if(!oDiv) { return; }
      oDiv.innerHTML = "";
      
      center_lon = lon;
      center_lat = lat;
      show_layer_control = b_layer_control;
      zoom_level = zoom; 
      
      use_mercator = b_use_mercator;
      
      if(use_mercator == 'true') {
        center_point = lonLatToMercator(new OpenLayers.LonLat(lon, lat));
      } else {
        center_point = new OpenLayers.LonLat(lon, lat);
      }
      
      //2010-07-14 Custom map support
      show_custom_map = b_custom_map;
      custom_map_code = str_custom_map;
      
      this.show_map(zoom_level);
      
      if(b_layer_control == 'true') {
        this.show_layers();
      }
    },

    /** 
     * Sets the inital layer and displays the map.
     *
     * @method show_map
     */
    show_map: function() {
      var map = this.map;

      if(show_custom_map == 'true') {
        eval(custom_map_code);  
      } else {
        //for now only one OpenStreetMap layer is supported
        map = new OpenLayers.Map(
          map_div,
          {
            maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508),
            numZoomLevels: 18,
            maxResolution: 156543,
            units: 'm',
            projection: "EPSG:41001"
          }
        );
        layer = new OpenLayers.Layer.TMS(
          "OpenStreetMap", "http://tile.openstreetmap.org/",
          {
            type: 'png',
            getURL: this.osm_getTileURL,
            transparent: 'true',
            displayOutsideMaxExtent: true
          }
        );
        // add the OpenStreetMap layer to the map
        map.addLayer(layer);
      }

      // add a layer for the markers
      markers = new OpenLayers.Layer.Markers("Markers");
      map.addLayer(markers);
      
      //set center and zoomlevel of the map
      map.setCenter(center_point, zoom_level);

      this.map = map;
    },

    /**
     * Adds a new marker - Not implemented.
     *
     * @method add_marker
     */
    add_marker: function(point, icon) {},

    /**
     * Deletes a marker - Not implemented.
     *
     * @method delete_marker
     */
    delete_marker: function(old_marker) {},

    /**
     * Change the marker Icon - Not implemented.
     *
     * @method change_marker
     */
    change_marker: function(old_marker, new_icon) {},

    /**
     * Shows a popup bubble with the html content provided
     *
     * @method show_bubble
     * @param {String} html the popup html content
     */
    show_bubble: function(html) {
      var popup = this.popup;

      if(popup != null) {
        markers.map.removePopup(popup);
        popup.destroy();
        popup = null;
      }

      var lonlat = this.dashboard.getParameterValue('mapLonLat');
        
      feature = new OpenLayers.Feature(markers, lonlat);
      feature.popupClass = OpenLayers.Popup.FramedCloud;
      popup = feature.createPopup(true);
      popup.setContentHTML(html);
      markers.map.addPopup(popup);

      this.popup = popup;
    },

    /**
     * Shows the mouse pointer coordinates when hovering over the map
     *
     * @method show_positon
     */
    show_positon: function() {
      this.map.addControl(new OpenLayers.Control.MousePosition());
    },

    /**
     * Add the layer control to the map
     *
     * @method show_layers
     */
    show_layers: function() {
      this.map.addControl(new OpenLayers.Control.LayerSwitcher());
    },

    //function is needed to get the OpenStreetMap tiles
    osm_getTileURL: function(bounds) {
      var res = this.map.getResolution();
      var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
      var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
      var z = this.map.getZoom();
      var limit = Math.pow(2, z);

      if(y < 0 || y >= limit) {
        return OpenLayers.Util.getImagesLocation() + "404.png";
      } else {
        x = ((x % limit) + limit) % limit;
        return this.url + z + "/" + x + "/" + y + "." + this.type;
      }
    },


    //
    // From maps.js Dashboards.Map  <-------
    //

    markers: null,
    //data: new Array(), use dashboard.getParameterValue|setParameter('mapData', ...)
    dataIdx: 0,
    messageElementId: null,
    selectedPointDetails: null,
    mapExpression: null,
    useMercator: 'true',
    showToolTip: 'true',
    ttips: null,
    //click_lonlat: null, use dashboard.getParameterValue|setParameter('mapLonLat', ...)

    search: function(object, idx) {

      var myself = object || this;

      //var record = myself.data[idx];
      //var place = record[1];

      var data = myself.dashboard.getParameterValue('mapData');

      var idx = idx || data.length - 1;
      var place = data[idx][1];

      var lat = place[0];
      var log = place[1];
      var placeDesc = place[2];
      //var featureClass = object.featureClass != undefined ? '&featureClass=' + object.featureClass : '';

      if(!(lat == '' || log == '')) {
        return myself.getLocation({
          totalResultsCount: 1,
          geonames: [{lat: lat, lng: log}]
        });
      }

      var url = 'http://nominatim.openstreetmap.org/search';
      var data = {
        format: 'json',
        limit: '1',
        q: placeDesc
      };
      var success = function(result) {
        var jData;
        if(result && result.length > 0) {
          jData = {
            totalResultsCount: result.length,
            geonames: [
              {
                lng: result[0].lon,
                lat: result[0].lat
              }
            ]
          };
        } else {
          jData = {
            totalResultsCount: 0,
            geonames: []
          };
        }
        myself.getLocation(jData);
      };
      $.getJSON(url, data, success);
    },

    resetSearch: function() {
      if(this.map) {
        this.map.removeLayer(markers);
        markers.destroy();

        markers = new OpenLayers.Layer.Markers("Markers");
        this.map.addLayer(markers);
      }
      this.cleanMessages();
      //dataIdx = 0;
      //this.data = new Array();
      this.dashboard.setParameter('mapData', new Array());
      this.dataIdx = 0;
    },

    // this function will be called by our JSON callback
    // the parameter jData will contain an array with geonames objects
    getLocation: function(jData) {

      var myself = this;

      //var record = myself.data[myself.dataIdx++];
      var data = myself.dashboard.getParameterValue('mapData');

      //use stored record if one already exists
      var record = data[myself.dataIdx];

      if(jData == null || jData.totalResultsCount == 0) {
        // There was a problem parsing search results
        var placeNotFound = record[0];
        myself.addMessage(placeNotFound);
      } else {

        var geoname = jData.geonames[0]; //we're specifically calling for just one
        //addMessage("Place: " + geoname.name);

        // Show address
        //var marker = show_address(geoname.lng, geoname.lat,"green",record);
        var marker = record[4];
        var icon = record[5];
        record[6] = geoname.lng;
        record[7] = geoname.lat;
        var marker = myself.showMarker(marker, record);
        record[4] = marker;

        //update mapData and dataIdx
        data[myself.dataIdx] = record;
        myself.dashboard.setParameter('mapData', data);
        myself.dataIdx++;
      }

      if(myself.dataIdx >= data.length && myself.dataIdx > 0) {
        var extent = markers.getDataExtent();
        myself.map.zoomToExtent(extent);
      }

      if(myself.dataIdx >= data.length && myself.dataIdx == 1) {
        myself.map.setCenter(markers.markers[0].lonlat, 4, false, false);
      }

    },

    showMarker: function(oldMarker, record) {

      var myself = this;

      //2010-06-29 - Ingo Klose
      // Adding support to set marker size
      var icon;
      var size;

      //create marker
      var lon = record[6];
      var lat = record[7];

      // Test if icon is an array
      // markers: [["js/OpenMap/OpenLayers/img/marker-green.png",42,50],["js/OpenMap/OpenLayers/img/marker-gold.png",21,25],["js/OpenMap/OpenLayers/img/marker.png",21,25]]
      if(record[5] instanceof Array) {
        var icon_array = record[5];
        icon = icon_array[0];
        size = new OpenLayers.Size(icon_array[1], icon_array[2])
      } else { // default behavior is backward compatible
        icon = record[5];
        size = new OpenLayers.Size(21, 25);
      }


      var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
      var iconObj = new OpenLayers.Icon(icon, size, offset);


      //2010-07-15 Ingo: enable Mercator switch
      if(myself.useMercator == 'true') {
        marker = new OpenLayers.Marker(myself.lonLatToMercator(new OpenLayers.LonLat(lon, lat)), iconObj);

        //create a feature to bind marker and record array together
        feature = new OpenLayers.Feature(markers, myself.lonLatToMercator(new OpenLayers.LonLat(lon, lat)), record);
      } else {
        marker = new OpenLayers.Marker(new OpenLayers.LonLat(lon, lat), iconObj);
        feature = new OpenLayers.Feature(markers, new OpenLayers.LonLat(lon, lat), record);
      }

      feature.marker = marker;

      //create mouse down event for marker, set function to marker_click
      marker.events.register('mousedown', feature, function(evt) {
        //myself.click_lonlat = this.lonlat;
        myself.dashboard.setParameter('mapLonLat', this.lonlat);
        // Hide tooltips when marker is clicked
        if(myself.showToolTip == 'true') {
          myself.ttips.hide();
        }
        myself.dashboard.fireChange("selectedPoint", this.data[0]);
      });

      //2010-08-06 Ingo: enable tool tips
      if(myself.showToolTip == 'true') {
        //create mouse events for tool tips
        marker.events.register('mouseover', feature, function(evt) {
          //var data = myself.dashboard.getParameterValue('mapData');
          myself.ttips.show({html: this.data[0] + ': ' + this.data[2]});
        });
        marker.events.register('mouseout', feature, function(evt) {
          myself.ttips.hide();
        });

        myself.ttips = new OpenLayers.Control.ToolTips({bgColor: "black", textColor: "white", bold: true, opacity: 0.50});
        myself.map.addControl(myself.ttips);
      }

      //add marker to map
      markers.addMarker(marker);

      return marker;
    },

    updateInfoWindow: function(content) {
      if(content != null) {
        //var html = $(content).text();
        /*"<table border='0' height = '175' width='175' cellpadding='0' cellspacing='0'><tr><td colspan='1' align='center' width='55'><b>";
         html += "<b>" + this.selectedPointDetails[0][1];
         html += "</b></td></tr><tr><td colspan='1' align='center' width='175'>"+content+"</td></tr></table>";*/
        this.show_bubble($(content).text());
      }
    },

    updateMap: function() {
      var data = this.dashboard.getParameterValue('mapData'),
          L = data.length,
          idx;

      for(idx = 0; idx < L; idx++) {
        var value = data[idx][2];
        var markers = this.mapMarkers;
        var icon = eval(this.mapExpression);
        var marker = data[idx][4];
        data[idx][5] = icon;
        data[idx][4] = this.showMarker(marker, data[idx]);
      }
    },


    addMessage: function(msg) {
      var msgElId = this.messageElementId;

      if(msgElId != undefined) {
        document
          .getElementById(msgElId)
          .innerHTML = document.getElementById(msgElId).innerHTML + msg + "\n <br />";
      }
    },

    cleanMessages: function(msg) {
      var msgElId = this.messageElementId;

      if(msgElId != undefined && el) {
        var el = document.getElementById(msgElId);
        if(el) {
          el.innerHTML = "";
        }
      }
    }

  });

  return MapBaseComponent;

});
