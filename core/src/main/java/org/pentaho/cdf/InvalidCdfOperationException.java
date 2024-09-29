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

public class InvalidCdfOperationException extends Exception {
  private static final long serialVersionUID = 1L;

  public InvalidCdfOperationException( Exception ex ) {
    super( ex );
  }

  public InvalidCdfOperationException( String string ) {
    super( string );
  }
}
