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

define([
  '../../lib/jquery'
], function($) {

  return {
    name: "localizedText",
    label: "Localized Text",
    defaults: {
      localize: function(v, st, opt) {
        return st.dashboard.i18nSupport.prop(v);
      }
    },

    init: function() { },

    // reference to the dashboard needs to be passed via de state (st) input parameter
    implementation: function(tgt, st, opt) {
      if(typeof opt.localize === "function" && st.dashboard && st.dashboard.i18nSupport) {
        this.setText(this.defaults.localize(st.value, st, opt), tgt, opt);
      } else {
        this.setText(st.value, tgt, opt);
      }
    },

    // set text and related content
    setText: function(text, tgt, opt) {
      $(tgt).empty().append(text);
    }
  };

});
