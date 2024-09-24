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
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.cdf.utils.JsonUtil;
import pt.webdetails.cpf.utils.CharsetHelper;

@Path( "/pentaho-cdf/api/context" )
public class ContextApi {

  private static final Log logger = LogFactory.getLog( ContextApi.class );

  @GET
  @Path( "/get" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public Response get( @QueryParam( Parameter.PATH ) String path,
                       @QueryParam( Parameter.USER ) String user,
                       @Context HttpServletRequest servletRequest,
                       @Context HttpServletResponse servletResponse ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return buildContext( path, user, servletRequest );
  }

  @GET
  @Path( "/getConfig" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public Response getConfig( @QueryParam( Parameter.PATH ) String path,
                         @QueryParam( Parameter.VIEW ) String view,
                         @Context HttpServletRequest servletRequest,
                         @Context HttpServletResponse servletResponse ) {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );
    setCorsHeaders( servletRequest, servletResponse );

    return Response.ok( writeConfig( path, servletRequest ) ).build();
  }

  protected void setCorsHeaders( HttpServletRequest servletRequest, HttpServletResponse servletResponse ) {
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
  }

  protected Response buildContext( String path, String user, HttpServletRequest servletRequest ) {
    try {
      return Response
        .ok( ContextEngine.getInstance().buildContext(
          path,
          user,
          Parameter.asHashMap( servletRequest ),
          servletRequest.getSession().getMaxInactiveInterval() ).toString( 2 ) )
        .build();
    } catch ( JSONException e ) {
      logger.error( "Error getting context", e );
      return Response.serverError().build();
    }
  }

  protected String writeConfig(
      String path,
      HttpServletRequest servletRequest ) {

    try {
      return ContextEngine.getInstance().getConfig(
        path,
        Parameter.asHashMap( servletRequest ),
        servletRequest.getSession().getMaxInactiveInterval()
      );
    } catch ( JSONException e ) {
      logger.error( "Error getting config", e );
      return JsonUtil.makeJsonErrorResponse( "Error getting config: " + e.getMessage(), false ).toString();
    }
  }
}
