/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
