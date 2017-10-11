/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityHelper;
import pt.webdetails.cpf.utils.CharsetHelper;
import pt.webdetails.cpf.utils.PluginIOUtils;

import java.io.IOException;

@Path( "/pentaho-cdf/api/comments" )
public class CommentsApi {

  private static final Log logger = LogFactory.getLog( CommentsApi.class );

  @GET
  @Path( "/add" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public void add( @DefaultValue( "" ) @QueryParam( Parameter.PAGE ) String page,
                   @DefaultValue( "" ) @QueryParam( Parameter.COMMENT ) String comment,
                   @Context HttpServletResponse servletResponse,
                   @Context HttpServletRequest servletRequest ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    try {
      addComment( page, comment, servletResponse );
    } catch ( Exception e ) {
      logger.error( "Error adding comment", e );
    }
  }

  @GET
  @Path( "/list" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public void list( @DefaultValue( "" ) @QueryParam( Parameter.PAGE ) String page,
                    @DefaultValue( "0" ) @QueryParam( Parameter.FIRST_RESULT ) int firstResult,
                    @DefaultValue( "20" ) @QueryParam( Parameter.MAX_RESULTS ) int maxResults,
                    @DefaultValue( "false" ) @QueryParam( Parameter.DELETED ) boolean deleted,
                    @DefaultValue( "false" ) @QueryParam( Parameter.ARCHIVED ) boolean archived,
                    @Context HttpServletResponse servletResponse,
                    @Context HttpServletRequest servletRequest ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    final boolean isAdministrator = isAdministrator();

    if ( deleted && !isAdministrator ) {
      deleted = false;
      logger.warn( "only admin users are allowed to see deleted comments" );
    }

    if ( archived && !isAdministrator ) {
      archived = false;
      logger.warn( "only admin users are allowed to see archived comments" );
    }

    try {
      listComments( page, firstResult, maxResults, deleted, archived, servletResponse );
    } catch ( Exception e ) {
      logger.error( "Error listing comments", e );
    }
  }

  @GET
  @Path( "/archive" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public void archive( @DefaultValue( "0" ) @QueryParam( Parameter.COMMENT_ID ) int commentId,
                       @DefaultValue( "true" ) @QueryParam( Parameter.VALUE ) boolean value,
                       @Context HttpServletResponse servletResponse,
                       @Context HttpServletRequest servletRequest ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    if ( !isAuthenticated() ) {
      logger.error( "Operation not authorized: requires authentication" );
      return;
    }

    try {
      archiveComment( commentId, value, servletResponse );
    } catch ( Exception e ) {
      logger.error( "Error archiving comment", e );
    }
  }

  @GET
  @Path( "/delete" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public void delete( @DefaultValue( "0" ) @QueryParam( "commentId" ) int commentId,
                      @DefaultValue( "true" ) @QueryParam( Parameter.VALUE ) boolean value,
                      @Context HttpServletResponse servletResponse,
                      @Context HttpServletRequest servletRequest ) throws Exception {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    if ( !isAuthenticated() ) {
      logger.error( "Operation not authorized: requires authentication" );
      return;
    }

    try {
      deleteComment( commentId, value, servletResponse );
    } catch ( Exception ex ) {
      logger.error( "Error deleting comment", ex );
    }
  }

  private String getUserName() {
    return PentahoSessionHolder.getSession().getName();
  }

  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) {
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
  }

  protected boolean isAdministrator() {
    return SecurityHelper.getInstance().isPentahoAdministrator( PentahoSessionHolder.getSession() );
  }

  protected boolean isAuthenticated() {
    return PentahoSessionHolder.getSession().isAuthenticated();
  }

  protected void addComment( String page, String comment, HttpServletResponse servletResponse )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException, IOException {

    PluginIOUtils.writeOutAndFlush(
        servletResponse.getOutputStream(),
        CommentsEngine.getInstance().add( page, comment, getUserName() ).toString( 2 )
    );
  }

  protected void listComments( String page,
                               int firstResult,
                               int maxResults,
                               boolean deleted,
                               boolean archived,
                               HttpServletResponse servletResponse )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException, IOException {

    PluginIOUtils.writeOutAndFlush(
        servletResponse.getOutputStream(),
        CommentsEngine.getInstance().list(
          page,
          firstResult,
          maxResults,
          deleted,
          archived,
          getUserName() ).toString( 2 )
    );
  }

  protected void archiveComment( int commentId, boolean value, HttpServletResponse servletResponse )
    throws IOException, JSONException, PluginHibernateException {

    PluginIOUtils.writeOutAndFlush(
        servletResponse.getOutputStream(),
        CommentsEngine.getInstance().archive( commentId, value, getUserName(), isAdministrator() ).toString( 2 )
    );
  };

  protected void deleteComment( int commentId, boolean value, HttpServletResponse servletResponse )
    throws IOException, JSONException, PluginHibernateException {

    PluginIOUtils.writeOutAndFlush(
        servletResponse.getOutputStream(),
        CommentsEngine.getInstance().delete( commentId, value, getUserName(), isAdministrator() ).toString( 2 )
    );
  }
}
