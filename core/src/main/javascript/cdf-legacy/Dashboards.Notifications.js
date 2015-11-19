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

Dashboards.getErrorObj = function(errorCode) {
  return Dashboards.ERROR_CODES[errorCode] || {};
};

Dashboards.parseServerError = function(resp, txtStatus, error) {
  var out = {};
  var regexs = [{match: /Query timeout/ , msg: Dashboards.getErrorObj('QUERY_TIMEOUT').msg}];

  out.error = error;
  out.msg = Dashboards.getErrorObj('COMPONENT_ERROR').msg;
  var str = $('<div/>').html(resp.responseText).find('h1').text();
  _.find(regexs, function(el) {
    if(str.match(el.match)) {
      out.msg = el.msg ;
      return true
    } else {
      return false
    }
  });
  out.errorStatus = txtStatus;

  return out
};

Dashboards.handleServerError = function() {
  var err = Dashboards.parseServerError.apply(this, arguments);

  Dashboards.errorNotification(err);
  Dashboards.trigger('cdf cdf:serverError', this);
  Dashboards.resetRunningCalls();
};

Dashboards.errorNotification = function(err, ph) {
  if(ph) {
    wd.cdf.notifications.component.render(
      $(ph),
      {
        title: err.msg,
        desc: ""
      });
  } else {
    wd.cdf.notifications.growl.render({
      title: err.msg,
      desc: ''
    });
  }
};

/**
 * Default impl when not logged in
 */
Dashboards.loginAlert = function(newOpts) {
  var opts = {
    header: "Warning",
    desc: "You are no longer logged in or the connection to the server timed out",
    button: "Click to reload this page",
    callback: function() {
      window.location.reload(true);
    }
  };
  opts = _.extend({} , opts, newOpts);

  wd.cdf.popups.okPopup.show(opts);
  this.trigger('cdf cdf:loginError', this);
};

/**
 *
 */
Dashboards.checkServer = function() {
  //check if is connecting to server ok
  //use post to avoid cache
  var retVal = false;
  $.ajax({
    type: 'POST',
    async: false,
    dataType: 'json',
    url: wd.cdf.endpoints.getPing(),
    success: function(result) {
      if(result && result.ping == 'ok') {
        retVal = true;
      } else {
        retVal = false;
      }
    },
    error: function() {
      retVal = false;
    }
    
  });
  return retVal;
};

/*
 * Popups (Move somewhere else?)
 *
 *
 */

var wd = wd || {};
wd.cdf = wd.cdf || {};
wd.cdf.popups = wd.cdf.popups || {};

wd.cdf.popups.okPopup = {
  template: 
    "<div class='cdfPopup'>" +
    "  <div class='cdfPopupHeader'>{{{header}}}</div>" +
    "  <div class='cdfPopupBody'>" +
    "    <div class='cdfPopupDesc'>{{{desc}}}</div>" +
    "    <div class='cdfPopupButton'>{{{button}}}</div>" +
    "  </div>" +
    "</div>",
  defaults:{
    header: "Title",
    desc:"Description Text",
    button:"Button Text",
    callback: function() {
      return true;
    }
  },
  $el: undefined,
  show: function(opts) {
    if(opts || this.firstRender) {
      this.render(opts);
    }
    this.$el.show();
  },
  hide: function() {
    this.$el.hide();
  },
  render: function(newOpts) {
    var opts = _.extend({} , this.defaults, newOpts);
    var myself = this;
    if(this.firstRender) {
      this.$el = $('<div/>')
        .addClass('cdfPopupContainer')
        .hide()
        .appendTo('body');
      this.firstRender = false;
    };
    this.$el.empty().html(Mustache.render(this.template, opts));
    this.$el.find('.cdfPopupButton').click(function() {
      opts.callback();
      myself.hide();
    });
  },
  firstRender: true
};

/*
 * Error information divs
 *
 *
 */

wd.cdf.notifications = wd.cdf.notifications || {};

wd.cdf.notifications.component = {
  template:
    "<div class='cdfNotification component {{#isSmallComponent}}small{{/isSmallComponent}}'>" +
    "  <div class='cdfNotificationBody'>" +
    "    <div class='cdfNotificationImg'>&nbsp;</div>" +
    "    <div class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</div>" +
    "    <div class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</div>" +
    "  </div>" +
    "</div>",
  defaults:{
    title: "Component Error",
    desc: "Error processing component."
  },
  render: function(ph, newOpts) {
    var opts = _.extend({}, this.defaults, newOpts);
    opts.isSmallComponent = ($(ph).width() < 300);
    $(ph).empty().html(Mustache.render(this.template, opts));
    var $nt = $(ph).find('.cdfNotification');
    $nt.css({'line-height': $nt.height() + 'px'});
  }
};

wd.cdf.notifications.growl = {
  template:
    "<div class='cdfNotification growl'>" +
    "  <div class='cdfNotificationBody'>" +
    "    <h1 class='cdfNotificationTitle' title='{{title}}'>{{{title}}}</h1>" +
    "    <h2 class='cdfNotificationDesc' title='{{desc}}'>{{{desc}}}</h2>" +
    "  </div>" +
    "</div>",

  defaults:{
    title: 'Title',
    desc: 'Default CDF notification.',
    timeout: 4000,
    onUnblock: function() { return true; },
    css: {position: 'absolute', width: '100%', top:'10px'},
    showOverlay: false,
    fadeIn: 700,
    fadeOut: 1000,
    centerY:false
  },

  render: function (newOpts) {
    var myself = this;

    if(myself.firstRender) {
      myself.defaults.css = $.extend({}, $.blockUI.defaults.growlCSS, myself.defaults.css);
    }

    var opts = _.extend({}, myself.defaults, newOpts),
      $m = $(Mustache.render(myself.template, opts)),
      outerUnblock = opts.onUnblock;

    opts.message = $m;

    opts.onUnblock = function() {
      myself.$el.hide();
      outerUnblock.call(this);
    };

    if(myself.firstRender) {
      myself.$el = $('<div/>')
        .addClass('cdfNotificationContainer')
        .hide()
        .appendTo('body');

      myself.firstRender = false;
    }

    myself.$el.show().block(opts);
  },

  firstRender: true
};
