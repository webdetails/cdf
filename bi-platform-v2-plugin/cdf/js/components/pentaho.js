/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

/*
 * corePentaho.js
 *
 * Includes all components relating to XActions, PRPTs, JPivot, and other
 * Pentaho-owned technologies.
 */

// TODO: could really use some refactoring: iframes, options, post

var XactionComponent = BaseComponent.extend({
  update : function() {
    var myself=this;
    try {
      if (typeof(this.iframe) == 'undefined' || !this.iframe) {
        // go through parameter array and update values
        var p = new Array(this.parameters?this.parameters.length:0);
        for(var i= 0, len = p.length; i < len; i++){
          var key = this.parameters[i][0];
          var value = this.parameters[i][1] == "" ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
          if(this.value == "NIL"){
            this.value = this.parameters[i][2];
          }
          p[i] = [key,value];
        }

        if (typeof(this.serviceMethod) == 'undefined' || this.serviceMethod == 'ServiceAction') {
          var jXML = Dashboards.callPentahoAction(myself,this.path, p,null);

          if(jXML != null){
            $('#'+myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
          }
        } else {
          var html = Dashboards.pentahoServiceAction(this.serviceMethod, 'html', this.path, p, null);
          $('#'+myself.htmlObject).html(html);
        }

      } else {
        var xactionIFrameHTML = "<iframe id=\"iframe_"+ this.htmlObject + "\"" +
        " frameborder=\"0\"" +
        " height=\"100%\"" +
        " width=\"100%\" />";        
        var iframe = $(xactionIFrameHTML);        
        
    //var url = webAppPath + "/ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.action + "&"; //legacy
    var ts = "ts=" + new Date().getTime() + "&";
    var url = webAppPath + "/api/repos/" + this.path.replace(/\//g, ':') + "/xaction?" + ts;

        // Add args
        var p = new Array(this.parameters.length);
        for(var i= 0, len = p.length; i < len; i++){
          var arg = "&" + encodeURIComponent(this.parameters[i][0]) + "=";
          var val = "";
          if (this.parameters[i][1] == "") {
            val = encodeURIComponent(this.parameters[i][2]);
          } else {
            val =  encodeURIComponent(Dashboards.getParameterValue(this.parameters[i][1]));
            if(val == "NIL"){
              val = encodeURIComponent(this.parameters[i][2])
            }
          }
          url += arg + val;
        }
        if (!this.loading) {
          this.loading = true;
          Dashboards.incrementRunningCalls();
        }
        iframe.load(function(){
          if (this.contentWindow.document.body.innerHTML){
            myself.loading = false;
            Dashboards.decrementRunningCalls();
          }
        });
        $("#"+this.htmlObject).empty().append(iframe);
        iframe[0].contentWindow.location = url;
      }
    } catch (e) {
    // don't cause the rest of CDF to fail if xaction component fails for whatever reason
    }
  }
});

var JpivotComponent = BaseComponent.extend({
  update : function() {
    //to be backwards compatible set default value for iframeScolling
    // also added 20px 
    if(this.iframeScrolling == undefined){
      this.iframeScrolling="no";
    }
     // Build IFrame and set url
    var jpivotHTML = "<iframe id=\"jpivot_"+ this.htmlObject + "\" scrolling=\""+this.iframeScrolling+"\" onload=\"var dynamicHeight = this.contentWindow.document.body.offsetHeight+50; this.style.height = dynamicHeight + 'px';\" frameborder=\"0\" height=\""+this.iframeHeight+"\" width=\""+this.iframeWidth+"\" src=\"";
    jpivotHTML += webAppPath + "/api/repos/" + this.path.replace(/\//g, ':') + "/xaction?" ;

    // Add args
    var p = new Array(this.parameters.length);
    for(var i= 0, len = p.length; i < len; i++){
      var arg = "&" + this.parameters[i][0] + "=";
      jpivotHTML += arg +  Dashboards.getParameterValue(this.parameters[i][1]);
    }

    // Close IFrame
    jpivotHTML += "\"></iframe>";

    $("#"+this.htmlObject).html(jpivotHTML);
  }
});

var PivotLinkComponent = BaseComponent.extend({
  update : function() {}
},{
  openPivotLink : function(object) {
    var url = webAppPath + "/Pivot?solution=system&path=pentaho-cdf/actions&action=jpivot.xaction&";

    var qd = object.pivotDefinition;
    var parameters = [];
    for(p in qd){
      var key = p;
      var value = typeof qd[p]=='function'?qd[p]():qd[p];
      //alert("key: " + key + "; Value: " + value);
      parameters.push(key + "=" + encodeURIComponent(value));
    }
    url += parameters.join("&");

    var _href = url.replace(/'/g,"&#39;");
    $.fancybox({
      type:"iframe",
      href:_href,
      width: $(window).width(),
      height:$(window).height()
    });
  }
});


var PrptComponent = BaseComponent.extend({

  getIframeName : function() {
    return this.htmlObject + '_' + 'prptFrame';
  },

  getIframe: function() {
    return '<iframe name="' + this.getIframeName() + '" style="width:100%;height:100%;border:0px" frameborder="0"/>';
  },

 /*************************************************************************
  * We really shouldn't mess around with the CDF running call counter,
  * but if we don't do so in this case, the report will count as "finished"
  * even though nothing has been loaded into the iframe. We'll increment it
  * here,decrement it again from the iframe's onload event.
  */

  startLoading: function() {
    if (!this.loading) {
      this.loading = true;
      Dashboards.incrementRunningCalls();
    }
  },

  stopLoading: function() {
    if (this.loading) {
      this.loading = false;
      Dashboards.decrementRunningCalls();
    }
  },
  /*************************************************************************/

  update: function(){
 
    this.clear();
 
    var options = this.getOptions();
    var downloadMode = this.downloadMode;
    // if you really must use this component to download stuff
    if (downloadMode == null) {
      var outputTarget = options["output-target"];
      // take a guess
      downloadMode =
        !((outputTarget.indexOf('html') != -1 &&
           outputTarget.indexOf('mime-message') == -1)
          || outputTarget.indexOf('text') != -1);
    }

    if(options["dashboard-mode"]){
   	  var ts = "ts=" + new Date().getTime() + "&";
      var url = webAppPath + '/api/repos/' + options.path.replace(/\//g, ':') + '/viewer?' + ts;
      var myself=this;
      $.ajax({
        url: url,
        data: options,
        dataType:"html",
        success: function(resp){
          $("#"+myself.htmlObject).html(resp);
        }
      });
    }
    else {
      // set up our result iframe
      var iframe = $(this.getIframe());
      var htmlObj = $('#' + this.htmlObject);
      htmlObj.empty();
      iframe = iframe.appendTo(htmlObj);

      if (this.autoResize) {
        // we'll need to reset size before each resize,
        // otherwise we'll get stuck with the size of the biggest report we get
        if (this._sHeight == null) {
          this._sHeight = htmlObj.height();
          this._sWidth = htmlObj.width();
        }
        else {
          htmlObj.height(this._sHeight);
          htmlObj.width(this._sWidth);
        }
      }

      if (this.usePost) {

        var url = webAppPath + '/api/repos/' + options.path.replace(/\//g, ':') + '/viewer?' + ts;
        this._postToUrl(htmlObj, iframe, url, options, this.getIframeName());

      } else {

        var url = webAppPath + '/api/repos/' + options.path.replace(/\//g, ':') + '/viewer?' + ts + $.param(options);

        if (options.showParameters && this.autoResize) {
          Dashboards.log('PrptComponent: autoResize disabled because showParameters=true');
          this.autoResize = false;
        }

        this.startLoading();
        var myself = this;
        iframe.load(function(){
          var jqBody = $(this.contentWindow.document.body);
          var reportContentFrame = jqBody.find('#reportContent');
          reportContentFrame.load(function() {
            if (myself.autoResize) {
              myself._resizeToReportFrame(reportContentFrame[0],htmlObj, options);
            }
            myself.stopLoading();
          });
        });
        iframe[0].contentWindow.location = url;
      }
      if (downloadMode) {
        // if call prompts a download window we'll never know when it's done
        this.stopLoading();
      }
    }
  },

  /**
   * report options
   **/
  getOptions: function() {
    var options = {
      paginate : this.paginate || false,
      showParameters: this.showParameters || false,
      autoSubmit: (this.autoSubmit || this.executeAtStart) || false,
      "dashboard-mode": this.iframe==undefined?false:!this.iframe,
      solution: this.solution,
      path: this.path,
      action: this.action
    };

    if (this.paginate) {
      options["output-target"] = "table/html;page-mode=page";
    } else {
      options["output-target"] = "table/html;page-mode=stream";
    }
 
    // update options with report parameters
    for (var i=0; i < this.parameters.length; i++ ) {
      // param: [<prptParam>, <dashParam>, <default>]
      var param = this.parameters[i];
      var value = Dashboards.getParameterValue(param[1]);
      if(value == null && param.length == 3) {
        value = param[2];
      }
      options[param[0]] = value;
    }

    return options;

  },


  _postToUrl : function (htmlObj, iframe, path, params, target) {
    this.startLoading();
    // use a form to post, response will be set to iframe
    var form = this._getParamsAsForm(document, path, params, this.getIframeName());
    htmlObj[0].appendChild(form);

    var self = this;
    iframe.load(function() {
      if(self.autoResize) {
        self._resizeToReportFrame(iframe[0], htmlObj, params);
      }
      self.stopLoading();
    });

    form.submit();
  },

  _resizeToReportFrame : function(iframe, htmlObj, options) {
    var outputTarget = options["output-target"];
    // only makes sense for html, but let's keep it open
    var isHtml = function(outputTarget) {
      return outputTarget.indexOf('html') != -1 
            && outputTarget.indexOf('mime') == -1;
    };
    var isText = function(outputTarget) {
      return outputTarget.indexOf('text') != -1;
    };
    var isXml = function(outputTarget) {
      return outputTarget.indexOf('xml') != -1;
    };
    try {
      var idoc = iframe.contentWindow.document;
      if (iframe.contentWindow.document) {
        var sized = null;
        if (isHtml(outputTarget) || isText(outputTarget)) {
          sized = idoc.body;
        }
        else if (isXml(outputTarget)) {
          // not much point in using this
          sized = idoc.firstChild;
        }

        if (sized != null) {
          var hMargin=0, wMargin=0;
          if (isHtml(outputTarget)) {
            // margins may not be taken into account in scrollHeight|Width
            var jsized = $(sized);
            hMargin = jsized.outerHeight(true) - jsized.outerHeight(false);
            wMargin = jsized.outerWidth(true) - jsized.outerWidth(false);
          }
          htmlObj.height(sized.scrollHeight + hMargin);
          htmlObj.width(sized.scrollWidth + wMargin);
        }
      }
    } catch(e) {
      Dashboards.log(e);
    }
  },

  _getParamsAsForm : function (doc, path, params, target) {
    var form = doc.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", path);
    form.setAttribute("target", target);
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        var param = params[key];
        if ($.isArray(param)) {
          for(var i = 0; i < param.length; i++){
            var hiddenField = doc.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", param[i]);
            form.appendChild(hiddenField);
          }
        }
        else {
          var hiddenField = doc.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", key);
          hiddenField.setAttribute("value", param);
          form.appendChild(hiddenField);
        }
      }
    }
    return form;
  }

});//PrptComponent

var SchedulePrptComponent = PrptComponent.extend({
visible:false,

update : function() {
    // 2 modes of working; if it's a div, create a button inside it
    var myself = this;
    var o = $("#"+ this.htmlObject);
    if ($.inArray(o[0].tagName.toUpperCase(),["SPAN","DIV"]) > -1){
      // create a button
      o = $("<button/>").appendTo(o.empty());
      if (o[0].tagName=="DIV") o.wrap("<span/>");
      if (this.label != undefined) o.text(this.label);
      o.button();
      o.addClass('scheduler_button');
    }
    o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
    o.bind("click", function(){
      var success = typeof(myself.preChange)=='undefined' ? true : myself.preChange();
      if(success) {
        myself.schedulePrptComponent();
      }
      typeof(myself.postChange)=='undefined' ? true : myself.postChange();
    });
  },

  schedulePrptComponent: function(){

    var parameters={};
    var sharedUuid;
    var error=false;
      guid = function(){
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
        function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);  
        });

    }
    triggerError = function(msg,id){
  error=true;
  $(id).css("backgroundColor","rgb(255,159,159)");//error state color.
  //$(id).css("backgroundColor","rgb(184,245,177)"); Valid state color. aplicable?
  var temp = $(id).val();
  $(id).val(msg);

  setTimeout(function(){$(id).css("backgroundColor","white");
  $(id).val(temp);},2000);

    }

    getHour = function(){
    var hour=$("#hours").val();
    if($("#amPm").val()=="pm") {
        hour= parseInt(hour, 10) + 12;
      if (hour==24)
        hour=12;
    } else {
        if (hour == "12")
            hour = 0;
    }
    return hour;
    }
    cronThis = function(){
      var minute=$("#minutes").val();
      var hour=getHour();
      var choice= $("#recurrId").val();
      var dayOfWeek="?";
      var month ="*";
      var dayOfMonth="?";
      var year="*";//really necessary?
      switch(choice)
      {
        case "daily":
        dayOfWeek="mon-fri";
        break;
        case "weekly":
        var i=0;
        if ($("#monday").is(":checked")){
          dayOfWeek+=",mon";
          i++;
        }
        if ($("#tuesday").is(":checked")){
          dayOfWeek+=",tue";
          i++;
      }
        if ($("#wednesday").is(":checked")){
          dayOfWeek+=",wed";
          i++;
      }
        if ($("#thursday").is(":checked")){
          dayOfWeek+=",thu";
          i++;
      }
        if ($("#friday").is(":checked")){
          dayOfWeek+=",fri";
          i++;
      }
        if ($("#saturday").is(":checked")){
          dayOfWeek+=",sat";
          i++;
      }
        if ($("#sunday").is(":checked")){
          dayOfWeek+=",sun";
          i++;
      }
      if(i>0){
        dayOfWeek=dayOfWeek.replace("\?","");
        dayOfWeek=dayOfWeek.replace(",","");
      }else{

         $("#errWeek").css("color","rgb(255,159,159)");
         $("#errorCheckboxes").show();
         setTimeout(function(){
         $("#errorCheckboxes").hide();
            },2000);
         error=true;

      }
        break;
        case "monthly":
        if($("#monthRadio").is(":checked"))
        {
          dayOfMonth=$("#recurrPatternIn").val();
          if(dayOfMonth<1)
            triggerError(">0","#recurrPatternIn");
          else if(dayOfMonth>31)
            triggerError("<=31","#recurrPatternIn");
        }
        else
        {
          dayOfMonth="?";
          dayOfWeek=$("#monthOpt2Select").val().substring(0,3)+"#"+$("#monthOpt1Select").val();

        }
        break;
        case "yearly":
        if($("#yearRadio").is(":checked"))
        {
          dayOfWeek = "?";
          month=$("#yearEveryMonth").val();
          dayOfMonth=$("#yearDayMonth").val();
          if(dayOfMonth<1)
            triggerError(">0","#yearDayMonth");
          else if(dayOfMonth>31)
            triggerError("<=31","#yearDayMonth");

        }
        else
        {
          dayOfMonth="?";
          dayOfWeek=$("#yearOpt2Select").val().substring(0,3)+"#"+$("#yearOpt1Select").val();
          month=$("#yearMonthSelect").val();
        }
        break;

      }
      var builtCron = "0 "+minute+" "+hour+" "+dayOfMonth+" "+month+" "+dayOfWeek+" "+year;
      return builtCron;

    }
    getUTC = function(exp){
      var arr=exp.split("/");
      return new Date(arr[2],arr[0]-1,arr[1],0,0,0,0).getTime();
    }
     makeSelect = function(min,max,interval,id){
      var selectHtml = '<select id ="'+id+'">';
      for(var i=min;i<=max;i+=interval){
        if(i<10)
        selectHtml += '<option value="'+i+'">0'+i+'</option>';
      else selectHtml += '<option value="'+i+'">'+i+'</option>';
      }
      selectHtml += '</select>';
      return selectHtml;

    }
    validateStartDate=function(mili,id){
      var now = new Date();
      if(isNaN(mili)||mili<now.getTime())
        triggerError("Incorrect Date, pick date from calendar",id);
    }
    validateEndDate=function(mili,id){
      if($("#endByRadio").is(":checked")){
      var now = new Date();
      var startDate = $("#rangeStartIn").val();
      var mil=getUTC(startDate);
      if(isNaN(mil)){}
      else if(mil>mili)
        triggerError("End Date > Start Date",id); 
      else if(isNaN(mili)||mili<now.getTime())
        triggerError("Incorrect Date",id);
    }
    }
    startTimeGetter=function(){
        var hours = getHour();
        var minutes=$("#minutes").val();
        var mili= (minutes*60000)+(hours*3600000);
        var start = getUTC($("#rangeStartIn").val());
        start+=mili;
        validateStartDate(start,"#rangeStartIn");
        return start;
    }
     endTimeGetter=function(){
      var end =getUTC($("#endByIn").val());
      validateEndDate(end,"#endByIn");
        return end;
    }

      setParameters = function(){

         parameters = {
                  name:  $("#nameIn").val(),
                  title:  $("#nameIn").val(),
                  desc:  $("#nameIn").val(),
                  schedRef: sharedUuid,
                  group:myself.group ? myself.group : "Default Schedule Group",
                  requestedMimeType: "text/xml",
                  actionRefs: myself.solution + "/" + myself.path + "/" + myself.action,
                  schedulerAction: "doAddScheduleAndContent"
                };

      error=false;                               
      var choice= $("#recurrId").val();
      var name=$("#nameIn").val();
      if(name=="")
        triggerError("You must choose a name","#nameIn");
      parameters["name"]=name;
      switch (choice)
      {

         case "once":
         var hours = getHour();
        var minutes=$("#minutes").val();
        var mili= (minutes*60000)+(hours*3600000);
        var start = getUTC($("#startDateIn").val());
        start+=mili;
        validateStartDate(start,"#startDateIn"); 
        parameters["start-date-time"]=start;
        parameters["repeat-time-millisecs"]=0;
        parameters["repeat-count"]=0;
        break;

        case "seconds":
        var start = startTimeGetter();
        parameters["start-date-time"]=start;
        var repeatSec=$("#recurrPatternInSec").val();
          if(repeatSec<1)
            triggerError(">0","#recurrPatternInSec");
        parameters["repeat-time-millisecs"]=repeatSec*1000;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter()
        break;

        case "minutes":
        var start = startTimeGetter();
        parameters["start-date-time"]=start;
        var repeatMin=$("#recurrPatternInMin").val();
          if(repeatMin<1)
            triggerError(">0","#recurrPatternInMin");
        parameters["repeat-time-millisecs"]=repeatMin*60000;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter()
        break;

        case "hours":
        var start = startTimeGetter();
        parameters["start-date-time"]=start;
        var repeatHour=$("#recurrPatternInHour").val();
          if(repeatHour<1)
            triggerError(">0","#recurrPatternInHour");
        parameters["repeat-time-millisecs"]=repeatHour*3600000;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter();
        break;

        case "daily":
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter();
        if($("#weekDayRadio").is(":checked")){
          parameters["cron"]=cronThis();
        }
        else if($("#dayRadio").is(":checked")){ 
          var repeatDays=$("#recurrPatternInDay").val();
          if(repeatDays<1)
            triggerError(">0","#recurrPatternInDay");
          parameters["repeat-time-millisecs"]=repeatDays*86400000;
          var start = startTimeGetter();
        parameters["start-date-time"]=start;
        }
        break;

        case "weekly":
        parameters["cron"]=cronThis();
        var start = startTimeGetter();
        parameters["start-date-time"]=start;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter();
        break;

        case "monthly":
        parameters["cron"]=cronThis();
        var start = startTimeGetter();
        parameters["start-date-time"]=start;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter();
        break;

        case "yearly":
        parameters["cron"]=cronThis();
        var start = startTimeGetter();
        parameters["start-date-time"]=start;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter();
        break;

        case "cron":
        var cronString=$("#cronString").val();
        validateCron(cronString);
        parameters["cron"]=cronString;
        var start = getUTC($("#rangeStartIn").val());
        parameters["start-date-time"]=start;
        if($("#endByRadio").is(":checked"))
          parameters["end-date-time"]=endTimeGetter();
        break;
      }
    }

    validateCron=function(cron){
      var arr=cron.split(" ");//7 elements - sec min hour dayOfMonth month dayOfWeek year
      if(arr.length<7)
        triggerError("Cron Expression too short","#cronString");
      else if(arr.length>7)
        triggerError("Cron Expression too long","#cronString");
      else if((arr[3]!="?"&&arr[3]!="*")&&(arr[5]!="?"&&arr[5]!="*"))
        triggerError("M+W unsuported.(M+? or W+?)","#cronString");//day of month and day of week not suported at the same time


    }
    hideAll = function(){
        $("#rangeOfRecurrDiv").hide();
        $("#cronDiv").hide();
        $("#recurrPatternDiv").hide();
        $("#startTimeDiv").hide();
        $("#rangeOfRecurrOnceDiv").hide();
        $("#patternSec").hide();
        $("#patternMin").hide();
        $("#patternHour").hide();
        $("#patternDay").hide();
        $("#patternWeek").hide();
        $("#patternMonth").hide();
        $("#patternYear").hide();
    }
    changeOpts= function(){
      var choice= $("#recurrId").val();
      hideAll();
      switch (choice)
      {
        case "once":
        $("#startTimeDiv").show();
        $("#rangeOfRecurrOnceDiv").show();
        break;
        case "seconds":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternSec").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "minutes":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternMin").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "hours":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternHour").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "daily":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternDay").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "weekly":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternWeek").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "monthly":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternMonth").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "yearly":
        $("#startTimeDiv").show();
        $("#recurrPatternDiv").show();
        $("#patternYear").show();
        $("#rangeOfRecurrDiv").show();
        break;
        case "cron":
        $("#cronDiv").show();
        $("#rangeOfRecurrDiv").show();
        break;

      }

    }


    var monthOpts = '<option value="1">January</option>'+'<option value="2">February</option>'+
          '<option value="3">March</option>'+'<option value="4">April</option>'+
          '<option value="5">May</option>'+'<option value="6">June</option>'+
          '<option value="7">July</option>'+'<option value="8">August</option>'+
          '<option value="9">September</option>'+'<option value="10">October</option>'+
          '<option value="11">November</option>'+'<option value="12">December</option>';
    var weekOpts = '<option value="sunday">sunday</option>'+'<option value="monday">monday</option>'+
          '<option value="tuesday">tuesday</option>'+'<option value="wednesday">wednesday</option>'+
          '<option value="thursday">thursday</option>'+'<option value="friday">friday</option>'+
          '<option value="saturday">saturday</option>';
    var errorMessage = '<label id="err" style="display:none">Incorrect Input</label>';
    var nameDiv= '<div id="nameDiv"><form style="display:inline-block" id="nameForm"><span class="dialog-label">Name:</span><input id="nameIn" type="text" value="' + this.action + ' Schedule"></form></div>';
    var groupDiv= '<div id="groupDiv"><form style="display:inline-block" id="groupForm"><span class="dialog-label">Group:</span><input id="groupIn" type="text" value=""></form></div>';
    var descriptionDiv= '<div><form style="display:inline-block" id="descForm"><span class="dialog-label">Description:</span><input id="descIn" type="text" value=""></form></div>';
    var recurrenceDiv = '<div>'+
    '<br><span class="dialog-title" style="width: 100px; display: inline-block;">Recurrence:</span>'+
    '<select id="recurrId" onChange="changeOpts()" style="margin-left: 0px;">'+
    '<option value = "once" selected>Run Once</option>'+
    '<option value = "seconds">Seconds</option>'+
    '<option value = "minutes">Minutes</option>'+
    '<option value = "hours">Hours</option>'+
    '<option value = "daily">Daily</option>'+
    '<option value = "weekly">Weekly</option>'+
    '<option value = "monthly">Monthly</option>'+
    '<option value = "yearly">Yearly</option>'+
    '<option value = "cron">Cron</option></select></br></div>';

    var cronString='<div id="cronDiv"  style="display:none"><form><span class="dialog-label">Cron String:</span><input id="cronString" type="text" value=""></form></div>';
    var hours = makeSelect(1,12,1,"hours");
    var minutes = makeSelect(0,59,1,"minutes");
    var amPm='<select id = "amPm"><option value="am">AM</option><option value="pm">PM</option></select>';
    var startTime = '<div id="startTimeDiv"><br><span class="dialog-title" style="width: 100px; display: inline-block;">Start Time:</span>'+hours+minutes+amPm+'</div>';
    //var startDate='<div id="startDateDiv"><form>Start Date : <input id= "startDateIn" type="text" value=""></form></div>';
    var recurrencePattern='<div id="recurrPatternDiv" style = "display:none">'+
    '<div id="patternSec" >'+
      '<label style="display:inline-block; margin-left: 100px; font-weight: 500;">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternInSec" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> second(s)</label>'+
    '</div>'+
    '<div id="patternMin" >'+
      '<label style="display:inline-block; margin-left: 100px; font-weight: 500;">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternInMin" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> minute(s)</label>'+
    '</div>'+
    '<div id="patternHour" >'+
      '<label style="display:inline-block; margin-left: 100px; font-weight: 500;">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternInHour" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> hour(s)</label>'+
    '</div>'+
    '<div id="patternDay" >'+
      '<input type="radio" name ="day" value="day" id="dayRadio" style="margin-left: 100px; font-weight: 500;" checked> <label style="display:inline-block">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternInDay" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> day(s)</label></br>'+
      '<input type="radio" name ="day" value="weekDay" id="weekDayRadio" style="margin-left: 100px;"> Every weekday'+
    '</div>'+
    '<div id="patternWeek" >'+
      '<form>'+'<div id="errorCheckboxes" style="display:none"><label id="errWeek">Choose at least one week</label></div>'+
      '<input type="checkbox" name="weekday" value="monday" id="monday" style="margin-left: 100px;"> Monday'+
      '<input type="checkbox" name="weekday" value="tuesday" id="tuesday"> Tuesday'+
      '<input type="checkbox" name="weekday" value="wednesday" id="wednesday"> Wednesday'+
      '<input type="checkbox" name="weekday" value="thursday" id="thursday"> Thursday'+'</br>'+
      '<input type="checkbox" name="weekday" value="friday" id="friday" style="margin-left: 100px;"> Friday'+
      '<input type="checkbox" name="weekday" value="saturday" id="saturday"> Saturday'+
      '<input type="checkbox" name="weekday" value="sunday" id="sunday"> Sunday'+
      '</form>'+
    '</div>'+
    '<div id="patternMonth" >'+
      '<input id="monthRadio" type="radio" name ="month" value="day" style="margin-left: 100px;" checked> <label style="display:inline-block; font-weight: 500;">Day</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternIn" type="text" size="3" style="width:205px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> of every month</label></br>'+
      '<input type="radio" name ="month" value="the" style="margin-left: 100px;"> <label style="display:inline-block; font-weight: 500;">The</label>&nbsp;&nbsp;'+
        '<select id="monthOpt1Select">'+'<option value="1">first</option>'+'<option value="2">second</option>'+
          '<option value="3">third</option>'+'<option value="4">fourth</option>'+
          '<option value="5">last</option>'+
        '</select>'+
        '<select id="monthOpt2Select">'+weekOpts+
        '</select><label style=" font-weight: 500;"> of every month</label>'+
    '</div>'+
    '<div id="patternYear" >'+
      '<input id ="yearRadio" type="radio" name ="year" value="month" style="margin-left: 100px;" checked> <label style="display:inline-block; font-weight: 500;">Every</label>&nbsp;'+
      '<select id="yearEveryMonth">'+monthOpts+
        '</select><input id="yearDayMonth"type="text" size="3">'+'</br>'+
      '<input type="radio" name ="year" value="the" style="margin-left: 100px;"> <label style="display:inline-block; font-weight: 500;">The</label>&nbsp;'+
        '<select id="yearOpt1Select">'+'<option value="1">first</option>'+'<option value="2">second</option>'+
          '<option value="3">third</option>'+'<option value="4">fourth</option>'+
          '<option value="5">last</option>'+
        '</select>'+
        '<select id="yearOpt2Select">'+weekOpts+
        '</select><label style=" font-weight: 500;">of&nbsp;&nbsp;</label>'+
        '<select id="yearMonthSelect">'+monthOpts+'</select>'+
    '</div>'+
    '</div>';
   var rangeOfRecurrence='<div id="rangeOfRecurrDiv" style="display:none"><br><span class="dialog-title"><strong>Range of Recurrence:</strong> </span>'+
    '<form><span class="dialog-label">Start:</span><input type="text" id="rangeStartIn"></form>'+
    '<form><span class="dialog-label">End:</span><input type="radio" name ="end" value="noEnd" checked> No end date'+
    '</br><input type="radio" name ="end" value ="endBy" id="endByRadio" style="margin-left:100px;"> End by:&nbsp;&nbsp;'+
    '<input id= "endByIn" type="text" style="width:187px;"></form>'+
    '</div>';
   var rangeOfRecurrenceOnce='<div id="rangeOfRecurrOnceDiv"><form><span class="dialog-label">Start Date:</span><input id= "startDateIn" type="text" value=""></form></div>';


    var mailInfo = '<form><span class="dialog-label">To (Email):</span><input id="to" type="text" value=""></form>';
  

        var fullPage = "";
        if ($.inArray(this.adminRole ? this.adminRole : "Admin", Dashboards.context.roles) >= 0)
            fullPage= nameDiv+mailInfo+recurrenceDiv+cronString+startTime+recurrencePattern+ rangeOfRecurrence+rangeOfRecurrenceOnce;
        else {
            //Build selector
            var subscriptionSelector = "<span class='dialog-label'>Subscription: </span><select name='subscriptionSelector' id='subscriptionSelector'>";
            var x = $.ajaxSettings.async;
            $.ajaxSetup({ async: false });
            $.getJSON("getSchedules", {solution: this.solution, path: this.path, action:this.action},
                function(response) {
                    for (var i=0; i < response.length; i++) {
                        if (response[i]) {
                            subscriptionSelector += "<option value='" + response[i].id + "'>" + response[i].name + "</option>";
                        }
                    }
                },'text');
            $.ajaxSetup({ async: x });
            subscriptionSelector += "</select>";
            fullPage = nameDiv + mailInfo + subscriptionSelector;
        }       

        var myself = this;
      var promp = {

      basicState : {
        html: fullPage, 
        title: "Schedule Report",
        buttons: {
          "Cancel" : -1,
          "Ok" : 1
        },
        submit: function(e,v,m,f){

          sharedUuid= guid();
          if(e==-1) {$.prompt.close();}
          else if(e==1){
            setParameters();
                  if(error){
                    parameters={};
                   return false;
                  }
                    

                var parameters2 = {
                  path : myself.path,
                  solution: myself.solution,
                  name : myself.action,
                  subscribe : true,
                  "subscription-name" :  $("#nameIn").val(),
                  "schedule-id" : sharedUuid,
                  showParameters : myself.showParameters,
                  htmlProportionalWidth : false,
                  "accepted-page":-1,
                  "output-target":  myself.outputTarget ? myself.outputTarget: "table/html;page-mode=page",
                  renderMode : "SUBSCRIBE"
                };

                for (var i = 0; i < myself.parameters.length; i++) {
                    var param = myself.parameters[i];
                    parameters2[param[0]] = param[1];
                }

                if ($("#to").val().length > 0 ) {
                    parameters2.destination = $("#to").val();
                }

var success = false;
            var x = $.ajaxSettings.async;
            $.ajaxSetup({ async: false });

 if ($.inArray(this.adminRole ? this.adminRole : "Admin", Dashboards.context.roles)>= 0){

                $.post("../../SubscriptionAdminService", parameters,
                  function(xml) {
                    if (xml &&
                        xml.documentElement &&
                        xml.documentElement.attributes['result'] &&
                        xml.documentElement.attributes['result'].nodeValue == 'OK') {
                        //get schedule id
                        var scheduleId = sharedUuid;
                        $.getJSON("getSchedules", {solution: myself.solution, path: myself.path, action:myself.action},
                            function(response) {
                                for (var i=0; i < response.length; i++) {
                                    if (response[i]) {
                                        if (response[i].name == $("#nameIn").val())
                                            scheduleId = response[i].id;
                                    }
                                }
                            },'text');                        
                            parameters2["schedule-id"] = scheduleId;
                        $.get("../../content/reporting", parameters2,
                          function(response) {
                            alert(response);
                            success = response == 'Public Schedule saved/created';
                          },'text');                
                    } else {
                        alert('Error while creating schedule');
                    }
                  },'xml');
                
} else {

parameters2["schedule-id"] = $("#subscriptionSelector").val();
$.get("../../content/reporting", parameters2,
function(response) {
alert(response);
success = response == 'Public Schedule saved/created';
},'text');


}

            $.ajaxSetup({ async: x });
            return success;           
          }
      }
    }/*,

      doneState : {

        html: "Report Scheduled", 
        title: "Schedule Report",
        buttons: {"Ok" : true},
        submit: function(e,v,m,f){
        }
      }
    */
  };
      $.prompt(promp, {classes: 'scheduler'});
      $(".scheduler #jqi").css("width", "510px");
      $(document).ready(function(ev) {
        $("#startDateIn").datepicker({minDate:0});
        $("#rangeStartIn").datepicker({minDate:0});
        $("#endByIn").datepicker({minDate:0});
         $("#startDateIn").datepicker("setDate",new Date());
        $("#rangeStartIn").datepicker("setDate",new Date());

});
      
}


});

