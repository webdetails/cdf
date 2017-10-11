/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

define([
  './AnalyzerComponent.ext',
  '../lib/jquery',
  '../lib/moment',
  './BaseComponent'
], function(AnalyzerComponentExt, $, moment, BaseComponent) {

  return BaseComponent.extend({
    update: function() {
      this.clear();
      var options = this.getOptions();

      var callVar = this.isEditMode() ? "editor" : "viewer";

      $.extend(options, {ts: new Date().getTime()});

      var url = AnalyzerComponentExt.getAnalyzer({
        solution: this.solution,
        path: this.path,
        action: this.action
      }, callVar, options);

      var iframe = this.generateIframe(url);
      $("#" + this.htmlObject).html(iframe);

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
      var d = myself.dashboard;
      $.map(myself.parameters, function(k) {
        options[k[0]] = d.getParameterValue(k[1]);    
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
      if(this.viewOnly != undefined) {
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
        + "frameborder='0' src='" + url + "'/>";

      return iFrameHTML;
    }

  });

});
