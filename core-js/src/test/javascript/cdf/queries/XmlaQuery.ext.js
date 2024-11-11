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


define('cdf/queries/XmlaQuery.ext', ['pentaho/environment'], function(env) {

  var XmlaQueryExt = {
    getXmla: function() { return env.server.root + "Xmla"; }
  };
  
  return XmlaQueryExt;
});
