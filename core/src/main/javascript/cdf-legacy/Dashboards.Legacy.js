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

Dashboards.callPentahoAction = function(obj, solution, path, action, parameters, callback ){
  var myself = this;

  // Encapsulate pentahoAction call
  // Dashboards.log("Calling pentahoAction for " + obj.type + " " + obj.name + "; Is it visible?: " + obj.visible);
  if(typeof callback == 'function'){
    return this.pentahoAction( solution, path, action, parameters,
      function(json){
        callback(myself.parseXActionResult(obj,json));
      }
      );
  }
  else{
    return this.parseXActionResult(obj,this.pentahoAction( solution, path, action, parameters, callback ));
  }
};

Dashboards.urlAction = function ( url, params, func) {
  return this.executeAjax('xml', url, params, func);
};

Dashboards.executeAjax = function( returnType, url, params, func ) {
  var myself = this;
  // execute a url
  if (typeof func == "function"){
    // async
    return $.ajax({
      url: url,
      type: "POST",
      dataType: returnType,
      async: true,
      data: params,
      complete: function (XMLHttpRequest, textStatus) {
        /* CDF-271 jQuery 1.9.1 bug #13388 */
        if (typeof XMLHttpRequest.responseXML == "undefined") {
          func(jQuery.parseXML(XMLHttpRequest.responseText));
        } else {
          func(XMLHttpRequest.responseXML);
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        myself.log("Found error: " + XMLHttpRequest + " - " + textStatus + ", Error: " +  errorThrown,"error");
      }
    });
  }

  // Sync
  var result = $.ajax({
    url: url,
    type: "POST",
    dataType:returnType,
    async: false,
    data: params,
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      myself.log("Found error: " + XMLHttpRequest + " - " + textStatus + ", Error: " +  errorThrown,"error");
    }

  });
  if (returnType == 'xml') {
    /* CDF-271 jQuery 1.9.1 bug #13388 */
    if (typeof result.responseXML == "undefined") {
      return jQuery.parseXML(result.responseText);
    } else {
      return result.responseXML;
    }
  } else {
    return result.responseText;
  }

};

Dashboards.pentahoAction = function( solution, path, action, params, func ) {
  return this.pentahoServiceAction('ServiceAction', 'xml', solution, path, action, params, func);
};

Dashboards.pentahoServiceAction = function( serviceMethod, returntype, solution, path, action, params, func ) {
  // execute an Action Sequence on the server

  var arr = wd.cdf.endpoints.getServiceAction( serviceMethod, solution, path , action );
  var url = arr.url;
  delete arr.url;

  $.each(params,function(i,val){
    arr[val[0]]=val[1];
  });
  return this.executeAjax(returntype, url, arr, func);
};

Dashboards.CDF_ERROR_DIV = 'cdfErrorDiv';

Dashboards.createAndCleanErrorDiv = function(){
  if ($("#" + Dashboards.CDF_ERROR_DIV).length == 0){
    $("body").append("<div id='" +  Dashboards.CDF_ERROR_DIV + "'></div>");
  }
  $("#" + Dashboards.CDF_ERROR_DIV).empty();
};

Dashboards.showErrorTooltip = function(){
  $(function(){
    if($.tooltip) {
      $(".cdf_error").tooltip({
        delay:0,
        track: true,
        fade: 250,
        showBody: " -- "
      });
    }
  });
};

Dashboards.parseXActionResult = function(obj,html){

  var jXML = $(html);
  var error = jXML.find("SOAP-ENV\\:Fault");
  if (error.length == 0){
    return jXML;
  }

  // error found. Parsing it
  var errorMessage = "Error executing component " + obj.name;
  var errorDetails = new Array();
  errorDetails[0] = " Error details for component execution " + obj.name + " -- ";
  errorDetails[1] = error.find("SOAP-ENV\\:faultstring").find("SOAP-ENV\\:Text:eq(0)").text();
  error.find("SOAP-ENV\\:Detail").find("message").each(function(){
    errorDetails.push($(this).text())
  });
  if (errorDetails.length > 8){
    errorDetails = errorDetails.slice(0,7);
    errorDetails.push("...");
  }
  //<img src='"+ ERROR_IMAGE + "'>
  // TODO errorDetails in title: is this right?
  var out = "<table class='errorMessageTable' border='0'><tr><td class='errorIcon'></td><td><span class='cdf_error' title=\"" + errorDetails.join('<br/>').replace(/"/g,"'") +"\" >" + errorMessage + " </span></td></tr></table/>";

  // if this is a hidden component, we'll place this in the error div
  if (obj.visible == false){
    $("#" + Dashboards.CDF_ERROR_DIV).append("<br />" + out);
  }
  else{
    $('#'+obj.htmlObject).html(out);
  }


  return null;

};

Dashboards.setSettingsValue = function(name,object){

  var data = {
    method: "set",
    key: name,
    value: JSON.stringify(object)
  };
  $.post(wd.cdf.endpoints.getSettings("set", null), data, function(){});
};

Dashboards.getSettingsValue = function(key,value){

  var callback = typeof value == 'function' ? value : function(json){
    value = json;
  };

  $.getJSON(wd.cdf.endpoints.getSettings("get", key), callback);
};

Dashboards.fetchData = function(cd, params, callback) {
  this.log('Dashboards.fetchData() is deprecated. Use Query objects instead','warn');
  // Detect and handle CDA data sources
  if (cd != undefined && cd.dataAccessId != undefined) {
    for (var param in params) {
      cd['param' + params[param][0]] = this.getParameterValue(params[param][1]);
    }

    $.post(wd.cdf.endpoints.getDoQuery(), cd,
      function(json) {
        callback(json);
      },'json').error(Dashboards.handleServerError);
  }
  // When we're not working with a CDA data source, we default to using jtable to fetch the data...
  else if (cd != undefined){

    var xactionFile = (cd.queryType == 'cda')? "jtable-cda.xaction" : "jtable.xaction";

    $.post(wd.cdf.endpoints.getCdfXaction("pentaho-cdf/actions", xactionFile), cd,
      function(result) {
        callback(result.values);
      },'json');
  }
  // ... or just call the callback when no valid definition is passed
  else {
    callback([]);
  }
};
