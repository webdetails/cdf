/*!
 * This program is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License, version 2.1 as published by the Free Software
 * Foundation.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this
 * program; if not, you can obtain a copy at http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * or from the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * Copyright (c) 2002-2013 Pentaho Corporation..  All rights reserved.
 */

package org.pentaho.cdf.utils;

import java.text.MessageFormat;
import java.util.ResourceBundle;

public class MessageUtil {

  public static String formatErrorMessage( final String key, final String msg ) {
    int end = key.indexOf( ".ERROR_" ); //$NON-NLS-1$
    end = ( end < 0 ) ? key.length() : Math.min( end + ".ERROR_0000".length(), key.length() ); //$NON-NLS-1$
    return key.substring( 0, end ) + " - " + msg; //$NON-NLS-1$
  }

  public static String getString( final ResourceBundle bundle, final String key, final Object... params ) {
    try {
      return MessageFormat.format( bundle.getString( key ), params );
    } catch ( Exception e ) {
      return '!' + key + '!';
    }
  }

  public static String getErrorString( final ResourceBundle bundle, final String key, final Object... params ) {
    return MessageUtil.formatErrorMessage( key, MessageUtil.getString( bundle, key, params ) );
  }
}
