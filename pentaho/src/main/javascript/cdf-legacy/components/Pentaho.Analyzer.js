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

/*
 *
 * Includes all components relating to Analyzer iFrame
 * Pentaho-owned technologies.
 *
 */

 var AnalyzerComponent = BaseComponent.extend({
    update: function() {
        this.clear();
        var options = this.getOptions();

        var pathSegments = {
            solution: options.solution,
            path: options.path,
            action: options.action
        };
        delete options.solution;
        delete options.path;
        delete options.action;

        var callVar = this.isEditMode() ? "editor" : "viewer";

        $.extend( options, { ts: new Date().getTime() } );
        var url = wd.cdf.endpoints.getAnalyzer( pathSegments, callVar, options );

        var iframe = this.generateIframe( url );
        $( "#" + this.htmlObject ).html( iframe );

    },

    getOptions: function() {
        var options = {
            solution: this.solution,
            path: this.path,
            action: this.action,
            command: this.command == undefined ? "open" : this.command,
            showFieldList: this.showFieldList == undefined ? false : this.showFieldList,
            showRepositoryButtons: this.showRepositoryButtons == undefined ? false : this.showRepositoryButtons,
            frameless: this.frameless == undefined ? false : this.frameless
        };
        // process params and update options
        $.map(this.parameters, function(k) {
            options[k[0]] = k.length == 3 ? k[2] : Dashboards.getParameterValue(k[1]);
        });
        return options;
    },

    isEditMode: function() {
        if ( this.viewOnly != undefined ) {
            return !this.viewOnly || this.editMode;
        } else {
            return this.editMode;
        }
    },
    
    generateIframe: function(url) {
        var height = this.height ? this.height : "480px";
        var width = this.width ? this.width : "100%";

        var iFrameHTML = "<iframe id ='iframe_" + this.htmlObject + "' "
                + "style='height:100%;width:100%;border:0px' "
                + "frameborder='0' src='" + url + "'/>"

        return iFrameHTML;
    }

});//AnalyzerComponent

var ExecuteAnalyzerComponent = AnalyzerComponent.extend({
    
    update: function() {
        // 2 modes of working; if it's a div, create a button inside it
        var myself = this;
        var o = $("#" + this.htmlObject);
        if ($.inArray(o[0].tagName.toUpperCase(), ["SPAN", "DIV"]) > -1) {
            // create a button
            o = $("<button/>").appendTo(o.empty());
            if (o[0].tagName == "DIV"){
                o.wrap("<span/>");
            }
            if (this.label != undefined){
                o.text(this.label);
            }
            o.button();
        }
        o.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)
        o.bind("click", function() {
            var success = typeof (myself.preChange) == 'undefined' ? true : myself.preChange();
            if (success) {
                myself.executeAnalyzerComponent();
            }
            typeof (myself.postChange) == 'undefined' ? true : myself.postChange();
        });
    },
    executeAnalyzerComponent: function() {
        var callVar = this.isEditMode() ? "editor" : "viewer";
        var parameters = this.getOptions();
        var path = {};
        if ( parameters.solution ) {
            $.extend( path, {solution: parameters.solution});
        }
        if ( parameters.path ) {
            $.extend( path, {path: parameters.path});
        }
        if ( parameters.action ) {
            $.extend( path, {action: parameters.action});
        }
        delete parameters.solution;
        delete parameters.path;
        delete parameters.action;
        $.extend( parameters, {ts: new Date().getTime()});

        $.fancybox({
            type: "iframe",
            href: wd.cdf.endpoints.getAnalyzer( path, callVar, parameters ),
            width: $(window).width(),
            height: $(window).height() - 50
        });
    }
});//ExecuteAnalyzerComponent
