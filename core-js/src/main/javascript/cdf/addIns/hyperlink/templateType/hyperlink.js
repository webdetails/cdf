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


define([
  '../../../AddIn',
  '../hyperlinkBase',
  '../../../Dashboard',
  '../../../lib/jquery'
], function(AddIn, hyperlinkBase, Dashboard, $) {
  var hyperlink = new AddIn($.extend(true, {}, hyperlinkBase, {
    defaults: {
      urlReference: 1,
      labelReference: 0
    }
  }));

  Dashboard.registerGlobalAddIn("Template", "templateType", hyperlink);

  return hyperlink;
});
