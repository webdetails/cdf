var DashboardsMap = 
	{

		markers: null,
		data : new Array(),
		dataIdx: 0,
		messageElementId: null,
		selectedPointDetails: null,
		mapExpression: null,
		useMercator:'true',
		showToolTip:'false',

		search: function (object,idx) {

			var record = this.data[idx];
			var place = record[1];

			var lat = place[0];
			var log = place[1];
			var placeDesc = place[2];
			var featureClass = object.featureClass != undefined ? '&featureClass=' + object.featureClass : '';

			//request = 'http://ws.geonames.org/searchJSON?q=' +  encodeURIComponent(place)  + ',Portugal&maxRows=1&featureClass=P&coutry=PT&callback=getLocation';
			if(lat == '' || log == '')
			{
				placeDesc = placeDesc.replace(/&/g,",");
				request = 'http://ws.geonames.org/searchJSON?q=' +  encodeURIComponent(placeDesc)  + '&maxRows=1' + featureClass + '&callback=DashboardsMap.getLocation';
			}
			else
				return DashboardsMap.getLocation({totalResultsCount:1, geonames: [{lat:lat,lng:log}]});


			// Create a new script object
			// (implementation of this class is in /export/jsr_class.js)
			aObj = new JSONscriptRequest(request);
			// Build the script tag
			aObj.buildScriptTag();
			// Execute (add) the script tag
			aObj.addScriptTag();
		},

		resetSearch: function (){
			map.removeLayer(markers);
			markers.destroy();

			markers = new OpenLayers.Layer.Markers( "Markers" );
			map.addLayer(markers);

			this.cleanMessages();
			dataIdx = 0;
			this.data = new Array();
		},

		// this function will be called by our JSON callback
		// the parameter jData will contain an array with geonames objects
		getLocation: function (jData) {

			var record = this.data[dataIdx++];

			if (jData == null || jData.totalResultsCount == 0) {
				// There was a problem parsing search results
				var placeNotFound = record[0];
				this.addMessage(placeNotFound);
			}
			else{

				var geoname = jData.geonames[0]; //we're specifically calling for just one
				//addMessage("Place: " + geoname.name);

				// Show address
				//var marker = show_address(geoname.lng, geoname.lat,"green",record);
				var marker = record[4];
				var icon = record[5];
				record[6] = geoname.lng;
				record[7] = geoname.lat;
				var marker = this.showMarker(marker,record);
				record[4] = marker;
			}

			if(dataIdx >= this.data.length && dataIdx > 1){
				var extent = markers.getDataExtent();
				map.zoomToExtent(extent);
			}
			if(dataIdx >= this.data.length && dataIdx == 1){
				map.setCenter(markers.markers[0].lonlat,4,false,false);
			}
		},

		showMarker: function (oldMarker, record){

			//2010-06-29 - Ingo Klose
			// Adding support to set marker size 
			var icon;
			var size;

			//create marker
			var lon = record[6];
			var lat = record[7];	
	
			// Test if icon is an array
			// markers: [["js/OpenMap/OpenLayers/img/marker-green.png",42,50],["js/OpenMap/OpenLayers/img/marker-gold.png",21,25],["js/OpenMap/OpenLayers/img/marker.png",21,25]]
			if (record[5] instanceof Array) {
				var icon_array = record[5];
				icon = icon_array[0];
				size = new OpenLayers.Size(icon_array[1],icon_array[2])
			}
			// default behavior is backward compatible
			else{
				icon = record[5];
				size = new OpenLayers.Size(21,25);
			}
			
			
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			var iconObj = new OpenLayers.Icon(icon,size,offset);
			
			
			//2010-07-15 Ingo: enable Mercator switch
			if(this.useMercator =='true'){
				marker = new OpenLayers.Marker(lonLatToMercator(new OpenLayers.LonLat(lon,lat)),iconObj);
		
				//create a feature to bind marker and record array together
				feature = new OpenLayers.Feature(markers,lonLatToMercator(new OpenLayers.LonLat(lon,lat)),record);
			}else{
				marker = new OpenLayers.Marker(new OpenLayers.LonLat(lon,lat),iconObj);
				feature = new OpenLayers.Feature(markers,new OpenLayers.LonLat(lon,lat),record);
			}
			
			feature.marker = marker;

			//create mouse down event for marker, set function to marker_click
			marker.events.register('mousedown', feature, DashboardsMap.marker_click);
			
			//2010-08-06 Ingo: enable tool tips
			if(this.showToolTip == 'true'){
				//create mouse events for tool tips
				marker.events.register('mouseover', feature, DashboardsMap.marker_over);
				marker.events.register('mouseout', feature, DashboardsMap.marker_out);
				
				ttips = new OpenLayers.Control.ToolTips({bgColor:"black",textColor:"white", bold : true, opacity : 0.50});
				map.addControl(ttips);
			}

			//add marker to map
			markers.addMarker(marker);

			return marker;
		},

		marker_click: function (evt){
			click_lonlat = this.lonlat;
			var record = this.data;
			// Hide tooltips when marker is clicked
			if(DashboardsMap.showToolTip == 'true'){
				ttips.hide();
			};
			Dashboards.fireChange("selectedPoint", record[0]);
		},
		
		marker_over: function (evt){
			record = this.data;
			ttips.show({html:record[0] +': '+ record[2]});
		},

		marker_out: function (evt){
			ttips.hide();
		},

		updateInfoWindow: function ( content ) {

			if(content != null){
				var html = $(content).text();/*"<table border='0' height = '175' width='175' cellpadding='0' cellspacing='0'><tr><td colspan='1' align='center' width='55'><b>";
				html += "<b>" + this.selectedPointDetails[0][1];
				html += "</b></td></tr><tr><td colspan='1' align='center' width='175'>"+content+"</td></tr></table>";*/

				show_bubble(click_lonlat,html);
			}
		},

		updateMap: function(){
			var n = this.data.length;
			for( idx=0; idx<n; idx++ ) {
				var value = this.data[idx][2];
				var markers = this.mapMarkers;
				var icon = eval(this.mapExpression);
				var marker = this.data[idx][4];
				this.data[idx][5] = icon;
				this.data[idx][4] = this.showMarker( marker, this.data[idx] ); 
			}
		},


		addMessage: function (msg){
			if(this.messageElementId != undefined)
				document.getElementById(this.messageElementId).innerHTML = document.getElementById(this.messageElementId).innerHTML + msg + "\n <br />";
		},

		cleanMessages: function (msg){
			if(this.messageElementId != undefined)
				document.getElementById(this.messageElementId).innerHTML = "";
		}

	};

