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
        model[opt.rootElement] = $.parseJSON(st.value);
        return model;
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
      return _.template(opt.messages.config.template)(completeMsg);

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
      var model,
          myself = this;
      try {
        model = opt.modelHandler(st, opt);
      } catch(e) {
        if(!_.isEmpty(st.value)) {
          model = {};
          model[opt.rootElement] = st.value;
        }
      }

      if(!_.isEmpty(model)) {
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
              return _.template(Utils.ev(opt.template))(model);
            case 'MUSTACHE':
              Mustache.Formatters = helpers;
              return Mustache.render(Utils.ev(opt.template), model);
            default:
              return this.processMessage(opt, 'invalidTemplateType', 'error');
          }
        } catch(e) {
          return this.processMessage(opt, 'invalidTemplate', 'error');
        }
      } else {
        return this.processMessage(opt, 'noData', 'error');
      }
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
        if (_.isFunction(eventHandler)) {
          if (event === selector) {
            $placeholder.off(event).on(event, info, eventHandler);
          } else {
            $placeholder.find(selector).off(event).on(event, info, eventHandler);
          }
        }
      });
    }
  };

});
