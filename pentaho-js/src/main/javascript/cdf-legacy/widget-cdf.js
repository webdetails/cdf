/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


var deps = ["dashboards/oss-module", "dashboards/dashboard-module"];

if(document.location.href.indexOf("debug=true") > 0) {
  deps = ["dashboards/oss-module", "dashboards/pentaho-dashboard-controller"];
}

define("cdf/widget-cdf", deps,
  function(ossm, pdc) {

  PentahoCdfComponent = BaseComponent.extend({
    staticParameters: true,
    type: "PentahoCdfComponent",
    iconImgSrc: '../../../../../../../content/pentaho-cdf/resources/cdfFileType.png',
    executeAtStart: true,
    options: {
      "showParameters": false
    },
    isDirty: false,
    setDirty: function(isDirty) {
      this.isDirty = isDirty;
    },
    outputParameters: [],

    update: function() {
      var cdfRef = this.genXaction();
      var pathId = ":" + cdfRef.replace(/\//g, ":");
      pathId = pathId.replace("#", "%23");
      pathId = pathId.replace("{", "%7B");
      pathId = pathId.replace("}", "%7D");
      pathId = pathId.replace("<", "%3C");
      pathId = pathId.replace(">", "%3E");
      pathId = pathId.replace("+", "%2B");

      var me = this,
        url = webAppPath + "/api/repos/" + pathId + "/generatedContent";

      if(!this.parameters) {
        this.parameters = "";
      }

      for(var i = 0; i < this.parameters.length; i++) {
        var key = this.parameters[i][0];
        var value = this.parameters[i][1] == ""
          ? this.parameters[i][2]
          : Dashboards.getParameterValue(this.parameters[i][1]);
        if(value == "NIL") {
          value = this.parameters[i][2];
        }
        if(i == 0) {
          url += "?";
        } else {
          url += "&";
        }
        url += encodeURIComponent(key) + "=" + encodeURIComponent(value);
      }

      $("#" + me.htmlObject).html("<iframe style='width:100%;height:100%;border:0px' frameborder='0' border='0' src='" + url + "'/>");
    },

    // gets the runUrl and paramServiceUrl from the server then alerts the caller via the callback
    setSolutionPathAction: function(solution, path, action, callback) {

      this.solution = solution;
      this.path = path;
      this.action = action;

      // parameter service url from file details; tells us how to render the content;
      var paramServiceUrl = '';
      var runUrl = '';
      var cdfRef = this.genXaction();
      // get the base url so that we can call the sol repo service
      // save a reference to this for use in nested functions
      var thisComponent = this;
      var pathId = ":" + cdfRef.replace(/\//g, ":");
      callback.onfinish();
    },

    genXaction: function() {
      var gen = this.solution == null ? '' : this.solution;
      if(this.path != null) {
        if(gen.length > 0 && gen.substr(gen.length - 1, 1) != '/') {
          gen += '/';
        }
        gen += this.path;
      }
      if(this.action != null) {
        if(gen.length > 0 && gen.substr(gen.length - 1, 1) != '/') {
          gen += '/';
        }
        gen += this.action;
      }
      return gen;
    },

    getGUID: function() {
      if(this.GUID == null) {
        this.GUID = WidgetHelper.generateGUID();
      }
      return this.GUID;
    }
  });
  PentahoCdfComponent.newInstance = function(cdfRef, localizedFileName) {
    try {
      var widget = new PentahoCdfComponent();
      widget.GUID = WidgetHelper.generateGUID();
      widget.localizedName = localizedFileName;
      // used in GWT properties panel
      widget.iframe = true;
      widget.autoSubmit = true;
      widget.parameters = [];
      var selectedWidgetIndex = pentahoDashboardController.getSelectedWidget();
      widget.name = 'widget' + selectedWidgetIndex;
      widget.htmlObject = 'content-area-Panel_' + selectedWidgetIndex;
      var vals = XActionHelper.parseXaction(cdfRef);

      widget.xactionPath = cdfRef;
      widget.setSolutionPathAction(
        vals[0],
        vals[1],
        vals[2],
        new function() {
          this.onfinish = function() {
            //widget.refreshParameters();
            currentWidget = widget;

            var details = XActionHelper.genXaction(widget.solution, widget.path, widget.action);
            PropertiesPanelHelper.initPropertiesPanel(details);
          };
        });
    } catch(e) {
      alert(e);
    }
  }

  PentahoDashboardController.registerComponentForFileType("xcdf", PentahoCdfComponent);
  PentahoDashboardController.registerWidgetType(new PentahoCdfComponent());

});
