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

import static jakarta.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static jakarta.ws.rs.core.MediaType.APPLICATION_XML;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.web.http.api.resources.utils.SystemUtils;
import pt.webdetails.cpf.utils.CharsetHelper;

@Path( "/pentaho-cdf/api/comments" )
public class CommentsApi {

  private static final Log logger = LogFactory.getLog( CommentsApi.class );

  @GET
  @Path( "/add" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public Response add( @DefaultValue( "" ) @QueryParam( Parameter.PAGE ) String page,
                       @DefaultValue( "" ) @QueryParam( Parameter.COMMENT ) String comment,
                       @Context HttpServletResponse servletResponse,
                       @Context HttpServletRequest servletRequest ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    try {
      return Response.ok( addComment( page, comment ) ).build();
    } catch ( Exception e ) {
      logger.error( "Error adding comment", e );
      return Response.serverError().build();
    }
  }

  @GET
  @Path( "/list" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public Response list( @DefaultValue( "" ) @QueryParam( Parameter.PAGE ) String page,
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
      return Response.ok( listComments( page, firstResult, maxResults, deleted, archived ) ).build();
    } catch ( Exception e ) {
      logger.error( "Error listing comments", e );
      return Response.serverError().build();
    }
  }

  @GET
  @Path( "/archive" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public Response archive( @DefaultValue( "0" ) @QueryParam( Parameter.COMMENT_ID ) int commentId,
                       @DefaultValue( "true" ) @QueryParam( Parameter.VALUE ) boolean value,
                       @Context HttpServletResponse servletResponse,
                       @Context HttpServletRequest servletRequest ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    if ( !isAuthenticated() ) {
      logger.error( "Operation not authorized: requires authentication" );
      return Response.status( Response.Status.UNAUTHORIZED ).build();
    }

    try {
      return Response.ok( archiveComment( commentId, value ) ).build();
    } catch ( Exception e ) {
      logger.error( "Error archiving comment", e );
      return Response.serverError().build();
    }
  }

  @GET
  @Path( "/delete" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  @Produces( APPLICATION_JSON )
  public Response delete( @DefaultValue( "0" ) @QueryParam( "commentId" ) int commentId,
                      @DefaultValue( "true" ) @QueryParam( Parameter.VALUE ) boolean value,
                      @Context HttpServletResponse servletResponse,
                      @Context HttpServletRequest servletRequest ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    if ( !isAuthenticated() ) {
      logger.error( "Operation not authorized: requires authentication" );
      return Response.status( Response.Status.UNAUTHORIZED ).build();
    }

    try {
      return Response.ok( deleteComment( commentId, value ) ).build();
    } catch ( Exception ex ) {
      logger.error( "Error deleting comment", ex );
      return Response.serverError().build();
    }
  }

  private String getUserName() {
    return PentahoSessionHolder.getSession().getName();
  }

  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) {
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
  }

  protected boolean isAdministrator() {
    return SystemUtils.canAdminister();
  }

  protected boolean isAuthenticated() {
    return PentahoSessionHolder.getSession().isAuthenticated();
  }

  protected String addComment( String page, String comment )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException {

    return CommentsEngine.getInstance().add( page, comment, getUserName() ).toString( 2 );
  }

  protected String listComments( String page,
                               int firstResult,
                               int maxResults,
                               boolean deleted,
                               boolean archived )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException {

    return CommentsEngine.getInstance().list(
          page,
          firstResult,
          maxResults,
          deleted,
          archived,
          getUserName() ).toString( 2 );
  }

  protected String archiveComment( int commentId, boolean value )
    throws JSONException, PluginHibernateException {

    return CommentsEngine.getInstance().archive( commentId, value, getUserName(), isAdministrator() ).toString( 2 );
  }

  protected String deleteComment( int commentId, boolean value )
    throws JSONException, PluginHibernateException {

    return CommentsEngine.getInstance().delete( commentId, value, getUserName(), isAdministrator() ).toString( 2 );
  }
}
