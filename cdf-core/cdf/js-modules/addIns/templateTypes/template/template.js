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
      '../../../AddIn',
      '../../../Dashboard',
      '../../../Logger',
      'amd!../../../lib/underscore',
      'amd!../../../lib/mustache-wax',
      'amd!../../../lib/datatables'],
    function(AddIn, Dashboard, Logger, _, Mustache, $) {

      var template = {
        name: "template",
        label: "template",

        defaults: {
          templateType: 'mustache',
          template: '<div>{{items}}</div>',
          rootElement: 'items',
          formatters: {},
          events: [],
          postProcess: function() {}
        },

        messages: {
          error: {
            noData: "No data available.",
            invalidTemplate: "Invalid template.",
            invalidTemplateType: "Invalid template type.",
            generic: "Invalid options defined. Please check the template component properties."
          },
          success: { },
          warning: { },
          info: { },
          config: {
            style: {
              success: { icon: "comment", type: "success" },
              error: { icon: "remove-sign", type: "danger" },
              info: { icon: "info-sign", type: "info" },
              warning: { icon: "exclamation-sign", style: "warning" }
            },
            template:   "<div class='alert alert-<%=type%>' role='alert'>" +
            "   <span class='glyphicon glyphicon-<%=icon%>' aria-hidden='true'></span> " +
            "   <span> <%=msg%> </span>" +
            "</div>"
          }
        },

        processMessage: function(message, type) {
          var completeMsg = {
            msg: message || "",
            type: this.messages.config.style[type].type || "info",
            icon: this.messages.config.style[type].icon || "comment"};
          return _.template(this.messages.config.template, completeMsg)
        },

        init: function() {
          $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
          $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
        },

        implementation: function(tgt, st, opt) {
          opt = $.extend(true, this.defaults, opt);
          var html = this.renderTemplate(tgt, st, opt);
          $(tgt).empty().html(html);
          var info = {target: tgt, status: st, options: opt};
          this.attachEvents($(tgt), opt.events, info);
          if ((typeof opt.postProcess != "undefined") && (_.isFunction())) {
            this.postProcess.call(this, info);
          }
        },

        renderTemplate: function(tgt, st, opt) {
          var data = "",
              html = "",
              model = {};
          try {
            data = $.parseJSON(st.value);
          } catch(e) {
            data = st.value;
          }

          if ((!_.isEmpty(data))) {
            _.each(opt.formatters, function(value, key){
              if ((!_.isUndefined(data[key])) && (_.isFunction(value))) {
                data[key] = value(data[key], tgt, st, opt) || data[key];
              }
            });
            model[opt.rootElement] = data;
            st.model = model;
            try {
              switch (opt.templateType.toUpperCase()) {
                case 'UNDERSCORE':
                  html = _.template((_.isFunction(opt.template) ? opt.template() : opt.template), model);
                  break;
                case 'MUSTACHE':
                  html = Mustache.render((_.isFunction(opt.template) ? opt.template() : opt.template), model);
                  break;
                default:
                  html = this.processMessage(this.messages.error.invalidTemplateType, 'error');
                  break;
              }
            } catch (e) {
              html = this.processMessage(this.messages.error.invalidTemplate, 'error');
              Logger.log(this.messages.error.invalidTemplate, 'info');
            }
          } else {
            html = this.processMessage(this.messages.error.noData, 'error');
            Logger.log(this.messages.error.noData, 'info');
          }
          return html;
        },

        attachEvents: function($placeholder, events, info) {
          var myself = this;
          _.each(events, function(elem) {
            var separator = ' ',
                handler = _.first(elem).split(separator),
                eventHandler = _.last(elem),
                event = _.first(handler),
                selector = _.last(handler);
            if (_.isFunction(eventHandler)) {
              $placeholder.find(selector).on(event, info, eventHandler);
            }
          });
        }
      };

      Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(template));

      return template;

    });
