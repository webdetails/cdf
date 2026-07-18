/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



define([
  '../../../AddIn',
  '../localizedTextBase',
  '../../../Dashboard',
  '../../../lib/jquery'
], function(AddIn, localizedTextBase, Dashboard, $) {

  var localizedText = new AddIn($.extend(true, {}, localizedTextBase, {

    defaults: {
      cssClass: 'localizedTextContainer',
      layout: '<div></div>'
    },

    // set text and related content
    setText: function(text, tgt, opts) {
      $(tgt).empty()
            .html($(opts.layout).append(text)
                                .addClass(opts.cssClass));
    }
  }));

  Dashboard.registerGlobalAddIn("Template", "templateType", localizedText);

  return localizedText;
});
