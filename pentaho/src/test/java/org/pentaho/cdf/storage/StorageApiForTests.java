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

package org.pentaho.cdf.storage;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.Response;

public class StorageApiForTests extends StorageApi {

  public StorageApiForTests() {
    super( null );
  }

  @Override
  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) { }

  @Override
  protected Response store( String storageValue, String user ) {
    return null;
  }

  @Override
  protected String read( String user ) {
    return null;
  }

  @Override
  protected Response delete( String user ) {
    return null;
  }
}
