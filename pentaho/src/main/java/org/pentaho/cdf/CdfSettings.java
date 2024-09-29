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


package org.pentaho.cdf;

import org.pentaho.platform.api.engine.IPentahoSession;

public class CdfSettings  {

  private static CdfSettings cdfSettings = null;

  static CdfSettings getInstance() {
    if ( cdfSettings == null ) {
      cdfSettings = new CdfSettings();
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
