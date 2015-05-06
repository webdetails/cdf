(function() {
  var templateAddIn = {
    name: "template",
    label: "Template",

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

    processMessage: function(message, type) {
      var completeMsg = {
        msg: message || "",
        type: this.messages.config.style[type].type || "info",
        icon: this.messages.config.style[type].icon || "comment"};
      return _.template(this.messages.config.template, completeMsg)
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
          Dashboards.log(this.messages.error.invalidTemplate, 'info');
        }
      } else {
        html = this.processMessage(this.messages.error.noData, 'error');
        Dashboards.log(this.messages.error.noData, 'info');
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

  Dashboards.registerAddIn("Template", "templateType", new AddIn(templateAddIn));
})();