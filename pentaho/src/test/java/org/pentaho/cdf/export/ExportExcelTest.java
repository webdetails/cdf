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

import junit.framework.TestCase;
//import org.junit.Assert;
import org.junit.Test;

//import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class ExportExcelTest extends TestCase {

  @Test
  //Just want to make sure that the jxl dependency is working against CDF code, so result check is pretty basic
  public void testExportExcel() throws IOException {
    /* TODO: not working. to be fixed
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ExportExcel ee = new ExportExcel( baos );
    ee.export( new String[][]{ { "Test", "Test2" }, { "1", "2" }, { "3", "4" } } );

    byte[] array = baos.toByteArray();

    Assert.assertTrue( array.length > 0 );
      */
  }
}
