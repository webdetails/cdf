/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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
 * Hitachi Vantara-owned technologies.
 *
 */

 var AnalyzerComponent = BaseComponent.extend({

    update: function() {
        this.clear();
        var options = this.getOptions();

        var callVar = this.isEditMode() ? "editor" : "viewer";

        $.extend( options, { ts: new Date().getTime() } );
        var url = wd.cdf.endpoints.getAnalyzer({
            solution: this.solution,
            path: this.path,
            action: this.action
        }, callVar, options);

        var iframe = this.generateIframe( url );
        $( "#" + this.htmlObject ).html( iframe );

    },

    getOptions: function() {
        var myself = this;
        var options = {
            command: myself.command == undefined ? "open" : myself.command,
            showFieldList: myself.showFieldList == undefined ? false : myself.showFieldList,
            showRepositoryButtons: myself.showRepositoryButtons == undefined ? false : myself.showRepositoryButtons,
            frameless: myself.frameless == undefined ? false : myself.frameless
        };
        myself.dateFormats = myself.dateFormats == undefined ? {} : myself.dateFormats;
        // process params and update options
        $.map(myself.parameters, function(k) {
            options[k[0]] = Dashboards.getParameterValue(k[1]);
            if(myself.dateFormats[k[0]]) {
                var formatedDate = moment(options[k[0]]).format(myself.dateFormats[k[0]]);
                if(formatedDate !== 'Invalid date') {
                    options[k[0]] = formatedDate;
                }
            }
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
        return "<iframe id ='iframe_" + this.htmlObject + "' "
                + "style='height:100%;width:100%;border:0' "
                + "frameborder='0' src='" + url + "'/>";
    }

}); // AnalyzerComponent

var ExecuteAnalyzerComponent = AnalyzerComponent.extend({

    update: function() {
        // 2 modes of working; if it's a div, create a button inside it
        var $html = $("#" + this.htmlObject);
        if ($.inArray($html[0].tagName.toUpperCase(), ["SPAN", "DIV"]) > -1) {
            // create a button
            $html = $("<button/>").appendTo($html.empty());

            if ($html[0].tagName === "DIV") {
                $html.wrap("<span/>");
            }

            if (this.label != null) {
                $html.text(this.label);
            }

            $html.button();
        }

        $html.unbind("click"); // Needed to avoid multiple binds due to multiple updates(ex:component with listeners)

        var myself = this;
        $html.bind("click", function() {
            var success = typeof myself.preChange === 'function' ? myself.preChange() : true ;
            if (success) {
                myself.executeAnalyzerComponent();
            }
            if (typeof myself.postChange === 'function') {
              myself.postChange();
            }
        });
    },

    executeAnalyzerComponent: function() {
        var callVar = this.isEditMode() ? "editor" : "viewer";
        var parameters = this.getOptions();

        parameters.ts = new Date().getTime();

        var pathOptions = {
           solution: this.solution,
           path: this.path,
           action: this.action
        };

        $.fancybox.open({
                src: wd.cdf.endpoints.getAnalyzer( pathOptions, callVar, parameters ),
                type: "iframe",
                baseClass: "cdf-fancybox cdf-fancybox-iframe",
                btnTpl: {
                    smallBtn:
                        '<button type="button" data-fancybox-close class="fancybox-button fancybox-close-small" title="close">' +
                        '<svg id="svg-fancybox-close-small" width="350" height="350" viewbox="0 0 350 350" xmlns="http://www.w3.org/2000/svg"> <!-- Created with Method Draw - http://github.com/duopixel/Method-Draw/ --> <defs>  <filter id="svg_1_blur">   <feGaussianBlur stdDeviation="0" in="SourceGraphic"/>  </filter>  <filter height="200%" width="200%" y="-50%" x="-50%" id="svg_20_blur">   <feGaussianBlur stdDeviation="10" in="SourceGraphic"/>  </filter> </defs> <g>  <title>background</title>  <rect fill="none" id="canvas_background" height="302" width="302" y="-1" x="-1"/>  <g display="none" id="canvasGrid">   <rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%" id="svg_2"/>  </g> </g> <g>  <title>Layer 1</title>  <ellipse filter="url(#svg_20_blur)" ry="127.5" rx="127.5" id="svg_20" cy="154.5" cx="158.5" stroke-opacity="0" stroke-width="16" stroke="#0f0f00" fill="#000000"/>  <ellipse filter="url(#svg_1_blur)" ry="111" rx="111" id="svg_1" cy="145" cx="159" stroke-width="30" stroke="#ffffff" fill="#000"/>  <path d="m329,164l2,127" id="svg_3"/>  <path d="m329,164l2,127" id="svg_4"/>  <path d="m329,164l2,127" id="svg_5"/>  <path d="m329,164l2,127" id="svg_6"/>  <path d="m329,164l2,127" id="svg_9"/>  <path d="m241,161l2,127" id="svg_10"/>  <path d="m160,79l2,127"/>  <path d="m120,54l2,127"/>  <line transform="rotate(-45, 162, 143.5)" stroke-linecap="null" stroke-linejoin="null" id="svg_7" y2="207" x2="163" y1="80" x1="161" stroke-width="30" stroke="#ffffff" fill="none"/>  <path d="m329,164l2,127" id="svg_11"/>  <path d="m329,164l2,127" id="svg_12"/>  <path d="m329,164l2,127" id="svg_13"/>  <path d="m329,164l2,127" id="svg_14"/>  <path d="m329,164l2,127" id="svg_15"/>  <path d="m239,162l2,127" id="svg_16"/>  <path d="m239,162l2,127" id="svg_17"/>  <path d="m239,162l2,127" id="svg_18"/>  <path d="m239,162l2,127" id="svg_19"/>  <path d="m158,79l2,127"/>  <path d="m118,54l2,127"/>  <line transform="rotate(45, 163, 141.5)" stroke-linecap="null" stroke-linejoin="null" id="svg_8" y2="205" x2="164" y1="78" x1="162" stroke-width="30" stroke="#ffffff" fill="none"/> </g></svg>' +
                        '</button>'
                }
            },
            {
                toolbar  : false,
                smallBtn : true,
                iframe:{
                    preload: false,
                    css: {
                        width: $(window).width(),
                        height: $(window).height() - 50,
                        "max-width": "100%",
                        "max-height": "100%"
                    }
                }
            });
    }
}); // ExecuteAnalyzerComponent