var ExecutePrptComponent = PrptComponent.extend({
  visible: false,
 
  update : function() {
    // 2 modes of working; if it's a div, create a button inside it
    var myself = this;
    var o = $("#"+ this.htmlObject);
    if ($.inArray(o[0].tagName.toUpperCase(),["SPAN","DIV"]) > -1){
      // create a button
      o = $("<button/>").appendTo(o.empty());
      if (o[0].tagName=="DIV") o.wrap("<span/>");
      if (this.label != undefined) o.text(this.label);
      o.button();
    }
    o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
    o.bind("click", function(){
      var success = typeof(myself.preChange)=='undefined' ? true : myself.preChange();
      if(success) {
        myself.executePrptComponent();
      }
      typeof(myself.postChange)=='undefined' ? true : myself.postChange();
    });
  },
 
  executePrptComponent: function(){
 
    var options = this.getOptions();
    var ts = "ts=" + new Date().getTime() + "&";
  var url = webAppPath + '/api/repos/' + options.path.replace(/\//g, ':') + '/viewer?' + ts;
    var a=[];
    var encodeArray = function(k,v) {
      var arr = [];
      for (var i = 0; i < v.length;i++) {
        arr.push(encodeURIComponent(k)+'='+encodeURIComponent(v[i]));
      }
      return arr;
    };
    $.each(options,function(k,v){
      if (typeof v == 'object') {
        a.push.apply(a,encodeArray(k,v));
      } else {
        a.push(encodeURIComponent(k)+"="+encodeURIComponent(v));
      }
    });
    $.fancybox({
      type:"iframe",
      href: url + "?"+ a.join('&') ,
      width: $(window).width(),
      height:$(window).height() - 50
    });
 
  }
}
);

var AnalyzerComponent = BaseComponent.extend({

  update: function(){

    this.clear();

    var options = this.getOptions();
    var url = webAppPath + '/content/analyzer/';
    var myself=this;

    // enable editing the view?
    this.viewOnly?url+='viewer':url+='editor';

    var height = this.height? this.height: "480px";
    var width = this.width? this.width: "100%";

    var iFrameHTML = this.generateIframe(this.htmlObject,url,options,height,width);
    $("#"+this.htmlObject).html(iFrameHTML);
  },

  getOptions: function() {

    var options = {
      solution : this.solution,
      path: this.path,
      action: this.action,
      command: this.command == undefined? "open": this.command,
      showFieldList: this.showFieldList == undefined? false: this.showFieldList,
      showRepositoryButtons: this.showRepositoryButtons == undefined? false: this.showRepositoryButtons,
      frameless: this.frameless
    };

    // process params and update options
    $.map(this.parameters,function(k){
      options[k[0]] = k.length==3?k[2]: Dashboards.getParameterValue(k[1]);
    });

    return options;
  },

  generateIframe: function(htmlObject,url,parameters,height,width) {
    var iFrameHTML = '<iframe id="iframe_'+ htmlObject + '"' +
    ' frameborder="0"' +
    ' height="' + height + '"' +
    ' width="' + width + '"' +
    ' src="' + url + "?";

    iFrameHTML += $.param(parameters, true);
    iFrameHTML += "\"></iframe>";
    
    return iFrameHTML;
  }
});

var ExecuteXactionComponent = BaseComponent.extend({
  visible: false,

  update : function() {
    // 2 modes of working; if it's a div, create a button inside it
    var myself = this;
    var o = $("#"+ this.htmlObject);
    if ($.inArray(o[0].tagName.toUpperCase(),["SPAN","DIV"]) > -1){
      // create a button
      o = $("<button/>").appendTo(o.empty());
      if (o[0].tagName=="DIV") o.wrap("<span/>");
      if (this.label != undefined) o.text(this.label);
      o.button();
    }
    o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
    o.bind("click", function(){
      var success = typeof(myself.preChange)=='undefined' ? true : myself.preChange();
      if(success) {
        myself.executeXAction();
      }
      typeof(myself.postChange)=='undefined' ? true : myself.postChange();
    });
  },

  executeXAction : function() {
    //var url = webAppPath + "/ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.action + "&"; //legacy
  var ts = "ts=" + new Date().getTime() + "&";
  var url = webAppPath + "/api/repos/" + this.path.replace(/\//g, ':') + "/xaction?" + ts;

    var p = new Array(this.parameters.length);
    var parameters = [];

    for(var i= 0, len = p.length; i < len; i++){
      var key = this.parameters[i][0];
      var value = Dashboards.getParameterValue(this.parameters[i][1]);

      if($.isArray(value)) {
        $(value).each(function(p) {
          parameters.push(key + "=" + encodeURIComponent(this));
        });
      }
      else {
        parameters.push(key + "=" + encodeURIComponent(value));
      }
    }

    url += parameters.join("&");

    var _href = url.replace(/'/g,"&#39;");
    $.fancybox({
      type:"iframe",
      href:_href,
      width: $(window).width(),
      height:$(window).height() - 50
    });
  }

});

