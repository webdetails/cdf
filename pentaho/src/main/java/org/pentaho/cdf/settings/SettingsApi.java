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

package org.pentaho.cdf.settings;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

import pt.webdetails.cpf.utils.PluginIOUtils;

@Path( "/pentaho-cdf/api/settings" )
public class SettingsApi {

  IPentahoSession userSession;

  private static final Log logger = LogFactory.getLog( SettingsApi.class );

  public SettingsApi() {
  }

  @POST
  @Path( "/set" )
  public void set( @FormParam( Parameter.KEY ) String key, @FormParam( Parameter.VALUE ) String value ) {

    if ( StringUtils.isEmpty( key ) || StringUtils.isEmpty( value ) ) {
      logger.equals( "empty values not allowed -> key:" + key + " | value:" + value );
      return;
    }

    SettingsEngine.getInstance().setValue( key, value, PentahoSessionHolder.getSession() );

  }

  @GET
  @Path( "/get" )
  public void get( @QueryParam( Parameter.KEY ) String key, @Context HttpServletRequest servletRequest,
                   @Context HttpServletResponse servletResponse ) {

    if ( StringUtils.isEmpty( key ) ) {
      logger.equals( "empty key value not allowed" );
      return;
    }

    final Object value = SettingsEngine.getInstance().getValue( key, PentahoSessionHolder.getSession() );

    try {
      PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), value.toString() );
      CorsUtil.getInstance().setCorsHeaders( servletRequest, servletResponse );
    } catch ( Exception e ) {
      logger.error( e );
    }
  }
}
