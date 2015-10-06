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

package org.pentaho.cdf.context;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import pt.webdetails.cpf.utils.PluginIOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.io.IOException;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;


@Path( "/pentaho-cdf/api/context" )
public class ContextApi {

  private static final Log logger = LogFactory.getLog( ContextApi.class );

  @GET
  @Path( "/get" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( MediaType.APPLICATION_JSON )
  public Response get( @QueryParam( Parameter.PATH ) String path,
      @QueryParam( Parameter.USER ) String user,
      @Context HttpServletRequest servletRequest, @Context HttpServletResponse servletResponse ) {

    JSONObject context = ContextEngine.getInstance().buildContext( path, user, Parameter.asHashMap( servletRequest ),
        servletRequest.getSession().getMaxInactiveInterval() );
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
    try {
      return Response.ok( context.toString( 2 ) ).build();
    } catch ( JSONException e ) {
      logger.error( e );
      return Response.serverError().build();
    }
  }

  @GET
  @Path( "/getConfig" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( MediaType.APPLICATION_JSON )
  public void getConfig( @QueryParam( Parameter.PATH ) String path,
                         @QueryParam( Parameter.VIEW ) String view,
                         @Context HttpServletRequest servletRequest,
                         @Context HttpServletResponse servletResponse ) throws IOException {
    String config;

    try {
      config = ContextEngine.getInstance().getConfig( path, view, Parameter.asHashMap( servletRequest ),
        servletRequest.getSession().getMaxInactiveInterval() );
    } catch ( JSONException e ) {
      config = "An error occurred while getting the context configuration";
    }
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
    PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), config );
  }
}
