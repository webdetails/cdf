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
  '../../Logger',
  '../../dashboard/Utils',
  'amd!../../lib/underscore',
  'amd!../../lib/mustache-wax',
  '../../lib/jquery'
], function(Logger, Utils, _, Mustache, $) {

  return {
    name: "template",
    label: "template",

    defaults: {
      templateType: 'mustache',
      template: '<div>{{items}}</div>',
      rootElement: 'items',
      formatters: [],
      events: [],
      modelHandler: function(st, opt) {
        var model = {};
        return model[opt.rootElement] = $.parseJSON(st.value);
      },
      postProcess: function() {}
    },

    messages: {
      error: {
        noData: "No data available.",
        invalidTemplate: "Invalid template.",
        invalidTemplateType: "Invalid template type.",
        generic: "Invalid options defined. Please check the template component properties."
      },
      success: {},
      warning: {},
      info: {},
      config: {
        style: {
          success: {icon: "comment", type: "success"},
          error: {icon: "remove-sign", type: "danger"},
          info: {icon: "info-sign", type: "info"},
          warning: {icon: "exclamation-sign", style: "warning"}
        },
        template:
          "<div class='alert alert-<%=type%>' role='alert'>" +
          "  <span class='glyphicon glyphicon-<%=icon%>' aria-hidden='true'></span> " +
          "  <span> <%=msg%> </span>" +
          "</div>"
      }
    },

    processMessage: function(opt, message, type) {
      var completeMsg = {
        msg: opt.messages.error[message] || "",
        type: opt.messages.config.style[type].type || "info",
        icon: opt.messages.config.style[type].icon || "comment"};
      Logger.log(opt.messages.error[message] || "", type);
      return _.template(opt.messages.config.template, completeMsg);

    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      opt = $.extend(true, {messages: this.messages}, this.defaults, opt);
      var html = this.renderTemplate(tgt, st, opt);
      $(tgt).empty().html(html);
      var info = {target: tgt, status: st, options: opt};
      this.attachEvents($(tgt), opt.events, info);
      if(typeof opt.postProcess === "function") {
        opt.postProcess.call(this, info);
      }
    },

    renderTemplate: function(tgt, st, opt) {
      var data = "",
          html = "",
          model = {},
          myself = this;
      try {
        model = opt.modelHandler(st, opt);
      } catch(e) {
        data = st.value;
        model[opt.rootElement] = data;
      }

      if((!_.isEmpty(data))) {
        var helpers = {
          formatter: function(data, formatter, id) {
            return myself.applyFormatter(opt, data, formatter, id);
          }
        };

        st.model = model;
        try {
          switch(opt.templateType.toUpperCase()) {
            case 'UNDERSCORE':
              model = _.defaults({}, model, Utils.propertiesArrayToObject(helpers));
              html = _.template((_.isFunction(opt.template) ? opt.template() : opt.template), model);
              break;
            case 'MUSTACHE':
              Mustache.Formatters = helpers;
              html = Mustache.render((_.isFunction(opt.template) ? opt.template() : opt.template), model);
              break;
            default:
              html = this.processMessage(opt, 'invalidTemplateType', 'error');
              break;
          }
        } catch(e) {
          html = this.processMessage(opt, 'invalidTemplate', 'error');
        }
      } else {
        html = this.processMessage(opt, 'noData', 'error');
      }
      return html;
    },

    applyFormatter: function(opt, model, formatter, id) {
      var formatHandler = Utils.propertiesArrayToObject(opt.formatters)[formatter];
      if(_.isFunction(formatHandler)) {
        return formatHandler.call(this, model, id);
      } else {
        return model;
      }
    },

    attachEvents: function($placeholder, events, info) {
      var myself = this;
      _.each(events, function(elem) {
        var separator = ',',
            handler = _.first(elem).split(separator),
            eventHandler = _.last(elem),
            event = _.first(handler).trim(),
            selector = _.last(handler).trim();
        if(_.isFunction(eventHandler)) {
          $placeholder.find(selector).on(event, info, eventHandler);
        }
      });
    }
  };

});
