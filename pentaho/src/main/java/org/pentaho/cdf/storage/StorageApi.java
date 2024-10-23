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


package org.pentaho.cdf.storage;

import jakarta.ws.rs.core.MediaType;

import java.io.IOException;
import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.storage.ImpersonationHandler.CdfStorageApiImpersonationException;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;

import pt.webdetails.cpf.utils.CharsetHelper;

@Path( "/pentaho-cdf/api/storage" )
public class StorageApi {

  private StorageEngineInterface engine = null;

  public StorageApi() {
    this( StorageEngine.getInstance() );
  }

  public StorageApi( StorageEngineInterface engine ) {
    this.engine = engine;
  }

  @SuppressWarnings( "serial" )
  private static final Response FORBIDDEN = Response.status( Response.Status.FORBIDDEN ).entity( new JSONObject(
      new HashMap<String, String>() { { put( "error", "no session found" ); } }
    ) ).build();

  @GET
  @Path( "/store" )
  @Consumes( { MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON } )
  @Produces( MediaType.APPLICATION_JSON )
  public Response store( @QueryParam( Parameter.STORAGE_VALUE ) String storageValue,
                         @QueryParam( Parameter.USER ) String user,
                         @Context HttpServletRequest servletRequest,
                         @Context HttpServletResponse servletResponse )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException {

    servletResponse.setContentType( MediaType.APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return store( storageValue, user );
  }

  @GET
  @Path( "/read" )
  @Consumes( { MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON } )
  @Produces( MediaType.APPLICATION_JSON )
  public String read( @QueryParam( Parameter.USER ) String user,
                        @Context HttpServletRequest servletRequest,
                        @Context HttpServletResponse servletResponse )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException, IOException {

    servletResponse.setContentType( MediaType.APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    try {
      return read( user );
    } catch ( CdfStorageApiImpersonationException e ) {
      servletResponse.sendError( HttpServletResponse.SC_FORBIDDEN, FORBIDDEN.getEntity().toString() );
      return null;
    }
  }

  @GET
  @Path( "/delete" )
  @Consumes( { MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON } )
  @Produces( MediaType.APPLICATION_JSON )
  public Response delete( @QueryParam( Parameter.USER ) String user,
                          @Context HttpServletRequest servletRequest,
                          @Context HttpServletResponse servletResponse )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException {

    servletResponse.setContentType( MediaType.APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return delete( user );
  }

  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) {
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
  }

  protected Response store( String storageValue, String user )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException {

    try {
      return Response
        .ok( engine.store(
            storageValue,
            impersonate( user ) ).toString( 2 ) )
        .build();
    } catch ( CdfStorageApiImpersonationException e ) {
      return FORBIDDEN;
    }
  }

  protected String read( String user ) throws PluginHibernateException, JSONException,
      InvalidCdfOperationException, CdfStorageApiImpersonationException {
    try {
      return engine.read( impersonate( user ) ).toString( 2 );
    } catch ( CdfStorageApiImpersonationException e ) {
      throw e;
    }
  }

  protected Response delete( String user )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException {

    try {
      return Response
        .ok( engine.delete(
            impersonate( user ) ).toString( 2 ) )
        .build();
    } catch ( CdfStorageApiImpersonationException e ) {
      return FORBIDDEN;
    }
  }

  protected String impersonate( String user ) throws CdfStorageApiImpersonationException {
    return ImpersonationHandler.getUserName( user );
  }
}
