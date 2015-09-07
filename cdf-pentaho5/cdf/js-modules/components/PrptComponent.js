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

define([
  './PrptComponent.ext',
  '../Logger',
  '../lib/jquery',
  'amd!../lib/underscore',
  './BaseComponent'
], function(PrptComponentExt, Logger, $, _, BaseComponent) {

  var PrptComponent = BaseComponent.extend({
    getIframeName: function() {
      return this.htmlObject + '_' + 'prptFrame';
    },
    getIframe: function() {
      return '<iframe name="' + this.getIframeName() + '" style="width:100%;height:100%;border:0px" frameborder="0"/>';
    },
    setIframeUrl: function(iframe, url) {
      if(iframe[0]) {
        iframe[0].contentWindow.location = url;
      }
    },
    /*************************************************************************
     * We really shouldn't mess around with the CDF running call counter,
     * but if we don't do so in this case, the report will count as "finished"
     * even though nothing has been loaded into the iframe. We'll increment it
     * here,decrement it again from the iframe's onload event.
     */
    startLoading: function() {
      if(!this.loading) {
        this.loading = true;
        this.dashboard.incrementRunningCalls();
      }
    },
    stopLoading: function() {
      if(this.loading) {
        this.loading = false;
        this.dashboard.decrementRunningCalls();
      }
    },
    /*************************************************************************/
    update: function() {
      this.clear();
      var options = this.getOptions(),
        params = this.getParams(),
        reportOptions = this.getReportOptions();
      $.each(reportOptions, function(key, value) {
        if(params[key] != undefined) {
          delete key;
        }
      });
      var pathSegments = {
        solution: options.solution,
        path: options.path,
        action: options.action
      };
      //we don't want to pass these as parameters
      delete options.solution;
      delete options.path;
      delete options.action;
      delete reportOptions.solution;
      delete reportOptions.path;
      delete reportOptions.action;
      var downloadMode = this.downloadMode; // if you really must use this component to download stuff
      var callVar = options.showParameters ? 'viewer' : 'report';
      if(downloadMode == null) {
        var outputTarget = options["output-target"];
        // take a guess
        downloadMode = !((outputTarget.indexOf('html') != -1 && outputTarget.indexOf('mime-message') == -1)
          || outputTarget.indexOf('text') != -1);
      }
      if(options["dashboard-mode"]) {
        //IFrame = False, showParameters always false.
        if(options.showParameters) {
          Logger.log("showParameters not supported with IFrame = False");
        }
        var requestType = this.usePost ? "POST" : "GET";
        var url = PrptComponentExt.getReport(pathSegments, "report", {ts: new Date().getTime()});
        $.each(reportOptions, function(key, value) {
          if(params[key] == undefined) {
            params[key] = value;
          }
        });
        var myself = this;
        $.ajax({
          url: url,
          type: requestType,
          data: params,
          dataType: "html",
          success: function(resp) {
            $("#" + myself.htmlObject).html(resp);
          }
        });
      } else {
        // set up our result iframe
        var iframe = $(this.getIframe());
        var htmlObj = $('#' + this.htmlObject);
        htmlObj.empty();
        iframe = iframe.appendTo(htmlObj);
        if(this.autoResize) {
          // we'll need to reset size before each resize,
          // otherwise we'll get stuck with the size of the biggest report we get
          if(this._sHeight == null) {
            this._sHeight = htmlObj.height();
            this._sWidth = htmlObj.width();
          } else {
            htmlObj.height(this._sHeight);
            htmlObj.width(this._sWidth);
          }
        }
        if(this.usePost) {
          $.each(options, function(key, value) {
            if(params[key] == undefined) {
              params[key] = value;
            }
          });
          var url = PrptComponentExt.getReport(pathSegments, callVar, {ts: new Date().getTime()});
          this._postToUrl(htmlObj, iframe, url, params, this.getIframeName());
        } else {
          $.extend( options, {ts: new Date().getTime()});
          var url = PrptComponentExt.getReport( pathSegments, callVar, options );
          if(options.showParameters && this.autoResize) {
            Logger.log('PrptComponent: autoResize disabled because showParameters=true');
            this.autoResize = false;
          }
          this.startLoading();
          var myself = this;
          iframe.load(function() {
            if(options.showParameters) {
              var jqBody = $(this.contentWindow.document.body);
              var reportContentFrame = jqBody.find('#reportContent');
              reportContentFrame.load(function() {
                if(myself.autoResize) {
                  myself._resizeToReportFrame(reportContentFrame[0], htmlObj, options);
                }
              });
            }
            myself.stopLoading();
          });
          this.setIframeUrl(iframe, url);
        }
        if(downloadMode) {
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
        paginate: this.paginate || false,
        showParameters: this.showParameters || false,
        autoSubmit: (this.autoSubmit || this.executeAtStart) || false,
        "dashboard-mode": this.iframe == undefined ? false : !this.iframe,
        solution: this.solution,
        path: this.path,
        action: this.action,
        renderMode: 'REPORT',
        htmlProportionalWidth: false
      };
      if(this.paginate) {
        options["output-target"] = "table/html;page-mode=page";
        options['accept-page'] = 0;
      } else {
        options["output-target"] = "table/html;page-mode=stream";
        options['accept-page'] = -1;
      }

      // update options with report parameters
      var myself = this;
      _.each(this.parameters, function(param, index) {
        // param: [<prptParam>, <dashParam>, <default>]
        var name = param[0];
        var value = param[1];

        var paramValue;
        try {
          paramValue = myself.dashboard.getParameterValue(value);
        } catch( e ) {
          var printValue;
          if(!_.isObject(value) || _.isFunction(value)) {
            printValue = value;
          } else {
            printValue = JSON.stringify(value);
          }
          Logger.log("GetOptions detected static parameter " + name + "=" + printValue + ". "
            + "The parameter will be used as value instead its value obtained from getParameterValue");
          paramValue = value;
        }
        if(paramValue == null && param.length == 3) {
          paramValue = param[2];
        } else if (paramValue === undefined) {
          paramValue = value;
        }
        if(_.isFunction(paramValue)) {
          paramValue = paramValue();
        }
        options[name] = paramValue;
      });

      return options;
    },
    getParams: function() {
      var options = {};
      if(this.paginate) {
        options["output-target"] = "table/html;page-mode=page";
        options['accept-page'] = 0;
      } else {
        options["output-target"] = "table/html;page-mode=stream";
        options['accept-page'] = -1;
      }

      // update options with report parameters
      var myself = this;
      _.each(this.parameters, function( param, index ) {
        // param: [<prptParam>, <dashParam>, <default>]
        var name = param[0];
        var value = param[1];

        var paramValue;
        try {
          paramValue = myself.dashboard.getParameterValue(value);
        } catch(e) {
          if(!_.isObject(value) || _.isFunction(value)) {
            printValue = value;
          } else {
            printValue = JSON.stringify(value);
          }
          Logger.log("GetParams detected static parameter " + name + "=" + printValue + ". " +
              "The parameter will be used as value instead its value obtained from getParameterValue");
          paramValue = value;
        }
        if(paramValue == null && param.length == 3) {
          paramValue = param[2];
        } else if (paramValue === undefined) {
          paramValue = value;
        }
        if(_.isFunction(paramValue)) {
          paramValue = paramValue();
        }
        options[name] = paramValue;
      });

      return options;
    },
    getReportOptions: function() {
      var options = {
        paginate: this.paginate || false,
        showParameters: this.showParameters || false,
        autoSubmit: (this.autoSubmit || this.executeAtStart) || false,
        "dashboard-mode": this.iframe == undefined ? false : !this.iframe,
        solution: this.solution,
        path: this.path,
        name: this.action,
        renderMode: 'REPORT',
        htmlProportionalWidth: false,
        'accepted-page': -1
      };
      if(this.paginate) {
        options["output-target"] = "table/html;page-mode=page";
        options['accept-page'] = 0;
      } else {
        options["output-target"] = "table/html;page-mode=stream";
        options['accept-page'] = -1;
      }
      return options;
    },
    _postToUrl: function(htmlObj, iframe, path, params, target) {
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
    _resizeToReportFrame: function(iframe, htmlObj, options) {
      var outputTarget = options["output-target"];
      // only makes sense for html, but let's keep it open
      var isHtml = function(outputTarget) {
        return outputTarget.indexOf('html') != -1 && outputTarget.indexOf('mime') == -1;
      };
      var isText = function(outputTarget) {
        return outputTarget.indexOf('text') != -1;
      };
      var isXml = function(outputTarget) {
        return outputTarget.indexOf('xml') != -1;
      };
      try {
        var idoc = iframe.contentWindow.document;
        if(iframe.contentWindow.document) {
          var sized = null;
          if(isHtml(outputTarget) || isText(outputTarget)) {
            sized = idoc.body;
          } else if(isXml(outputTarget)) {
            // not much point in using this
            sized = idoc.firstChild;
          }
          if(sized != null) {
            var hMargin = 0, wMargin = 0;
            if(isHtml(outputTarget)) {
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
        Logger.log(e);
      }
    },
    _getParamsAsForm: function(doc, path, params, target) {
      var form = doc.createElement("form");
      form.setAttribute("method", "post");
      form.setAttribute("action", path);
      form.setAttribute("target", target);
      for(var key in params) {
        if(params.hasOwnProperty(key)) {
          var param = params[key];
          if($.isArray(param)) {
            for(var i = 0; i < param.length; i++) {
              var hiddenField = doc.createElement("input");
              hiddenField.setAttribute("type", "hidden");
              hiddenField.setAttribute("name", key);
              hiddenField.setAttribute("value", param[i]);
              form.appendChild(hiddenField);
            }
          } else {
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
  });

  return PrptComponent;

});
