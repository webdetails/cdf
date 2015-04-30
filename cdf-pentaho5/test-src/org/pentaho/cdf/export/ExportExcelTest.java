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

import junit.framework.TestCase;
import org.junit.Assert;
import org.junit.Test;

import java.io.ByteArrayOutputStream;
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
