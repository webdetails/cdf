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

import org.pentaho.platform.api.engine.ICacheManager;
import org.pentaho.platform.api.engine.ILogoutListener;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSystem;

public class CdfSessionCache implements ILogoutListener {

  private static final String CDF_CACHE = "CDF_CACHE_"; //$NON-NLS-1$
  private static ICacheManager cacheManager;
  private static CdfSessionCache cdfSessionCache;

  static {
    cacheManager = PentahoSystem.getCacheManager( null ); // cache manager gets loaded just once...
    cdfSessionCache = new CdfSessionCache();
  }

  private CdfSessionCache() {
    PentahoSystem.addLogoutListener( this ); // So you can remove a users' region when their session disappears
  }

  public static CdfSessionCache getInstance() {
    return cdfSessionCache;
  }

  public boolean initCacheRegion( IPentahoSession session ) throws IllegalStateException {
    return initCacheRegion( getCdfRegion( session ) );
  }

  public boolean initCacheRegion( String region ) throws IllegalStateException {
    if ( !cacheManager.cacheEnabled( region ) ) {
      if ( !cacheManager.addCacheRegion( region ) ) {
        throw new IllegalStateException( "CDF cache cannot be initialized." );
      }
    }
    return true;
  }

  public void putInCdfSessionCache( IPentahoSession session, Object key, Object value ) throws IllegalStateException {
    assert ( session != null );
    String region = getCdfRegion( session );
    initCacheRegion( region );
    cacheManager.putInRegionCache( region, key, value );
  }

  public Object getFromCdfSessionCache( IPentahoSession session, Object key ) throws IllegalStateException {
    assert ( session != null );
    String region = getCdfRegion( session );
    initCacheRegion( region );
    return cacheManager.getFromRegionCache( region, key );
  }

  public void clearCdfSessionCache( IPentahoSession session ) throws IllegalStateException {
    assert ( session != null );
    String region = getCdfRegion( session );
    initCacheRegion( region );
    cacheManager.clearRegionCache( region );
  }

  protected String getCdfRegion( IPentahoSession session ) {
    String rtn = (String) session.getAttribute( CDF_CACHE ); // Only append once if possible;
    if ( rtn == null ) {
      rtn = new StringBuilder().append( CDF_CACHE ).append( '_' ).append( session.getId() ).toString();
      session.setAttribute( CDF_CACHE, rtn );
    }
    return rtn;
  }

  public void onLogout( final IPentahoSession session ) {
    cacheManager.removeRegionCache( getCdfRegion( session ) );
  }
}
