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


$.ajaxSetup({
  type: "POST",
  async: false,
  traditional: true,
  scriptCharset: "utf-8",
  contentType: "application/x-www-form-urlencoded;charset=UTF-8",

  dataFilter: function(data, dtype) {
    // just tagging date
    if( !(typeof Dashboards === 'undefined') ){
      Dashboards.lastServerResponse = Date.now ? Date.now() : new Date().getTime();
    }
    return data;
  }
});

var pathArray = window.location.pathname.split( '/' );
var webAppPath;
if (!(typeof(CONTEXT_PATH) == 'undefined')){
  webAppPath = CONTEXT_PATH;
}
if(webAppPath == undefined){
  webAppPath = "/" + pathArray[1];
}

if(webAppPath.endsWith("/")) {
  webAppPath = webAppPath.substr(0, webAppPath.length-1);
}

//TODO any refs to these global vars?
//var GB_ANIMATION = true; 
// var CDF_CHILDREN = 1;
// var CDF_SELF = 2;



if($.blockUI){
  $.blockUI.defaults.fadeIn = 0;
  $.blockUI.defaults.message = '<div class="blockUIDefaultImg"></div>';
  $.blockUI.defaults.css.left = '50%';
  $.blockUI.defaults.css.top = '40%';
  $.blockUI.defaults.css.marginLeft = '-16px';
  $.blockUI.defaults.css.width = '32px';
  $.blockUI.defaults.css.background = 'none';
  $.blockUI.defaults.overlayCSS = { backgroundColor: "#FFFFFF", opacity: 0.8, cursor: "wait"};
  $.blockUI.defaults.css.border = "none";
}



//Set impromptu defaults
if($.prompt && typeof $.prompt.setDefaults == 'function') {
  $.prompt.setDefaults({
    prefix: 'jqi',
    show: 'slideDown'
  });
}
