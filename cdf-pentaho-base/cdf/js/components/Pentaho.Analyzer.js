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
 * Includes all components relating to Analyzer iFrame
 * Pentaho-owned technologies.
 *
 */

 var AnalyzerComponent = BaseComponent.extend({
   update: function() {
     this.clear();
     var options = this.getOptions();
     var url = wd.cdf.endpoints.getAnalyzer();
     var myself = this;
     // enable editing the view?
     this.viewOnly ? url += 'viewer' : url += 'editor';
     var height = this.height ? this.height : "480px";
     var width = this.width ? this.width : "100%";
     var iFrameHTML = this.generateIframe(this.htmlObject, url, options, height, width);
     $("#" + this.htmlObject).html(iFrameHTML);
   },
   getOptions: function() {
     var options = {
       solution: this.solution,
       path: this.path,
       action: this.action,
       command: this.command == undefined ? "open" : this.command,
       showFieldList: this.showFieldList == undefined ? false : this.showFieldList,
       showRepositoryButtons: this.showRepositoryButtons == undefined ? false : this.showRepositoryButtons,
       frameless: this.frameless
     };

     var myself = this;
     // process params and update options
     $.map(this.parameters, function (k) {
       options[k[0]] = k.length == 3 ? k[2] : myself.dashboard.getParameterValue(k[1]);
     });
     return options;
   },
   generateIframe: function(htmlObject, url, parameters, height, width) {
     var iFrameHTML = '<iframe id="iframe_' + htmlObject + '"' +
                      ' frameborder="0"' +
                      ' height="' + height + '"' +
                      ' width="' + width + '"' +
                      ' src="' + url + "?";
     iFrameHTML += $.param(parameters, true);
     iFrameHTML += "\"></iframe>";
     return iFrameHTML;
    }
});//AnalyzerComponent
