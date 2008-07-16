
//vars
//var initMap = true;
/*var markers;
var data = new Array();
var dataIdx=0;
var messageElementId;
var selectedPointDetails;
var mapExpression;*/

// graft() function
// Originally by Sean M. Burke from interglacial.com
// Closure support added by Maciek Adwent

function graft (parent, t, doc) {

	// Usage: graft( somenode, [ "I like ", ['em',
	//               { 'class':"stuff" },"stuff"], " oboy!"] )

	doc = (doc || parent.ownerDocument || document);
	var e;

	if(t == undefined) {
		throw complaining( "Can't graft an undefined value");
	} else if(t.constructor == String) {
		e = doc.createTextNode( t );
	} else if(t.length == 0) {
		e = doc.createElement( "span" );
		e.setAttribute( "class", "fromEmptyLOL" );
	} else {
		for(var i = 0; i < t.length; i++) {
			if( i == 0 && t[i].constructor == String ) {
				var snared;
				snared = t[i].match( /^([a-z][a-z0-9]*)\.([^\s\.]+)$/i );
				if( snared ) {
					e = doc.createElement(   snared[1] );
					e.setAttribute( 'class', snared[2] );
					continue;
				}
				snared = t[i].match( /^([a-z][a-z0-9]*)$/i );
				if( snared ) {
					e = doc.createElement( snared[1] );  // but no class
					continue;
				}

				// Otherwise:
				e = doc.createElement( "span" );
				e.setAttribute( "class", "namelessFromLOL" );
			}

			if( t[i] == undefined ) {
				throw complaining("Can't graft an undefined value in a list!");
			} else if(  t[i].constructor == String ||
					t[i].constructor == Array ) {
				graft( e, t[i], doc );
			} else if(  t[i].constructor == Number ) {
				graft( e, t[i].toString(), doc );
			} else if(  t[i].constructor == Object ) {
				// hash's properties => element's attributes
				for(var k in t[i]) {
					// support for attaching closures to DOM objects
					if(typeof(t[i][k])=='function'){
						e[k] = t[i][k];
					} else {
						e.setAttribute( k, t[i][k] );
					}
				}
			} else {
				throw complaining( "Object " + t[i] +
						" is inscrutable as an graft arglet." );
			}
		}
	}

	parent.appendChild( e );
	return e; // return the topmost created node
}

function complaining (s) { alert(s); return new Error(s); }

	
	function isArray(testObject) {   
		return testObject && !(testObject.propertyIsEnumerable('length')) && typeof testObject === 'object' && typeof testObject.length === 'number';
	}

