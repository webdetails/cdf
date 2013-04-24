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
          var jXML = Dashboards.callPentahoAction(myself,this.solution, this.path, this.action, p,null);

          if(jXML != null){
            $('#'+myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
          }
        } else {
          var html = Dashboards.pentahoServiceAction(this.serviceMethod, 'html', this.solution, this.path, this.action, p, null);
          $('#'+myself.htmlObject).html(html);
        }

      } else {
        var xactionIFrameHTML = "<iframe id=\"iframe_"+ this.htmlObject + "\"" +
        " frameborder=\"0\"" +
        " height=\"100%\"" +
        " width=\"100%\" />";        
        var iframe = $(xactionIFrameHTML);        
        var url = webAppPath + "/ViewAction?wrapper=false" +
              "&solution=" + this.solution +
              "&path=" + this.path +
              "&action="+ this.action;

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
    jpivotHTML += webAppPath + "/ViewAction?solution="  + this.solution + "&path=" +  this.path + "&action="+ this.action;

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
  update : function() {
    var title = this.tooltip==undefined?"View details in a Pivot table":this.tooltip;
    // WPG: this assumes name is global name, can I pass in the object directly instead?
    var link = $('<a class="pivotLink"> </a>').html(this.content).attr("href","javascript:PivotLinkComponent.openPivotLink("+ this.name +")").attr("title",title);

    $("#"+this.htmlObject).empty();
    $("#"+this.htmlObject).html(link);

    $('a.pivotLink').tooltip({
      showURL: false,
      track:true,
      delay: 1000,
      opacity: 0.5
    });
  }
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
      var url = webAppPath + '/content/reporting';
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

        var url = webAppPath + '/content/reporting';
        this._postToUrl(htmlObj, iframe, url, options, this.getIframeName());

      } else {

        var url = webAppPath + '/content/reporting/reportviewer/report.html' + "?" + $.param(options);

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
      guid = function(){
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
        function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);  
        });

    }
    triggerError = function(msg,id){

$(id).css("backgroundColor","red");
var temp = $(id).val();
$(id).val(msg);

setTimeout(function(){$(id).css("backgroundColor","white");
$(id).val(temp);},2000);


    }
    cronThis = function(exp){
      var cron=exp;
      var minute=$("#minutes").val();
      var hour=$("#hours").val();
      if($("#amPm").val()=="pm")
        hour+=12;
      var array =cron.split("/");//
      var day=array[1];
      var month = array[0];
      var year = array[2];
      var choice= $("#recurrId").val();
      var week="?";
      switch(choice)
      {
        case "daily":
        week="mon-fri";
        break;
        case "weekly":
        if ($("#monday").attr("checked")=="checked")
          week+=",monday";
        if ($("#tuesday").attr("checked")=="checked")
          week+=",tuesday";
        if ($("#wednesday").attr("checked")=="checked")
          week+=",wednesday";
        if ($("#thursday").attr("checked")=="checked")
          week+=",thursday";
        if ($("#friday").attr("checked")=="checked")
          week+=",friday";
        if ($("#saturday").attr("checked")=="checked")
          week+=",saturday";
        if ($("#sunday").attr("checked")=="checked")
          week+=",sunday";
        week.replace("\?","");
        week.replace(",","");
        break;
        case "monthly":
        if($("#monthRadio").attr("checked")==checked)
        {

        }
        else
        {

        }
        break;
        case "yearly":
        if($("#yearRadio").attr("checked")==checked)
        {

        }
        else
        {

        }
        break;

      }

      var builtCron = minute+" "+hour+" ";

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
    startTimeGetter=function(){
        var hours = $("#hours").val();
         if($("#amPm").val()=="pm")
          hours+=12;
        var minutes=$("#minutes").val();
        var mili= (minutes*60000)+(hours*3600000);
        var start = Date.UTC($("#rangeStartIn").val().replace("/",","));
        return start+mili;
    }
     endTimeGetter=function(){
        return Date.UTC($("#endByIn").val().replace("/",","));
    }

      setParameters = function(){
        parameters= {};
     var choice= $("#recurrId").val();
      parameters[name]=$("#nameIn").val();
      parameters[to]=$("#to").val();
      var now = new Date();
      switch (choice)
      {
         case "once":
         var hours = $("#hours").val();
         if($("#amPm").val()=="pm")
          hours+=12;
        var minutes=$("#minutes").val();
        var mili= (minutes*60000)+(hours*3600000);
        var start = Date.UTC($("#startDateIn").val().replace("/",","));
        start+=mili;
        if(!(start>now)){
          triggerError("Incorrect Input","#startDateIn");
          return "err";
          }                                                   //XXX encode the errors ASAP
        parameters["start-date-time"]=mili+start;
        break;
        case "seconds":
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        parameters["repeat-time-millisecs"]="452452";
        parameters["end-date-time"]=endTimeGetter()
        break;
        case "minutes":
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        parameters["repeat-time-millisecs"]="";
        parameters["end-date-time"]=endTimeGetter()
        break;
        case "hours":
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        parameters["repeat-time-millisecs"]="42542";
        parameters["end-date-time"]=endTimeGetter();
        break;
        case "daily":
        if($("#endByRadio").attr("checked")==checked)
          parameters["end-date-time"]=endTimeGetter();
        if($("#weekDayRadio").checked){
          parameters[cron]=cronThis($("#rangeStartIn").val());
        }
        else if($("#dayRadio").attr("checked")==checked){ 
          parameters["repeat-time-millisecs"]="654654      FIXME";
          var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        }
        break;
        case "weekly":
        parameters[cron]="13163123541602";
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        if($("#endByRadio").attr("checked")==checked)
          parameters["end-date-time"]=endTimeGetter();
        break;
        case "monthly":
        parameters[cron]="13163123541602";
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        if($("#endByRadio").attr("checked")==checked)
          parameters["end-date-time"]=endTimeGetter();
        break;
        case "yearly":
        parameters[cron]="13163123541602";
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        if($("#endByRadio").attr("checked")==checked)
          parameters["end-date-time"]=endTimeGetter();
        break;
        case "cron":
        parameters[cron]="13163123541602";
        var start = startTimeGetter();
        if(start<now)
          return "err";
        parameters["start-date-time"]=start;
        if($("#endByRadio").attr("checked")==checked)
          parameters["end-date-time"]=endTimeGetter();
        break;
      }
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


    var monthOpts = '<option value="january">January</option>'+'<option value="february">February</option>'+
          '<option value="march">March</option>'+'<option value="april">April</option>'+
          '<option value="may">May</option>'+'<option value="june">June</option>'+
          '<option value="july">July</option>'+'<option value="august">August</option>'+
          '<option value="september">September</option>'+'<option value="october">October</option>'+
          '<option value="november">November</option>'+'<option value="december">December</option>';
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

    var cronString='<div id="cronDiv"  style="display:none"><form><span class="dialog-label">Cron String:</span><input type="text" value=""></form></div>';
    var hours = makeSelect(1,12,1,"hours");
    var minutes = makeSelect(0,59,1,"minutes");
    var amPm='<select id = "amPm"><option value="am">AM</option><option value="pm">PM</option></select>';
    var startTime = '<div id="startTimeDiv"><br><span class="dialog-title" style="width: 100px; display: inline-block;">Start Time:</span>'+hours+minutes+amPm+'</div>';
    //var startDate='<div id="startDateDiv"><form>Start Date : <input id= "startDateIn" type="text" value=""></form></div>';
    var recurrencePattern='<div id="recurrPatternDiv" style = "display:none">'+
    '<div id="patternSec" >'+
      '<label style="display:inline-block; margin-left: 100px; font-weight: 500;">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternIn" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> second(s)</label>'+
    '</div>'+
    '<div id="patternMin" >'+
      '<label style="display:inline-block; margin-left: 100px; font-weight: 500;">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternIn" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> minute(s)</label>'+
    '</div>'+
    '<div id="patternHour" >'+
      '<label style="display:inline-block; margin-left: 100px; font-weight: 500;">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternIn" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> hour(s)</label>'+
    '</div>'+
    '<div id="patternDay" >'+
      '<input type="radio" name ="day" value="day" id="dayRadio" style="margin-left: 100px; font-weight: 500;" checked> <label style="display:inline-block">Every</label>&nbsp;&nbsp;'+
      '<form style="display:inline-block"><input id= "recurrPatternIn" type="text" size="3" style="width:30px;"></form>'+
      '<label style="display:inline-block; font-weight: 500;"> day(s)</label></br>'+
      '<input type="radio" name ="day" value="weekDay" id="weekDayRadio" style="margin-left: 100px;"> Every weekday'+
    '</div>'+
    '<div id="patternWeek" >'+
      '<form>'+
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
        '<select>'+'<option value="first">first</option>'+'<option value="second">second</option>'+
          '<option value="third">third</option>'+'<option value="fourth">fourth</option>'+
          '<option value="last">last</option>'+
        '</select>'+
        '<select>'+weekOpts+
        '</select><label style=" font-weight: 500;"> of every month</label>'+
    '</div>'+
    '<div id="patternYear" >'+
      '<input id ="yearRadio" type="radio" name ="year" value="month" style="margin-left: 100px;" checked> <label style="display:inline-block; font-weight: 500;">Every</label>&nbsp;'+
      '<select>'+monthOpts+
        '</select><input type="text" size="3">'+'</br>'+
      '<input type="radio" name ="year" value="the" style="margin-left: 100px;"> <label style="display:inline-block; font-weight: 500;">The</label>&nbsp;'+
        '<select>'+'<option value="first">first</option>'+'<option value="second">second</option>'+
          '<option value="third">third</option>'+'<option value="fourth">fourth</option>'+
          '<option value="last">last</option>'+
        '</select>'+
        '<select>'+weekOpts+
        '</select><label style=" font-weight: 500;">of&nbsp;&nbsp;</label>'+
        '<select>'+monthOpts+'</select>'+
    '</div>'+
    '</div>';
   var rangeOfRecurrence='<div id="rangeOfRecurrDiv" style="display:none"><br><span class="dialog-title"><strong>Range of Recurrence:</strong> </span>'+
    '<form><span class="dialog-label">Start:</span><input type="text" id="rangeStartIn"></form>'+
    '<form><span class="dialog-label">End:</span><input type="radio" name ="end" value="noEnd" checked> No end date'+
    '</br><input type="radio" name ="end" value ="endBy" id="endByRadio" style="margin-left:100px;"> End by:&nbsp;&nbsp;'+
    '<input id= "endByIn" type="text" style="width:187px;"></form>'+
    '</div>';
   var rangeOfRecurrenceOnce='<div id="rangeOfRecurrOnceDiv"><form><span class="dialog-label">Start Date:</span><input id= "startDateIn" type="text" value=""></form></div>';


    var mailInfo = '<form><span class="dialog-label">To:</span><input id="to" type="text" value=""></form>';
  

      //var fullPage= nameDiv+groupDiv+descriptionDiv+mailInfo+ recurrenceDiv+ startTime;
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

          if(e==-1) {$.prompt.close();}
          else if(e==1){
           
                  //schedule 
                  var sharedUuid= guid();
                var parameters = {};
                if ($.inArray(this.adminRole ? this.adminRole : "Admin", Dashboards.context.roles)>= 0){
                  
                    parameters = {
//                      name : $("#nameIn").val(),
                      title:  $("#nameIn").val(),
                      cron : "00 00 0 ? * 2,7",
                      desc:  $("#nameIn").val(),
                      "start-date-time": "1366628400000",
                      schedRef: sharedUuid,
                      group:myself.group ? myself.group : "Default Schedule Group",
                      requestedMimeType: "text/xml",
                      actionRefs: myself.solution + "/" + myself.path + "/" + myself.action,
                      schedulerAction: "doAddScheduleAndContent"

                    };
                }
                var parameters2 = {
                  path : myself.path,
                  solution: myself.solution,
                  name : myself.action,
                  subscribe : true,
                  destination: $("#to").val(),
                  "subscription-name" :  $("#nameIn").val(),
                  "schedule-id" : sharedUuid,
                  showParameters : myself.showParameters,
                  htmlProportionalWidth : false,
                  "accepted-page":-1,
                  "output-target":	myself.outputTarget ? myself.outputTarget: "table/html;page-mode=page",
                  renderMode : "SUBSCRIBE"

                };

                for (var i = 0; i < myself.parameters.length; i++) {
                    var param = myself.parameters[i];
                    parameters2[param[0]] = param[1];
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
    },

      doneState : {

        html: "Report Scheduled", 
        title: "Schedule Report",
        buttons: {"Ok" : true},
        submit: function(e,v,m,f){
        }
      }
    
  };
      $.prompt(promp);
      $("#jqi").css("width", "510px");
      $(document).ready(function(ev) {
        $("#startDateIn").datepicker({minDate:0});
        $("#rangeStartIn").datepicker({minDate:0});
        $("#endByIn").datepicker({minDate:0});

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
    var url = webAppPath + '/content/reporting/reportviewer/report.html';
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
    var url = webAppPath + "/ViewAction?solution=" + this.solution + "&path=" + this.path + "&action=" + this.action + "&";

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

