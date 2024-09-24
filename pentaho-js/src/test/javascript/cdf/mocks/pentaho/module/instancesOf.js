/*!
 * Copyright 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
