/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

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
