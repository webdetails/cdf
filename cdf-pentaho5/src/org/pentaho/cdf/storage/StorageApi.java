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
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

/**
 * @author rmansoor
 */
@Path( "/pentaho-cdf/api/storage" )
public class StorageApi {

  private static final Log logger = LogFactory.getLog( StorageApi.class );

  @GET
  @Path( "/store" )
  @Produces( "text/plain" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  public Response store( @QueryParam( Parameter.STORAGE_VALUE ) String storageValue,
                         @QueryParam( Parameter.USER ) String user,
                         @Context HttpServletRequest request,
                         @Context HttpServletResponse response )
    throws InvalidCdfOperationException, JSONException, PluginHibernateException {

    setCorsHeaders( request, response );
    JSONObject json =
      StorageEngine.getInstance().store( storageValue, StringUtils.isEmpty( user ) ? getUserName() : user );

    return JsonUtil.isSuccessResponse( json ) ? Response.ok( json.toString( 2 ) ).build()
      : Response.serverError().build();
  }

  @GET
  @Path( "/read" )
  @Produces( "text/plain" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  public String read( @QueryParam( Parameter.USER ) String user,
                      @Context HttpServletRequest request,
                      @Context HttpServletResponse response ) throws JSONException, InvalidCdfOperationException,
    PluginHibernateException {

    setCorsHeaders( request, response );
    JSONObject json = StorageEngine.getInstance().read( StringUtils.isEmpty( user ) ? getUserName() : user );

    if ( json != null ) {
      return json.toString();
    } else {
      logger.error( "json object is null" );
      return JsonUtil.JsonResult.ERROR;
    }
  }

  @GET
  @Path( "/delete" )
  @Produces( "text/plain" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  public Response delete( @QueryParam( Parameter.USER ) String user,
                          @Context HttpServletRequest request,
                          @Context HttpServletResponse response )
    throws JSONException, InvalidCdfOperationException, PluginHibernateException {

    setCorsHeaders( request, response );
    JSONObject json = StorageEngine.getInstance().delete( StringUtils.isEmpty( user ) ? getUserName() : user );

    return JsonUtil.isSuccessResponse( json ) ? Response.ok( json.toString( 2 ) ).build()
      : Response.serverError().build();
  }

  private String getUserName() {
    return PentahoSessionHolder.getSession().getName();
  }

  private void setCorsHeaders( HttpServletRequest request, HttpServletResponse response ) {
    String origin = request.getHeader( "ORIGIN" );
    if ( origin != null ) {
      response.setHeader( "Access-Control-Allow-Origin", origin );
      response.setHeader( "Access-Control-Allow-Credentials", "true" );
    }
  }
}
