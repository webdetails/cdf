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

var wd = (typeof wd !== 'undefined') ? wd : {};
wd.helpers = wd.helpers || {};
wd.helpers.inputHelper = {
  getCssWrapperClass: function (verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-up " +
      ((this.verticalOrientation) ? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },

  getSelectedCss: function (verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-down " + ((verticalOrientation) ? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },

  getUnselectedCss: function (verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-up " + ((verticalOrientation) ? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },

  getExtraCss: function (index, count, verticalOrientation) {
    var css = "";
    if (index == 0 && count == 1) {
      // both first & last
      return " pentaho-toggle-button-single";
    }
    if (index == 0) {
      css += " " + ((verticalOrientation) ? " pentaho-toggle-button-vertical-first" : " pentaho-toggle-button-horizontal-first");
    } else if (index == count - 1) {
      css += " " + ((verticalOrientation) ? " pentaho-toggle-button-vertical-last" : " pentaho-toggle-button-horizontal-last");
    }
    return css;
  },

  getToggleButtonClass: function () {
    return "pentaho-toggle-button";
  },

  getToggleButtonHoveringClass: function () {
    return "pentaho-toggle-button-up-hovering";
  }

}
