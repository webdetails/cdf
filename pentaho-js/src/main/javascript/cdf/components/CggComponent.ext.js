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
  'pentaho/environment'
], function(environment) {

  return {

    getCggDrawUrl: function() {
      return environment.server.root + "plugin/cgg/api/services/draw";
    }
  };

});
