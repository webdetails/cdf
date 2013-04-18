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
    jpivotHTML += webAppPath + "/ViewAction?solution="	+ this.solution + "&path=" + 	this.path + "&action="+ this.action;

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
    
    var a="second (0-59)";


    timeSwitcher= function(){
      var e= $("#time").val();
      var tag="";
      if(e=="minute")
        tag="second (0-59)";
      else if(e=="hour")
        tag="minute (0-59)";
      else if(e=="day")
        tag="hour (0-23)";
      else if(e=="week")
        tag="day of the week (1-7)";

      $('#suffix').text(tag);
    }


    var basicStateHtml = ' <select id= "time" onChange="timeSwitcher()";>'+
        '<option value="minute" selected >Every Minute</option>'+
        '<option value="hour">Every Hour</option>'+
        '<option value="day">Every Day</option>'+
        '<option value="week">Every Week</option>'+
        '</select>'+
        '<form>on the<input type="text" name="onThe" value=""></form><label>'+
       '<div id="suffix">'+a+'</div>'+'</label>'+
        '<br/>'+
        '<form>to: <input type="text" name = "to" value=""></form><br/>'+
        '<form>cc: <input type="text" name = "to" value=""></form>';
    var advancedStateHtml ='<form>Cron Expression: <input type="text" name = "to"></form>';

      var promp = {

      basicState : {
        html: basicStateHtml, 
        title: "Schedule Report",
        buttons: {
          "Advanced": 0,
          "Cancel" : -1,
          "Ok" : 1
        },
        submit: function(e,v,m,f){

          if(e==0){
            $.prompt.goToState('advancedState');
            return false;
          }
          else if(e==-1) {$.prompt.close();}
          else{
            $.prompt.close();
            }
        }
      },
      advancedState : {
        html: advancedStateHtml,
        title: "Schedule Report",
        buttons: {
          "Basic":0,
          "Cancel" : -1,
          "Ok" : 1
        },
        submit: function(e,v,m,f){
          if(e==0){
            $.prompt.goToState('basicState');
            return false;
          }
          else if(e==-1) $.prompt.close();
          else
            {
              $.prompt.close();
            }
        }
      }
    };
      $.prompt(promp);

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

