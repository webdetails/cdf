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
