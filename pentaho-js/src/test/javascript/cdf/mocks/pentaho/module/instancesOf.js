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
  "pentaho/visual/color/palettes/nominalPrimary",
  "pentaho/visual/color/palettes/quantitativeBlue3"
], function(nominalPrimaryPalette, quantitativeBlue3Palette) {

  /* global Promise:false */

  return {
    load: function(name, requesterRequire, onLoad, config) {
      switch(name) {
        case "pentaho/visual/color/Palette":
          onLoad([nominalPrimaryPalette, quantitativeBlue3Palette]);
          break;
      }
    }
  };
});
