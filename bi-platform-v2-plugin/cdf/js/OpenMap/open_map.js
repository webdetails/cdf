var map;
var slayer;
var layerMapnik;
var layerTah;
var center_point;
var markers;
var show_layer_control;
var popup;
var feature;
var marker;
var zoom_level;
var show_custom_map;
var custom_map_code;
var use_mercator;


/** 
    * Method: lonLatToMercator
    * Converts a LonLat Object using the Mercator formular
    *
    * Parameters:
    * ll - {<OpenLayers.LonLat>} the coordinate object.
    * 
    * Returns:
    * <OpenLayers.LonLat> the transformed coordinates
    */
function lonLatToMercator(ll) {
	var lon = ll.lon * 20037508.34 / 180;
	var lat = Math.log(Math.tan((90 + ll.lat) * Math.PI / 360)) / (Math.PI / 180);
	lat = lat * 20037508.34 / 180;
	return new OpenLayers.LonLat(lon, lat);
}


/** 
    * Method: init_map
    * Constructs sets some inital values and calls show_map.
    *
    * Parameters:
    * lon - {Float} The longitude coordinate.
    * lat - {Float} The latitude coordinate.
    * zoom - {Integer} Zoomlevel for initial display.
    * b_layer_control - {String} 'true' to show Layer selector
    * b_use_mercator - {String} 'true' to show custom map
    * b_custom_map - {String} 'true' to show custom map
    * str_custom_map - {String} custom map definition
    */
function init_map(div, lon, lat, zoom, b_use_mercator, b_layer_control, b_custom_map, str_custom_map){

	map_div = div; 
	//2010-08-18 Ingo
	//empty map div in case a map has added before
	//get the div Object
	oDiv = this.document.getElementById(map_div);
	oDiv.innerHTML="";
	
	center_lon = lon;
	center_lat = lat;
	show_layer_control = b_layer_control;
	zoom_level = zoom; 
	
	use_mercator = b_use_mercator;
	
	if(use_mercator == 'true'){
		center_point = lonLatToMercator(new OpenLayers.LonLat(lon,lat));
	}else{
		center_point = new OpenLayers.LonLat(lon,lat);
	}
	
	//2010-07-14 Custom map support
	show_custom_map = b_custom_map;
	custom_map_code = str_custom_map;
	
	show_map(zoom_level);
	

	
	if( b_layer_control == 'true'){
		show_layers();
	}
}


/** 
    * Method: show_map
    * Sets the inital layer and displays the map.
    */
function show_map (){
	if(show_custom_map == 'true'){
		eval(custom_map_code);	
	}else{
		//for now only one OpenStreetMap layer is supported
		map = new OpenLayers.Map(map_div, {maxExtent: new OpenLayers.Bounds(-20037508,-20037508,20037508,20037508),
                      numZoomLevels: 18,
                      maxResolution: 156543,
                      units: 'm',
                      projection: "EPSG:41001" });
		layer = new OpenLayers.Layer.TMS(
                "OpenStreetMap","http://tile.openstreetmap.org/",
	           {
				 type: 'png', getURL: osm_getTileURL, transparent: 'true',
	             displayOutsideMaxExtent: true}
	            );
    	// add the OpenStreetMap layer to the map          
		map.addLayer(layer);
    }


    // add a layer for the markers                                             
	markers = new OpenLayers.Layer.Markers( "Markers" );
	map.addLayer(markers);
	
	//set center and zoomlevel of the map
	map.setCenter(center_point, zoom_level);
	
	
}

/** 
    * Method: add_marker
    * Adds a new marker - Not implemented.
    */
function add_marker(point, icon){

	
}

/** 
    * Method: delete_marker
    * Deletes a marker - Not implemented.
    */
function delete_marker(old_marker){

}

/** 
    * Method: changee_marker
    * Change the marker Icon - Not implemented.
    */
function change_marker(old_marker, new_icon){

}


/** 
    * Method: show_bubble
    * Shows a popup bubble with the html content at the passed marker
    *
    * Parameters:
    * lon - {Float} The longitude coordinate.
    * lat - {Float} The latitude coordinate.
    * icon_color - {String} Color of the marker to display - red, green, yellow - default = blue
    * record - {Array} Data to be passed with the marker
    */
function show_bubble(lonlat, html){
	if (popup != null) {
	   markers.map.removePopup(popup);
	   popup.destroy();
	   popup = null;
    }
    
	feature = new OpenLayers.Feature(markers,lonlat);
	feature.popupClass = OpenLayers.Popup.FramedCloud;
	popup = feature.createPopup(true);
	popup.setContentHTML(html);
	markers.map.addPopup(popup);	
}


/** 
    * Method: show_position
    * Shows the mouse pointer coordinates when hovering over the map
    */
function show_positon(){
	map.addControl(new OpenLayers.Control.MousePosition());
}

/** 
    * Method: show_layers
    * Add the layer control to the map
   */
function show_layers(){
	map.addControl(new OpenLayers.Control.LayerSwitcher());
}

//function is needed to get the OpenStreetMap tiles
function osm_getTileURL(bounds) {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit) {
        return OpenLayers.Util.getImagesLocation() + "404.png";
    } else {
        x = ((x % limit) + limit) % limit;
        return this.url + z + "/" + x + "/" + y + "." + this.type;
    }
}