var MapComponent = BaseComponent.extend({
	initMap : true, // should this be static?
	update : function() {
		//2010-06-29 enable MapDiv parameter
		var div = 'map';
		if (this.mapDiv != null){
		   div = this.mapDiv;
		}
	
		//2010-06-29 Ingo: Enable/Dispable Layer Selector
		var b_layer_control = true;
		var b_custom_map = false;
		var b_use_mercator = true;
		var str_custom_map ="";
		
		if (this.showLayerSelector == false){
		   b_layer_control = this.showLayerSelector
		}
		
		//2010-07-14 Ingo: Enable custom Map code
		if (this.showCustomMap){
			b_custom_map ='true';
			str_custom_map = this.customMapCode
		}
		
		//2010-07-15 Ingo: Enable Mercator switch (default = true)
		if ( this.useMercator == false){
			b_use_mercator = 'false'
			DashboardsMap.useMercator = 'false';
		}
		
		//2010-08-06 Ingo: Enable tool tips (default = false)
		if ( this.showToolTip == true){
			DashboardsMap.showToolTip = 'true';
		}else{
			DashboardsMap.showToolTip = 'false';
		}
	
			
		if (this.initMap){
			init_map(div, this.initPosLon,this.initPosLat,this.initZoom, b_use_mercator, b_layer_control, b_custom_map, str_custom_map);
			DashboardsMap.messageElementId = this.messageElementId;
			this.initMap = false;
		}
		
		DashboardsMap.resetSearch();

		var p = new Array(this.parameters.length);
		for(var i= 0, len = p.length; i < len; i++){
			var key = this.parameters[i][0];
			var value = Dashboards.getParameterValue(this.parameters[i][1]);
			p[i] = [key,value];
		} 

		html = Dashboards.pentahoAction(this.path, p, null);

		var myArray = this.parseArray(html,true);
		var len = myArray.length;
		if( len > 1){
			var cols = myArray[0];
			var colslength = cols.length;

			for(var i= 1; i < len; i++){
				// Get point details
				var details;
				if(colslength > 4){
					details = new Array(colslength-4);
					for(var j= 4; j < colslength; j++){
						details[j-4] = [cols[j],myArray[i][j]];
					} 
				}

				var value = myArray[i][4];
				
				var markers = this.markers;
				// Store expression and markers for update funtion
				DashboardsMap.mapExpression = this.expression();
				DashboardsMap.mapMarkers = markers;

				var icon = eval(this.expression());
				DashboardsMap.data.push(new Array(myArray[i][0],new Array(myArray[i][1],myArray[i][2],myArray[i][3]),value,details,null,icon,null,null));
				DashboardsMap.search(this,DashboardsMap.data.length - 1);
			}								
		}
	}
});

var MapBubbleComponent = BaseComponent.extend({
	update : function() {
		DashboardsMap.selectedPointDetails = null;
		for(var i = 0; i < DashboardsMap.data.length; i++)
		{
			if(Dashboards.getParameterValue("selectedPoint")  == DashboardsMap.data[i][0])
			{
				DashboardsMap.selectedPointDetails = DashboardsMap.data[i][3];
				break;
			}
	
		}
		var parameters = Dashboards.clone(DashboardsMap.selectedPointDetails);
		if(this.parameters != undefined)
			var p = new Array(this.parameters.length);
			for(var i= 0, len = p.length; i < len; i++){
				var key = this.parameters[i][0];
				var value = Dashboards.getParameterValue(this.parameters[i][1]);
				parameters.push([key,value]);
			}
		DashboardsMap.updateInfoWindow(Dashboards.pentahoAction(this.path, parameters ,null));
	}
});