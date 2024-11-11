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


package org.pentaho.cdf.settings;

import org.pentaho.cdf.CdfSessionCache;
import org.pentaho.platform.api.engine.IPentahoSession;

public class SettingsEngine {

  private static SettingsEngine cdfSettings = null;

  static SettingsEngine getInstance() {
    if ( cdfSettings == null ) {
      cdfSettings = new SettingsEngine();
    }
    return cdfSettings;
  }

  public void setValue( String key, Object obj, IPentahoSession userSession ) {
    CdfSessionCache.getInstance().putInCdfSessionCache( userSession, key, obj );
  }

  public Object getValue( String key, IPentahoSession userSession ) {
    return CdfSessionCache.getInstance().getFromCdfSessionCache( userSession, key );
  }
}