var Dashboards = 
{
    components: '',
	initMap: true,

	update:function(object)	{
		        if(!(typeof(object.preExecution)=='undefined')){
					object.preExecution();
				}
				switch(object.type)
				{
					// test if object is an xaction
					case "xaction":
						//go through parametere array and update values
						var p = new Array(object.parameters.length);
						for(var i= 0, len = p.length; i < len; i++){
							var key = object.parameters[i][0];
							var value = eval(object.parameters[i][1]);
							p[i] = [key,value];
						} 
						document.getElementById(object.htmlObject).innerHTML = pentahoAction(object.solution, object.path, object.action, p,null);
						break;
					
					case "text":
						selectHTML = eval(object.expression());
						document.getElementById(object.htmlObject).innerHTML = selectHTML;
						break;
					case "select":
					case "selectMulti":

						var myArray = Dashboards.getValuesArray(object);
						
						selectHTML = "<select";
						selectHTML += " id='" + object.name + "'";
						
						//set size
						if (object.size != undefined){
							selectHTML += " size='" + object.size + "'";
						}
						if (object.type == "selectMulti"){
							selectHTML += " multiple";
						}
						selectHTML += " onchange='Dashboards.processChange(\"" + object.name + "\")'>";
						
						for(var i= 0, len  = myArray.length; i < len; i++){
								if(myArray[i]!= null && myArray[i].length>0)
								selectHTML += "<option value = '" + myArray[i][1] + "' >" + myArray[i][1] + "</option>";
						} 
						
						selectHTML += "</select>";
						
						//alert(selectHTML);
						
						//update the placeholder
						document.getElementById(object.htmlObject).innerHTML = selectHTML;
	
						break;
					case "textInput":
						selectHTML = "<input onChange='Dashboards.processChange(\"" + object.name + "\")' onKeyUp='if (event.keyCode==13){Dashboards.processChange(\"" + object.name + "\")}'";
						selectHTML += " type=test id='" + object.name +"' name='" + object.name +"' + value='"+ eval(object.parameter) + "'>";
						document.getElementById(object.htmlObject).innerHTML = selectHTML;
						break;
					case "dateInput":
						graft(
								document.getElementById(object.htmlObject),
								["input",
								{id: object.name, value:eval(object.parameter), type:'text', size: 10 }]);	
						Calendar.setup({inputField: object.name, ifFormat : "%Y-%m-%d",  onUpdate: function(){Dashboards.processChange(object.name)} });
						break;
					case "radio":
					case "check":
						var myArray = Dashboards.getValuesArray(object);

						selectHTML = "";
						for(var i= 0, len  = myArray.length; i < len; i++){
							selectHTML += "<input onclick='Dashboards.processChange(\"" + object.name + "\")'";
							if(i==0){
								selectHTML += " CHECKED";
							}
							if (object.type == 'radio'){
								selectHTML += " type='radio'";
							}else{
								selectHTML += " type='checkbox'";
							}
							selectHTML += " id='" + object.name +"' name='" + object.name +"' value='" + myArray[i][1] + "'> " + myArray[i][1];
						} 
						//update the placeholder
						document.getElementById(object.htmlObject).innerHTML = selectHTML;
	
					break;
					case "map":
						
						if(this.initMap){
							init_map(object.initPosLon,object.initPosLat,object.initZoom, 'true');
							DashboardsMap.messageElementId = object.messageElementId;
							this.initMap = false;
						}
						else
						{
							DashboardsMap.resetSearch();
							
							var p = new Array(object.parameters.length);
							for(var i= 0, len = p.length; i < len; i++){
								var key = object.parameters[i][0];
								var value = eval(object.parameters[i][1]);
								p[i] = [key,value];
							} 
						
							html = pentahoAction(object.solution, object.path, object.action, p,null);
							
							var myArray = this.parseArray(html,true);
							var len = myArray.length;
							if( len > 1){
								var cols = myArray[0];
								var colslength = cols.length;
								
								for(var i= 1; i < len; i++){
									//Get point details
									var details;
									if(colslength > 4){
										details = new Array(colslength-5);
										for(var j= 5; j < colslength; j++){
											details[j-5] = [cols[j],myArray[i][j]];
										} 
									}
									
									var value = myArray[i][4];
									var markers = object.markers;
									//Store expression and markers for update funtion
									DashboardsMap.mapExpression = object.expression();
									DashboardsMap.mapMarkers = markers;
									
									var icon = eval(object.expression());
									DashboardsMap.data.push(new Array(myArray[i][0],new Array(myArray[i][1],myArray[i][2],myArray[i][3]),value,details,null,icon,null,null));
									DashboardsMap.search(DashboardsMap.data.length - 1);
								}								
							}
						}
						break;
						
					case "mapBubble":
						
						DashboardsMap.selectedPointDetails = null;
						
						for(var i = 0; i < DashboardsMap.data.length; i++)
						{
							if(selectedPoint == DashboardsMap.data[i][0])
							{
								DashboardsMap.selectedPointDetails = DashboardsMap.data[i][3];
								break;
							}
						
						}
						
						DashboardsMap.updateInfoWindow(pentahoAction(object.solution, object.path, object.action, DashboardsMap.selectedPointDetails ,null));
					
						break;
						
					case "jpivot":
					
						//Build IFrame and set url
						var jpivotHTML = "<iframe id=\"jpivot_"+ object.htmlObject + " \" scrolling=\"tu\" frameborder=\"0\"  height = \"100%\"  width =\"100%\"  src = \"";
						jpivotHTML += "ViewAction?solution="	+ object.solution + "&path=" + 	object.path + "&action="+ object.action
						
						//Add args
						var p = new Array(object.parameters.length);
						for(var i= 0, len = p.length; i < len; i++){
							var arg = "&" + object.parameters[i][0] + "=";
							jpivotHTML += arg +  eval(object.parameters[i][1]);
						}
						
						//Close IFrame
						jpivotHTML += "\"></iframe>";
							
						document.getElementById(object.htmlObject).innerHTML = jpivotHTML;
						
					break;
				}
		        if(!(typeof(object.postExecution)=='undefined')){
					object.postExecution();
				}
		},
	init:function(components){
			 this.components=components;
			 var compCount = components.length;
			 for(var i= 0, len = components.length; i < len; i++){
				 if(components[i].executeAtStart){
					 this.update(components[i]);
				 }
			 }  
		},
	clear:function(obj){
			document.getElementById(obj.htmlObject).innerHTML = "";
		},

	resetAll:function(){
			 var compCount = components.length;
			 for(var i= 0, len = components.length; i < len; i++){
				 this.clear(components[i]);
			 }  
			 var compCount = components.length;
			 for(var i= 0, len = components.length; i < len; i++){
				 if(components[i].executeAtStart){
					 this.update(components[i]);
				 }
			 }  
		},
		
	parseArray: function(html,includeHeader){
			var myArray;
			html=html.replace(/<tr>/g,"[");
			html=html.replace(/<\/tr>/g,"],");
			html=html.replace(/<t[hd][^\>]*>/g,"");
			html=html.replace(/<\/t[hd]>/g,",");
			html=html.replace(/(\[|,(?![\[\]]|$))/g,"$1\"");
			html=html.replace(/([^\]]),/g,"$1\",");
			html=html.replace(/,\]/g,"]");
			var a = "var myArray = [" + html.substring(0,html.length-1) + "];"
			eval(a);
			if (!includeHeader){
				myArray.splice(0,1);
			}

			return myArray;
		
		},
	getValuesArray: function(object){

		  if (typeof(object.valuesArray) == 'undefined'){
			  //go through parameter array and update values
			  var p = new Array(object.parameters.length);
			  for(var i= 0, len = p.length; i < len; i++){
				  var key = object.parameters[i][0];
				  var value = eval(object.parameters[i][1]);
				  p[i] = [key,value];
			  } 

			  //execute the xaction tp populate the selector
			  html = pentahoAction(object.solution, object.path, object.action, p,null);

			  //transform the result int a javascript array
			  var myArray = this.parseArray(html,false);
			  return myArray;

		  }
		  else{
			  return object.valuesArray
		  }
	  },
	processChange: function(object_name){
		var object = eval(object_name);
		var parameter = object.parameter;
		var value;
				
		//alert(document.getElementById(object.name));
		
		switch (object.type)
		{
			case "select":
				var selector = document.getElementById(object.name);
				for(var i= 0, len  = selector.length; i < len; i++){
						if(selector[i].selected){
							value = selector[i].value;
						};
				} 
				break;
			case "radio":
				var selector = document.getElementsByName(object.name);
				for(var i= 0, len  = selector.length; i < len; i++){
						if(selector[i].checked){
							value = selector[i].value;
							continue;
						};
				} 
				break;
			case "check":
			case "selectMulti":
				if(object.type == "check"){
					var selector = document.getElementsByName(object.name);
				}else{
					var selector = document.getElementById(object.name);
				}
				var selection = new Array();
				var selection_index = 0;
				for(var i= 0, len  = selector.length; i < len; i++){
					if(selector[i].checked || selector[i].selected){
						selection[selection_index] = selector[i].value;
						selection_index ++;
					};
				} 
				value=selection.join("','");
				break;
			case "textInput":
			case "dateInput":
				var selector = document.getElementById(object.name);
				value = selector.value;
			
			break;
		}
		if(!(typeof(object.preChange)=='undefined')){
			object.preChange(value);
		}
		this.fireChange(parameter,value);
		if(!(typeof(object.postChange)=='undefined')){
			object.postChange(value);
		}
	},
	fireChange: function(parameter,value){
		busyBox.Show();
	    //alert("Parameter: " + parameter + "; Value: " + value);
		eval( parameter + "= encode_prepare(\"" + value + "\")"); 

		for(var i= 0, len = components.length; i < len; i++){
			if(isArray(components[i].listeners)){
				for(var j= 0 ; j < components[i].listeners.length; j++){

					//alert("Testing  (" + i + "," + j + ") : " + parameter + " - " + components[i].listeners[j] + " == " + parameter + ": " + (components[i].listeners[j] == parameter));
					if(components[i].listeners[j] == parameter){
						this.update(components[i]);
						break;
					}
					//alert("finished parameter " + j)
				}
			}
		}  
		busyBox.Hide();
			
	}
};


