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
  './UnmanagedComponent',
  '../dashboard/Utils',
  '../Logger',
  '../lib/jquery',
  'amd!../lib/underscore',
  'amd!../lib/mustache-wax',
  '../addIns/templateTypes',
  'css!./TemplateComponent'
], function(UnmanagedComponent, Utils, Logger, $, _, Mustache) {

  var TemplateComponent = UnmanagedComponent.extend({

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
        template: "<div class='alert alert-<%=type%>' role='alert'>" +
        "   <span class='glyphicon glyphicon-<%=icon%>' aria-hidden='true'></span> " +
        "   <span> <%=msg%> </span>" +
        "</div>"
      }
    },

    init: function() {
      $.extend(true, this, Utils.ev(this.extendableOptions));
      $.extend(true, this.defaults, Utils.ev(this.options));
    },

    update: function() {
      _.bindAll(this, 'redraw', 'init', 'processData', 'renderTemplate', 'attachEvents', 'processMessage',
          'template', 'applyFormatter', 'applyAddin', 'processAddins');

      this.init();
      this.triggerQuery(this.chartDefinition, this.redraw);
    },

    redraw: function(data) {
      this.model = this.processData(data);
      var htmlResult = this.renderTemplate(this.template, this.templateType, this.model);
      var $target = this.placeholder();
      $target.empty().append(htmlResult);
      this.processAddins($target);
      if(!_.isEmpty(this.events)) {
        this.attachEvents(this.eventSelector, this.eventType, this.eventHandler);
      }
    },

    getUID: function() {
      return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    applyFormatter: function(model, formatter) {
      var formatHandler = Utils.propertiesArrayToObject(this.formatters)[formatter];
      if(_.isFunction(formatHandler)) {
        return formatHandler.call(this, model);
      } else {
        return model;
      }
    },

    applyAddin: function(model, addin) {
      var UID = this.name + "_" + addin + this.getUID();
      this.addins = this.addins || [];
      this.addins.push({uid: UID, model: model, addin: addin});
      return '<div id="' + UID + '" class="' + addin + '"/>';
    },

    processAddins: function($target) {
      var myself = this;
      _.each(this.addins, function(elem) {
        myself.handleAddin(_.first($target.find('#' + elem.uid)), elem.model, elem.addin);
      });
    },

    handleAddin: function(target, model, addInName) {
      var addIn = this.getAddIn("templateType", addInName);
      var state = {value: model};
      addIn.call(target, state, this.getAddInOptions("templateType", addIn.getName()));
    },

    // Transform qyeryResult.dataset to JSON format to be used in Templates
    processData: function(queryResult) {
      if(!_.isFunction(this.modelHandler)) {
        var hasData = queryResult.queryInfo != null ?
        queryResult.queryInfo.totalRows > 0 :
        queryResult.resultset.length > 0;

        if(hasData) {
          var data = [];
          _.each(queryResult.resultset, function(row) {
            data.push(_.extend({}, row));
          });
          var model = {};
          model[this.rootElement] = data;
          return model;
        } else {
          return "";
        }
      } else {
        return this.modelHandler(queryResult);
      }
    },

    // Apply template based on the result of a query. Creates a template based (mustache or underscore) view data object and apply columns format
    renderTemplate: function(template, templateType, model) {
      var html = "";
      var myself = this;
      if((!_.isEmpty(model))) {
        var helpers = {
          formatter: function(data, formatter) {
            return myself.applyFormatter(data, formatter);
          },
          addin: function(data, addin) {
            return myself.applyAddin(data, addin);
          }
        };

        try {
          switch(templateType.toUpperCase()) {
            case 'UNDERSCORE':
              model = _.defaults({}, model, Utils.propertiesArrayToObject(helpers));
              html = _.template(Utils.ev(template), model);
              break;
            case 'MUSTACHE':
              Mustache.Formatters = helpers;
              html = Mustache.render(Utils.ev(template), model);
              break;
            default:
              html = this.processMessage(this.messages.error.invalidTemplateType, 'error');
              break;
          }
        } catch(e) {
          html = this.processMessage(this.messages.error.invalidTemplate, 'error');
          Logger.log(this.messages.error.invalidTemplate, 'error');
        }
      } else {
        html = this.processMessage(this.messages.error.noData, 'error');
        Logger.log(this.messages.error.noData, 'error');
      }
      return html;
    },

    // bind click to created cards
    attachEvents: function() {
      var myself = this;
      _.each(this.events, function(elem) {
        var separator = ' ',
            handler = _.first(elem).split(separator),
            eventHandler = _.last(elem),
            event = _.first(handler),
            selector = _.last(handler);
        if(_.isFunction(eventHandler)) {
          myself.placeholder(selector).on(event, _.bind(eventHandler, myself));
        }
      });
    },

    processMessage: function(message, type) {
      var completeMsg = {
        msg: message || "",
        type: this.messages.config.style[type].type || "info",
        icon: this.messages.config.style[type].icon || "comment"
      };
      return _.template(this.messages.config.template, completeMsg)
    }

  });

  return TemplateComponent;
});