/*!
 * Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
 * 
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

package org.pentaho.cdf;

import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.MissingResourceException;
import java.util.PropertyResourceBundle;
import java.util.ResourceBundle;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.utils.MessageUtil;

import pt.webdetails.cpf.repository.api.IReadAccess;

/**
 * Utility class for internationalization
 * 
 * @author Will Gorman (wgorman@pentaho.com)
 * 
 */
public class Messages {

  private static final Log logger = LogFactory.getLog( Messages.class );
  private static final Map<Locale, ResourceBundle> locales = Collections
      .synchronizedMap( new HashMap<Locale, ResourceBundle>() );

  private static ResourceBundle getBundle() {

    Locale locale = CdfEngine.getEnvironment().getLocale();
    ResourceBundle bundle = Messages.locales.get( locale );
    if ( bundle == null ) {

      try {
        IReadAccess access = CdfEngine.getPluginSystemReader( null );

        if ( access.fileExists( CdfConstants.GLOBAL_MESSAGES_PROPERTIES_FILE ) ) {
          InputStream in = access.getFileInputStream( CdfConstants.GLOBAL_MESSAGES_PROPERTIES_FILE );
          bundle = new PropertyResourceBundle( in );
          Messages.locales.put( locale, bundle );
        }
      } catch ( Exception e ) {
        logger.error( "Could not get localization bundle", e ); //$NON-NLS-1$
      }
    }
    return bundle;
  }

  public static String getEncodedString( final String rawValue ) {
    if ( rawValue == null ) {
      return ( "" ); //$NON-NLS-1$
    }

    StringBuffer value = new StringBuffer();
    for ( int n = 0; n < rawValue.length(); n++ ) {
      int charValue = rawValue.charAt( n );
      if ( charValue >= 0x80 ) {
        value.append( "&#x" ); //$NON-NLS-1$
        value.append( Integer.toString( charValue, 0x10 ) );
        value.append( ";" ); //$NON-NLS-1$
      } else {
        value.append( (char) charValue );
      }
    }
    return value.toString();

  }

  public static String getXslString( final String key ) {
    String rawValue = Messages.getString( key );
    return Messages.getEncodedString( rawValue );
  }

  public static String getString( final String key ) {
    try {
      return Messages.getBundle().getString( key );
    } catch ( MissingResourceException e ) {
      return '!' + key + '!';
    }
  }

  public static String getString( final String key, final String param1 ) {
    return MessageUtil.getString( Messages.getBundle(), key, param1 );
  }

  public static String getString( final String key, final String param1, final String param2 ) {
    return MessageUtil.getString( Messages.getBundle(), key, param1, param2 );
  }

  public static String getString( final String key, final String param1, final String param2, final String param3 ) {
    return MessageUtil.getString( Messages.getBundle(), key, param1, param2, param3 );
  }

  public static String getString( final String key, final String param1, final String param2, final String param3,
      final String param4 ) {
    return MessageUtil.getString( Messages.getBundle(), key, param1, param2, param3, param4 );
  }

  public static String getErrorString( final String key ) {
    return MessageUtil.formatErrorMessage( key, Messages.getString( key ) );
  }

  public static String getErrorString( final String key, final String param1 ) {
    return MessageUtil.getErrorString( Messages.getBundle(), key, param1 );
  }

  public static String getErrorString( final String key, final String param1, final String param2 ) {
    return MessageUtil.getErrorString( Messages.getBundle(), key, param1, param2 );
  }

  public static String getErrorString( final String key, final String param1, final String param2, final String param3 ) {
    return MessageUtil.getErrorString( Messages.getBundle(), key, param1, param2, param3 );
  }
}
