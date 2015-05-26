package org.pentaho.cdf.utils;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.CdfEngine;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CorsUtil {

  private static final Log logger = LogFactory.getLog( CorsUtil.class );
  private static CorsUtil instance;

  /**
   *
   * @return
   */
  public static CorsUtil getInstance(){
     if( instance == null ) {
       instance = new CorsUtil();
     }
     return instance;
  }
  /**
   *
   * @param request
   * @param response
   */
  public void setCorsHeaders( HttpServletRequest request, HttpServletResponse response ) {
    final String allowCrossDomainResources = getAllowCrossDomainResources();
    if ( allowCrossDomainResources != null && allowCrossDomainResources.equals( "true" ) ) {
      String origin = request.getHeader( "ORIGIN" );
      if ( origin != null ) {
        response.setHeader( "Access-Control-Allow-Origin", origin );
        response.setHeader( "Access-Control-Allow-Credentials", "true" );
      }
    }
  }

  /**
   *
   * @return
   */
  protected String getAllowCrossDomainResources() {
    return CdfEngine.getEnvironment().getResourceLoader().getPluginSetting( CorsUtil.class,
      CdfConstants.PLUGIN_SETTINGS_ALLOW_CROSS_DOMAIN_RESOURCES );
  }
}
