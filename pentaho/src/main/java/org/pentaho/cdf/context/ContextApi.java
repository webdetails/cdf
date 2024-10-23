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


package org.pentaho.cdf.context;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static jakarta.ws.rs.core.MediaType.APPLICATION_XML;
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
