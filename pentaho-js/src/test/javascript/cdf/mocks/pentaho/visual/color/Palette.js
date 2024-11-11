/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define(function () {

  function PaletteMock(level, colors) {
    this.level = level;
    this.colors = {
      toArray: function() {
        return colors.map(function(value) { return {value: value}; });
      }
    }
  }

  return PaletteMock;
});