/**
*
* UTF-8 data encode / decode
* http://www.webtoolkit.info/
*
**/

function encode_prepare( s )
{
	s = s.replace(/\+/g," ");
	if (BrowserDetect.browser == "Explorer" || BrowserDetect.browser == "Opera"){
		return Utf8.decode(s);
	}
	
	return s;
}

var Utf8 = {

    // public method for url encoding
    encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // public method for url decoding
    decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}



var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};
BrowserDetect.init();

var DashboardsMap = 
{

	markers: null,
	data : new Array(),
	dataIdx: 0,
	messageElementId: null,
	selectedPointDetails: null,
	mapExpression: null,
	
	search: function (idx) {

		var record = this.data[idx];
		var place = record[1];
		
		var lat = place[0];
		var log = place[1];
		var placeDesc = place[2];

		//request = 'http://ws.geonames.org/searchJSON?q=' +  encodeURIComponent(place)  + ',Portugal&maxRows=1&featureClass=P&coutry=PT&callback=getLocation';
		if(lat == '' || log == '')
		{
			placeDesc = placeDesc.replace(/&/g,",");
			request = 'http://ws.geonames.org/searchJSON?q=' +  encodeURIComponent(placeDesc)  + '&maxRows=1&featureClass=P&callback=DashboardsMap.getLocation';
		}

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
		document.getElementById(this.messageElementId).innerHTML = "";
		dataIdx = 0;
		data = new Array();
	},

	// this function will be called by our JSON callback
	// the parameter jData will contain an array with geonames objects
	getLocation: function (jData) {

		var record = this.data[dataIdx++];

		if (jData == null || jData.totalResultsCount == 0) {
			// There was a problem parsing search results
			var placeNotFound = record[0];
			this.addMessage("N&atilde;o encontrado: " + placeNotFound);
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

		if(dataIdx >= data.length && dataIdx > 1){
			var extent = markers.getDataExtent();
			map.zoomToExtent(extent);
		}
		if(dataIdx >= data.length && dataIdx == 1){
            map.setCenter(markers.markers[0].lonlat,4,false,false);
        }
	},

	showMarker: function (oldMarker, record){
		
		icon = record[5];

		//create marker
		var lon = record[6];
		var lat = record[7];
		var size = new OpenLayers.Size(21,25);
		var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
		var iconObj = new OpenLayers.Icon(icon,size,offset);
		marker = new OpenLayers.Marker(lonLatToMercator(new OpenLayers.LonLat(lon,lat)),iconObj);
		
		//create a feature to bind marker and record array together
		feature = new OpenLayers.Feature(markers,lonLatToMercator(new OpenLayers.LonLat(lon,lat)),record);
		feature.marker = marker;
		
		//create mouse down event for marker, set function to marker_click
		marker.events.register('mousedown', feature, DashboardsMap.marker_click);
		
		//add marker to map
		markers.addMarker(marker);
		
		return marker;
	},

	marker_click: function (evt){
		click_lonlat = this.lonlat;
		var record = this.data;
		Dashboards.fireChange("selectedPoint", record[0]);
	},

	updateInfoWindow: function ( content ) {

		if(content != null){
			var html = "<table border='0' height = '175' width='175' cellpadding='0' cellspacing='0'><tr><td colspan='1' align='center' width='55'><b>";
			html += "<b>" + this.selectedPointDetails[0][1];
			html += "</b></td></tr><tr><td colspan='1' align='center' width='175'>"+content+"</td></tr></table>";

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
		document.getElementById(this.messageElementId).innerHTML = document.getElementById(this.messageElementId).innerHTML + msg + "\n <br />";
	},

	cleanMessages: function (msg){
		document.getElementById(this.messageElementId).innerHTML = "";
	}

};
