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


define([], function () {

  return {
    selectedOnTop: function (model, idx) {
      var result;
      result = model.getSelection() ? 'A' : 'Z';
      return result += idx;
    },
    sameOrder: function (model, idx) {
      var result;
      return result = idx;
    },
    sortAlphabetically: function (model, idx) {
      var result;
      return result = model.get('label');
    },
    sortByValue: function (model, idx) {
      var result;
      return result = -(model.get('value')) || 0;
    }
  };

});
