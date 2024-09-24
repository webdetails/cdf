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
/**
 * @summary MCustomScrollBarEngineImplementation implementation of ScrollBarHandler
 * @description MCustomScrollBarEngineImplementation implementation of ScrollBarHandler
 */
define([
  './AbstractScrollBarHandler',
  '../../../../lib/jquery',
  'amd!../../../../lib/jquery.mCustomScrollbar'
],function(AbstractScrollBarHandler, $){
  return AbstractScrollBarHandler.extend({
    
    scrollbar: null,
    constructor: function (view) {
      var options = $.extend(true, {}, view.config.view.scrollbar.options, {
        callbacks: {
          onTotalScroll: function () {
            return view.trigger('scroll:reached:bottom', view.model);
          },
          onTotalScrollBack: function () {
            return view.trigger('scroll:reached:top', view.model);
          }
        }
      });
      this.scrollbar = view.$(view.config.view.slots.children).parent().mCustomScrollbar(options);
      
    },
    scrollToPosition: function(position) {
      this.scrollbar.mCustomScrollbar("scrollTo",position,{callbacks:false});
    }
  });
});
