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


package org.pentaho.cdf.comments;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
