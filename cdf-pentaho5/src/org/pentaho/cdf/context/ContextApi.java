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
                           @QueryParam( Parameter.USER ) String user,
                           @Context HttpServletRequest servletRequest, @Context HttpServletResponse servletResponse )
    throws IOException {
    String config;

    try {
      config = ContextEngine.getInstance().getConfig( path, user, Parameter.asHashMap( servletRequest ),
        servletRequest.getSession().getMaxInactiveInterval() );
    } catch ( JSONException e ) {
      config = "Error ocurred getting context configuration";
    }
    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
    PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), config );
  }
}
