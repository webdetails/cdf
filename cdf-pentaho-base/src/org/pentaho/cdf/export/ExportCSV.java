/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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
