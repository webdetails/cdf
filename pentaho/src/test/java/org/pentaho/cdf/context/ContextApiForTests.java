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


package org.pentaho.cdf.context;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.Response;

public class ContextApiForTests extends ContextApi {
  @Override
  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) { }

  @Override
  protected Response buildContext( String path, String user, HttpServletRequest servletRequest ) {
    return null;
  }

  @Override
  protected String writeConfig(
    String path,
    HttpServletRequest servletRequest ) { return ""; }
}
