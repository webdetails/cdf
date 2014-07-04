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