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


package org.pentaho.cdf.utils;

import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.CdfEngine;
import pt.webdetails.cpf.utils.AbstractCorsUtil;
import pt.webdetails.cpf.utils.CsvUtil;

import java.util.Collection;

/**
 * CDF CorsUtil implementation
 */
public class CorsUtil extends AbstractCorsUtil {

  private static CorsUtil instance;

  public static CorsUtil getInstance() {
    if ( instance == null ) {
      instance = new CorsUtil();
    }
    return instance;
  }

  /**
   * Retrieves a flag value from a plugin settings.xml
   * @return true if the flag is present and CORS is allowed, otherwise returns false
   */
  @Override protected boolean isCorsAllowed() {
    return "true".equalsIgnoreCase( CdfEngine.getEnvironment().getResourceLoader().getPluginSetting( CorsUtil.class,
      CdfConstants.PLUGIN_SETTINGS_ALLOW_CROSS_DOMAIN_RESOURCES ) );
  }

  /**
   * Retrieves a list value from a plugin settings.xml
   * @return returns a domain white list, if it is present, otherwise returns an empty list
   */
  @Override protected Collection<String> getDomainWhitelist() {
    return CsvUtil.parseCsvString( CdfEngine.getEnvironment().getResourceLoader().getPluginSetting( CorsUtil.class,
      CdfConstants.PLUGIN_SETTINGS_CROSS_DOMAIN_RESOURCES_WHITELIST ) );
  }
}
