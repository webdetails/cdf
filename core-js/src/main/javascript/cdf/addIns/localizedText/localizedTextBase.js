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
