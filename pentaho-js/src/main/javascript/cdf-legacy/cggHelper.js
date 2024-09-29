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


wd = wd || {};
wd.helpers = wd.helpers || {};

wd.helpers.cggHelper = {
    getCggDrawUrl: function(){
        return Dashboards.getWebAppPath() + "/plugin/cgg/api/services/draw";
    }
}
