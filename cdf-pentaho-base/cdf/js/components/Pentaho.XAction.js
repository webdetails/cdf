/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
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
 *
 * Includes all components relating to XActions
 * Pentaho-owned technologies.
 *
 */

var XactionComponent = BaseComponent.extend({
    update: function() {
        var myself = this;
        try {
            if (typeof (this.iframe) == 'undefined' || !this.iframe) {
                // go through parameter array and update values
                var p = new Array(this.parameters ? this.parameters.length : 0);
                for (var i = 0, len = p.length; i < len; i++) {
                    var key = this.parameters[i][0];
                    var value = this.parameters[i][1] == "" ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
                    if (this.value == "NIL") {
                        this.value = this.parameters[i][2];
                    }
                    p[i] = [key, value];
                }
                if (typeof (this.serviceMethod) == 'undefined' || this.serviceMethod == 'ServiceAction') {
                    var jXML = Dashboards.callPentahoAction(myself, this.solution, this.path, this.action, p, null);
                    if (jXML != null) {
                        $('#' + myself.htmlObject).html(jXML.find("ExecuteActivityResponse:first-child").text());
                    }
                } else {
                    var html = Dashboards.pentahoServiceAction(this.serviceMethod, 'html', this.solution, this.path, this.action, p, null);
                    $('#' + myself.htmlObject).html(html);
                }
            } else {
                var xactionIFrameHTML = "<iframe id=\"iframe_" + this.htmlObject + "\"" +
                        " frameborder=\"0\"" +
                        " height=\"100%\"" +
                        " width=\"100%\" />";
                var iframe = $(xactionIFrameHTML);
                var url = wd.cdf.endpoints.getCdfXaction(this.path, this.action, this.solution) + "&wrapper=false";
                // Add args
                var p = new Array(this.parameters.length);
                for (var i = 0, len = p.length; i < len; i++) {
                    var arg = "&" + encodeURIComponent(this.parameters[i][0]) + "=";
                    var val = "";
                    if (this.parameters[i][1] == "") {
                        val = encodeURIComponent(this.parameters[i][2]);
                    } else {
                        val = encodeURIComponent(Dashboards.getParameterValue(this.parameters[i][1]));
                        if (val == "NIL") {
                            val = encodeURIComponent(this.parameters[i][2]);
                        }
                    }
                    url += arg + val;
                }
                if (!this.loading) {
                    this.loading = true;
                    Dashboards.incrementRunningCalls();
                }
                iframe.load(function() {
                    if (this.contentWindow.document.body.innerHTML) {
                        myself.loading = false;
                        Dashboards.decrementRunningCalls();
                    }
                });
                $("#" + this.htmlObject).empty().append(iframe);
                iframe[0].contentWindow.location = url;
            }
        } catch (e) {
            // don't cause the rest of CDF to fail if xaction component fails for whatever reason
        }
    }
});//XactionComponent

var ExecuteXactionComponent = BaseComponent.extend({
    visible: false,
    update: function() {
        // 2 modes of working; if it's a div, create a button inside it
        var myself = this;
        var o = $("#" + this.htmlObject);
        if ($.inArray(o[0].tagName.toUpperCase(), ["SPAN", "DIV"]) > -1) {
            // create a button
            o = $("<button/>").appendTo(o.empty());
            if (o[0].tagName == "DIV")
                o.wrap("<span/>");
            if (this.label != undefined)
                o.text(this.label);
            o.button();
        }
        o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
        o.bind("click", function() {
            var success = typeof (myself.preChange) == 'undefined' ? true : myself.preChange();
            if (success) {
                myself.executeXAction();
            }
            typeof (myself.postChange) == 'undefined' ? true : myself.postChange();
        });
    },
    executeXAction: function() {
        var url = wd.cdf.endpoints.getCdfXaction(this.path, this.action, this.solution) + "&";
        var p = new Array(this.parameters.length);
        var parameters = [];
        for (var i = 0, len = p.length; i < len; i++) {
            var key = this.parameters[i][0];
            var value = Dashboards.getParameterValue(this.parameters[i][1]);
            if ($.isArray(value)) {
                $(value).each(function(p) {
                    parameters.push(key + "=" + encodeURIComponent(this));
                });
            } else {
                parameters.push(key + "=" + encodeURIComponent(value));
            }
        }
        url += parameters.join("&");
        url = url.replace(/'/g, "&#39;");
        $.fancybox({
            type: "iframe",
            href: url,
            width: $(window).width(),
            height: $(window).height() - 50
        });
    }
});//ExecuteXactionComponent
