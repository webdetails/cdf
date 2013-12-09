/*!
* Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
*
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

package org.pentaho.cdf.views;

import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONObject;
import org.pentaho.cdf.comments.CommentsApi;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

import pt.webdetails.cpf.utils.PluginIOUtils;

@Path( "/pentaho-cdf/api/views" )
public class ViewsApi {

  private static final Log logger = LogFactory.getLog( CommentsApi.class );

  @GET
  @Path( "/list" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public void listViews( @Context HttpServletResponse servletResponse, @Context HttpServletRequest servletRequest ) {
    JSONObject json;
    String result = "";

    try {
      json = ViewsEngine.getInstance().listViews( getUserName() );
      result = json.toString( 2 );
    } catch ( Exception e ) {
      logger.error( "Error listing views: " + e );
    }

    try {
      PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), result );
    } catch ( IOException ex ) {
      logger.error( "Error while outputing result", ex );
    }
  }

  @GET
  @Path( "/save" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public void saveView( @DefaultValue( "" ) @QueryParam( Parameter.NAME ) String view,

  @Context HttpServletResponse servletResponse, @Context HttpServletRequest servletRequest ) {

    try {

      String result = ViewsEngine.getInstance().saveView( view, getUserName() );
      PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), result );

    } catch ( Exception ex ) {
      logger.error( "Error while outputing result", ex );
    }
  }

  @GET
  @Path( "/delete" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public void deleteView( @DefaultValue( "" ) @QueryParam( Parameter.NAME ) String name,

  @Context HttpServletResponse servletResponse, @Context HttpServletRequest servletRequest ) {

    try {

      String result = ViewsEngine.getInstance().deleteView( name, getUserName() );
      PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), result );

    } catch ( IOException ex ) {
      logger.error( "Error while outputing result", ex );
    }
  }

  private String getUserName() {
    return PentahoSessionHolder.getSession().getName();
  }
}
