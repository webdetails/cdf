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


package org.pentaho.cdf;

import java.io.InputStream;
import java.text.MessageFormat;
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
    return getString( Messages.getBundle(), key, param1 );
  }

  public static String getString( final String key, final String param1, final String param2 ) {
    return getString( Messages.getBundle(), key, param1, param2 );
  }

  public static String getString( final String key, final String param1, final String param2, final String param3 ) {
    return getString( Messages.getBundle(), key, param1, param2, param3 );
  }

  public static String getString( final String key, final String param1, final String param2, final String param3,
      final String param4 ) {
    return getString( Messages.getBundle(), key, param1, param2, param3, param4 );
  }

  public static String getErrorString( final String key ) {
    return formatErrorMessage( key, Messages.getString( key ) );
  }

  public static String getErrorString( final String key, final String param1 ) {
    return getErrorString( Messages.getBundle(), key, param1 );
  }

  public static String getErrorString( final String key, final String param1, final String param2 ) {
    return getErrorString( Messages.getBundle(), key, param1, param2 );
  }

  public static String getErrorString( final String key, final String param1, final String param2, final String param3 ) {
    return getErrorString( Messages.getBundle(), key, param1, param2, param3 );
  }

  private static String formatErrorMessage( final String key, final String msg ) {
    int end = key.indexOf( ".ERROR_" ); //$NON-NLS-1$
    end = ( end < 0 ) ? key.length() : Math.min( end + ".ERROR_0000".length(), key.length() ); //$NON-NLS-1$
    return key.substring( 0, end ) + " - " + msg; //$NON-NLS-1$
  }

  private static String getString( final ResourceBundle bundle, final String key, final Object... params ) {
    try {
      return MessageFormat.format( bundle.getString( key ), params );
    } catch ( Exception e ) {
      return '!' + key + '!';
    }
  }

  private static String getErrorString( final ResourceBundle bundle, final String key, final Object... params ) {
    return formatErrorMessage( key, getString( bundle, key, params ) );
  }
}
