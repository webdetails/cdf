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


package org.pentaho.cdf.settings;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

@Path( "/pentaho-cdf/api/settings" )
public class SettingsApi {

  IPentahoSession userSession;

  private static final Log logger = LogFactory.getLog( SettingsApi.class );

  @POST
  @Path( "/set" )
  public void set( @FormParam( Parameter.KEY ) String key, @FormParam( Parameter.VALUE ) String value ) {

    if ( StringUtils.isEmpty( key ) || StringUtils.isEmpty( value ) ) {
      logger.error( "empty values not allowed -> key:" + key + " | value:" + value );
      return;
    }

    SettingsEngine.getInstance().setValue( key, value, PentahoSessionHolder.getSession() );

  }

  @GET
  @Path( "/get" )
  public Response get( @QueryParam( Parameter.KEY ) String key, @Context HttpServletRequest servletRequest,
                       @Context HttpServletResponse servletResponse ) {

    CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );

    if ( StringUtils.isEmpty( key ) ) {
      logger.error( "empty key value not allowed" );
      return Response.status( Response.Status.BAD_REQUEST ).build();
    }

    final Object value = SettingsEngine.getInstance().getValue( key, PentahoSessionHolder.getSession() );
    if ( value != null )  {
      return Response.ok( value.toString() ).build();
    }
    return Response.status( Response.Status.NOT_FOUND ).build();
  }
}
