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
  '../../../AddIn',
  '../clippedTextBase',
  '../../../Dashboard',
  '../../../lib/jquery',
  'css!./theme/clippedText'
], function(AddIn, clippedTextBase, Dashboard, $) {

  var clippedText = new AddIn($.extend(true, {}, clippedTextBase, {
    defaults: {
      useTipsy: true
    },

    init: function() { }
  }));

  Dashboard.registerGlobalAddIn("Template", "templateType", clippedText);

  return clippedText;
});
