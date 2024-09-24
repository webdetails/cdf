/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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
