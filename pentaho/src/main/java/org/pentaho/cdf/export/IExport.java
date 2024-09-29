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


package org.pentaho.cdf.export;

public interface IExport {

  public static final String EXPORT_TYPE_EXCEL = "excel";
  public static final String EXPORT_TYPE_CSV = "csv";

  public static final String DEFAULT_EXPORT_TYPE = EXPORT_TYPE_EXCEL;

  public abstract void export( String[][] resultSet );

  public abstract String getExtension();
}
