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

package org.pentaho.cdf.comments;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CommentsApiForTests extends CommentsApi {
  @Override
  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) { }

  @Override
  protected boolean isAdministrator() {
    return true;
  }

  @Override
  protected boolean isAuthenticated() {
    return true;
  }

  @Override
  protected String addComment( String page, String comment ) { return ""; }

  @Override
  protected String listComments( String page,
                               int firstResult,
                               int maxResults,
                               boolean deleted,
                               boolean archived ) { return ""; }

  @Override
  protected String archiveComment( int commentId, boolean value ) { return ""; }

  @Override
  protected String deleteComment( int commentId, boolean value ) { return ""; }
}
