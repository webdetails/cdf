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


define(['cdf/Dashboard.Blueprint', 'cdf/lib/jquery'], function(Dashboard, $) {
  return Dashboard.extend({
    customize: function() {
      $("#sampleObj").html("<b>the dashboard customize function generated this message</b>");
    }
  });
});
