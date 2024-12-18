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


package org.pentaho.cdf.export;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;

import org.pentaho.cdf.Messages;

@SuppressWarnings( "serial" )
public class ExportCSV extends Export implements IExport {

  private static final String extensionFile = ".csv";

  public ExportCSV( final OutputStream out ) throws IOException {
    super( out );
  }

  public void export( String[][] resultSet ) {

    PrintWriter pw = new PrintWriter( outputStream );

    try {

      for ( int i = 0; i < resultSet.length; i++ ) {
        String[] vs = resultSet[ i ];
        for ( int j = 0; j < vs.length; j++ ) {
          String value = vs[ j ];
          if ( value == null ) {
            break;
          }
          //pw.append(isDouble(value) ? new Double(value).toString(): vs[j]);
          if ( isDouble( value ) ) {
            pw.append( new Double( value ).toString() );
          } else {
            String aux = value.replaceAll( "\"", "\\\\\"" );
            pw.append( '\"' + aux + '\"' );
          }
          if ( j + 1 < vs.length ) {
            pw.append( ',' );
          }
        }
        pw.append( '\n' );
      }

      pw.flush();

    } catch ( Exception e ) {
      logger.error( Messages.getErrorString( "CdfExportCSV.ERROR_0001_BUILDING_CSV" ) );
    } finally {
      pw.close();
    }
  }

  public String getExtension() {
    return extensionFile;
  }
}
