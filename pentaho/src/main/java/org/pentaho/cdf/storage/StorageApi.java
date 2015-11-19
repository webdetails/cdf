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

package org.pentaho.cdf.storage;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import org.apache.commons.lang.StringUtils;
import org.json.JSONException;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import pt.webdetails.cpf.utils.CharsetHelper;

@Path( "/pentaho-cdf/api/storage" )
public class StorageApi {

  @GET
  @Path( "/store" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public Response store( @QueryParam( Parameter.STORAGE_VALUE ) String storageValue,
                         @QueryParam( Parameter.USER ) String user,
                         @Context HttpServletRequest servletRequest,
                         @Context HttpServletResponse servletResponse )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return store( storageValue, user );
  }

  @GET
  @Path( "/read" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public String read( @QueryParam( Parameter.USER ) String user,
                        @Context HttpServletRequest servletRequest,
                        @Context HttpServletResponse servletResponse )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return read( user );
  }

  @GET
  @Path( "/delete" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public Response delete( @QueryParam( Parameter.USER ) String user,
                          @Context HttpServletRequest servletRequest,
                          @Context HttpServletResponse servletResponse )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return delete( user );
  }

  private String getUserName() {
    return PentahoSessionHolder.getSession().getName();
  }

  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) {
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
  }

  protected Response store( String storageValue, String user )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException {

    return Response
      .ok( StorageEngine.getInstance().store(
          storageValue,
          StringUtils.isEmpty( user ) ? getUserName() : user ).toString( 2 ) )
      .build();
  }

  protected String read( String user ) throws PluginHibernateException, JSONException, InvalidCdfOperationException {
    return StorageEngine.getInstance().read( StringUtils.isEmpty( user ) ? getUserName() : user ).toString( 2 );
  }

  protected Response delete( String user )
    throws PluginHibernateException, JSONException, InvalidCdfOperationException {

    return Response
      .ok( StorageEngine.getInstance().delete(
        StringUtils.isEmpty( user ) ? getUserName() : user ).toString( 2 ) )
      .build();
  }
}
