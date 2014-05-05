/*
 * corePentaho.js
 *
 * Includes all components relating to XActions, PRPTs, JPivot, and other
 * Pentaho-owned technologies.
 */
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

  update: function(){
 
    this.clear();
 
    var options = this.getOptions();
    //options.showParameters = false;

    if(options["dashboard-mode"]){
      //IFrame = False, showParameters always false.
      if(options.showParameters) {
        Dashboards.log("showParameters not supported with IFrame = False");
      }
      var ts = "ts=" + new Date().getTime() + "&";
      var url = webAppPath + '/api/repos/' + options.path.replace(/\//g, ':') + '/report?' + ts;
      var myself=this;
      $.ajax({
        url: url,
        data: options,
        dataType:"html",
        success: function(json){
          $("#"+myself.htmlObject).html(json);
        }
      });
    }
    else{
      var callVar = options.showParameters ? 'viewer' : 'report';
      var ts = "ts=" + new Date().getTime() + "&";
      var url = webAppPath + '/api/repos/' + options.path.replace(/\//g, ':') + '/' + callVar + '?' + ts;
      var encodeArray = function(k,v) {
        var arr = [];
        for (var i = 0; i < v.length;i++) {
          arr.push(encodeURIComponent(k)+'='+encodeURIComponent(v[i]));
        }
        return arr;
      };
      var a=[];
      $.each(options,function(k,v){
        if (typeof v == 'object') {
          a.push.apply(a,encodeArray(k,v));
        } else {
          a.push(encodeURIComponent(k)+"="+encodeURIComponent(v));
        }
      });
      /*
       * We really shouldn't mess around with the CDF running call counter,
       * but if we don't do so in this case, the report will count as "finished"
       * even though nothing has been loaded into the iframe. We'll increment it
       * here,decrement it again from the iframe's onload event.
       */
      var myself = this;
      if(!this.loading){
        this.loading = true;
        Dashboards.incrementRunningCalls();
      }
      var iframe = $("<iframe style='width:100%;height:100%;border:0px' frameborder='0' border='0' />");
      iframe.load(function(){
        /* This is going to get called several times with "about:blank"-style pages.
         * We're only interested in the one call that happens once the page is _really_
         * loaded -- which means an actual document body.
         */
        if(this.contentWindow.document.body.innerHTML){
          myself.loading = false;
          Dashboards.decrementRunningCalls();
        }
      });
      $("#"+this.htmlObject).empty().append(iframe);
      iframe[0].contentWindow.location = url + "?"+ a.join('&');
    }
  },
 
  getOptions: function(){
 
    var options = {
      paginate : this.paginate || false,
      showParameters: this.showParameters || false,
      autoSubmit: (this.autoSubmit || this.executeAtStart) || false,
      "dashboard-mode": this.iframe==undefined?false:!this.iframe,
      solution: this.solution,
      path: this.path,
      action: this.action
    };
    if(this.paginate){
 
      options["output-target"] = "table/html;page-mode=page";
    } else {
      options["output-target"] = "table/html;page-mode=stream";
    }
 
    // process params and update options
    $.map(this.parameters,function(k){
      options[k[0]] = Dashboards.getParameterValue(k[1]);
    });
 
    options["output-type"] = "";
 
    return options;

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

      if($.isArray(value))
        $(value).each(function(p) {
          parameters.push(key + "=" + encodeURIComponent(this));
        });
      else
        parameters.push(key + "=" + encodeURIComponent(value));
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

