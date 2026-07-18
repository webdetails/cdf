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



define(['cdf/Dashboard.Blueprint', 'cdf/lib/jquery'], function(Dashboard, $) {
  return Dashboard.extend({
    customize: function() {
      $("#sampleObj").html("<b>the dashboard customize function generated this message</b>");
    }
  });
});
