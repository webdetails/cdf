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

import jxl.Workbook;
import jxl.format.BorderLineStyle;
import jxl.format.Border;
import jxl.format.Colour;
import jxl.write.Label;
import jxl.write.Number;
import jxl.write.NumberFormat;
import jxl.write.WritableCellFormat;
import jxl.write.WritableSheet;
import jxl.write.WritableWorkbook;
import jxl.write.WriteException;

import org.pentaho.cdf.Messages;

@SuppressWarnings( "serial" )
public class ExportExcel extends Export implements IExport {

  WritableCellFormat cs;
  WritableCellFormat hcs;
  WritableCellFormat rcs;
  WritableCellFormat csn;
  public static final String extensionFile = ".xls";

  public ExportExcel( final OutputStream out ) throws IOException {
    super( out );
  }

  public void export( String[][] resultSet ) {

    WritableWorkbook wb = null;

    try {

      wb = Workbook.createWorkbook( outputStream );
      WritableSheet sheet = wb.createSheet( "Sheet", 0 );
      setCellsStyles();
      WritableCellFormat cf;

      if ( resultSet.length > 0 ) {

        boolean swapRows = resultSet[ 0 ].length > 256 ? true : false;

        for ( int i = 0; i < resultSet.length; i++ ) {
          String[] vs = resultSet[ i ];
          for ( int j = 0; j < vs.length; j++ ) {
            cf = i == 0 ? hcs : j != 0 ? cs : ( i % 2 != 0 ? hcs : rcs );
            String value = vs[ j ];
            if ( value == null ) {
              break;
            }
            if ( isDouble( value ) ) {
              Number number = new Number( swapRows ? i : j, swapRows ? j : i, Double.parseDouble( value ), csn );
              sheet.addCell( number );
            } else {
              Label label = new Label( swapRows ? i : j, swapRows ? j : i, value, cf );
              sheet.addCell( label );
            }
          }
        }
      }

      wb.write();

    } catch ( IOException e ) {
      logger.error( Messages.getErrorString( "CdfExportExcel.ERROR_0001_OPENING_CLOSING_EXCEL" ) );
    } catch ( WriteException e ) {
      logger.error( Messages.getErrorString( "CdfExportExcel.ERROR_0002_WRITING_EXCEL" ) );
    } catch ( Exception e ) {
      logger.error( Messages.getErrorString( "CdfExportExcel.ERROR_0003_BUILDING_EXCEL" ) );
    } finally {
      try {
        wb.close();
      } catch ( Exception e ) {
        logger.error( Messages.getErrorString( "CdfExportExcel.ERROR_0001_OPENING_CLOSING_EXCEL" ) );
      }
    }
  }

  private void setCellsStyles() throws WriteException {

    cs = new WritableCellFormat();
    cs.setBorder( Border.ALL, BorderLineStyle.THIN );
    cs.setShrinkToFit( true );
    csn = new WritableCellFormat( new NumberFormat( "###,###,###.###" ) );
    csn.setBorder( Border.ALL, BorderLineStyle.THIN );
    csn.setShrinkToFit( true );

    hcs = new WritableCellFormat();
    hcs.setBorder( Border.ALL, BorderLineStyle.THIN );
    hcs.setBackground( Colour.GRAY_50 );
    hcs.setShrinkToFit( true );

    rcs = new WritableCellFormat();
    rcs.setBorder( Border.ALL, BorderLineStyle.THIN );
    rcs.setBackground( Colour.GRAY_25 );
    rcs.setShrinkToFit( true );

  }

  public String getExtension() {
    return extensionFile;
  }
}
