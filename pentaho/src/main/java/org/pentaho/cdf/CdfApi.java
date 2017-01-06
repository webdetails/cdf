/*!
 * Copyright 2002 - 2017 Webdetails, a Pentaho company. All rights reserved.
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

package org.pentaho.cdf;

import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.TEXT_PLAIN;
import static javax.ws.rs.core.MediaType.TEXT_HTML;
import static pt.webdetails.cpf.utils.MimeTypes.CSV;
import static pt.webdetails.cpf.utils.MimeTypes.JAVASCRIPT;
import static pt.webdetails.cpf.utils.MimeTypes.XLS;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
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
import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.embed.EmbeddedHeadersGenerator;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.cdf.export.IExport;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.xactions.ActionEngine;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.engine.core.system.PentahoRequestContextHolder;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.util.web.MimeHelper;
import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.utils.CharsetHelper;
import pt.webdetails.cpf.utils.PluginIOUtils;

@Path( "/pentaho-cdf/api" )
public class CdfApi {

  private static final Log logger = LogFactory.getLog( CdfApi.class );
  private static final String HTTP = "http";
  private static final String HTTPS = "https";

  @GET
  @Path( "/ping" )
  @Produces( TEXT_PLAIN )
  public Response doGetPing() throws InvalidCdfOperationException {
    return Response.ok( "{\"ping\":\"ok\"}" ).build();
  }

  @POST
  @Path( "/ping" )
  @Produces( TEXT_PLAIN )
  public Response doPostPing() throws InvalidCdfOperationException {
    return Response.ok( "{\"ping\":\"ok\"}" ).build();
  }

  @GET
  @Path( "/getResource" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public void getResource( @QueryParam( Parameter.RESOURCE ) String resource,
                           @QueryParam( Parameter.PATH ) String path,
                           @Context HttpServletResponse response )
    throws Exception {
    try {

      if ( !StringUtils.isEmpty( resource ) && StringUtils.isEmpty( path ) ) {
        // legacy calls used resource param; 5.0 calls use path param
        path = resource;
      }

      path = path != null && path.endsWith( "/content" ) ? path.substring( 0, path.indexOf( "/content" ) ) : path;

      response.setHeader( "Content-Type", MimeHelper.getMimeTypeFromFileName( path ) );

      final IPluginResourceLoader resLoader = PentahoSystem.get( IPluginResourceLoader.class, null );
      final String formats =
          resLoader.getPluginSetting( this.getClass(), CdfConstants.PLUGIN_SETTINGS_DOWNLOADABLE_FORMATS );

      List<String> allowedFormats = Arrays.asList( StringUtils.split( formats, ',' ) );
      String extension = path.replaceAll( ".*\\.(.*)", "$1" );
      if ( allowedFormats.indexOf( extension ) < 0 ) {
        // We can't provide this type of file
        throw new SecurityException( "Not allowed" );
      }

      IReadAccess systemAccess = CdfEngine.getPluginSystemReader( null );

      if ( !systemAccess.fileExists( path ) ) {
        logger.warn( "resource does not exist: " + path );
        return;
      }

      PluginIOUtils.writeOutAndFlush( response.getOutputStream(), systemAccess.getFileInputStream( path ) );
      response.getOutputStream().flush();

    } catch ( Exception e ) {
      logger.error( e );
      response.sendError( HttpServletResponse.SC_FORBIDDEN );
    }
  }

  @POST
  @Path( "/getResource" )
  public void postResource( @QueryParam( Parameter.RESOURCE ) String resource,
                            @QueryParam( Parameter.PATH ) String path,
                            @Context HttpServletResponse response )
    throws Exception {
    getResource( resource, path, response );
  }

  @GET
  @Path( "/getContext" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public String getContext( @QueryParam( Parameter.PATH ) @DefaultValue( StringUtils.EMPTY ) String path,
                            @QueryParam( Parameter.ACTION ) @DefaultValue( StringUtils.EMPTY ) String action,
                            @QueryParam( Parameter.VIEW ) @DefaultValue( StringUtils.EMPTY ) String view,
                            @Context HttpServletRequest servletRequest ) {
    int inactiveInterval = servletRequest.getSession().getMaxInactiveInterval();
    return ContextEngine.getInstance()
      .getContext( path, Parameter.asHashMap( servletRequest ), inactiveInterval );
  }

  @GET
  @Path( "/clearCache" )
  public void clearCache( @Context HttpServletResponse servletResponse ) {
    try {
      ContextEngine.clearCache();
      PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), "Cache Cleared" );
    } catch ( IOException e ) {
      logger.error( "failed to clear CDF cache" );
    }
  }

  @POST
  @Path( "/export" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public void doPostExport(
      @FormParam( Parameter.SOLUTION ) String solution,
      @FormParam( Parameter.PATH ) String path,
      @FormParam( Parameter.ACTION ) String action,
      @FormParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
      @FormParam( Parameter.EXPORT_TYPE ) @DefaultValue( IExport.DEFAULT_EXPORT_TYPE ) String exportType,
      @Context HttpServletRequest request,
      @Context HttpServletResponse response ) throws Exception {

    export( solution, path, action, contentType, exportType, request, response );
  }
  @GET
  @Path( "/export" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public void export(
      @QueryParam( Parameter.SOLUTION ) String solution,
      @QueryParam( Parameter.PATH ) String path,
      @QueryParam( Parameter.ACTION ) String action,
      @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
      @QueryParam( Parameter.EXPORT_TYPE ) @DefaultValue( IExport.DEFAULT_EXPORT_TYPE ) String exportType,
      @Context HttpServletRequest request,
      @Context HttpServletResponse response ) throws Exception {

    String value = determineCorrectPath( solution, action, path );

    if ( ActionEngine.getInstance().executeAction(
        value,
        contentType,
        request,
        response,
        PentahoSessionHolder.getSession(),
        Parameter.asHashMap( request ) ) ) {
      Export export;

      if ( IExport.EXPORT_TYPE_CSV.equalsIgnoreCase( exportType ) ) {
        export = new ExportCSV( response.getOutputStream() );
        response.setHeader( "Content-Type", CSV );

      } else {
        export = new ExportExcel( response.getOutputStream() );
        response.setHeader( "Content-Type", XLS );
      }

      response.setHeader( "Cache-Control", "max-age=0, no-store" );
      response.setHeader( "content-disposition", "attachment; filename=" + "export" + export.getExtension() );

      export.exportFile( new JSONObject( response.getOutputStream() ) );
    }
  }

  @GET
  @Path( "/callAction" )
  public void callAction( @QueryParam( Parameter.SOLUTION ) String solution,
                          @QueryParam( Parameter.PATH ) String path,
                          @QueryParam( Parameter.ACTION ) String action,
                          @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
                          @Context HttpServletRequest servletRequest,
                          @Context HttpServletResponse servletResponse )
    throws Exception {

    String value = determineCorrectPath( solution, action, path );

    ActionEngine.getInstance().executeAction( value, contentType, servletRequest, servletResponse,
        PentahoSessionHolder.getSession(), Parameter.asHashMap( servletRequest ) );
  }

  @GET
  @Path( "/getJSONSolution" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public void getJSONSolution(
      @QueryParam( Parameter.SOLUTION ) String solution,
      @QueryParam( Parameter.PATH ) @DefaultValue( "/" ) String path,
      @QueryParam( Parameter.ACTION ) String action,
      @QueryParam( Parameter.DEPTH ) @DefaultValue( "-1" ) int depth,
      @QueryParam( Parameter.SHOW_HIDDEN_FILES ) @DefaultValue( "false" ) boolean showHiddenFiles,
      @QueryParam( Parameter.MODE ) @DefaultValue( "*" ) String mode,
      @Context HttpServletResponse servletResponse ) throws InvalidCdfOperationException {

    servletResponse.setContentType( APPLICATION_JSON );
    servletResponse.setCharacterEncoding( CharsetHelper.getEncoding() );

    try {
      writeJSONSolution(
          determineCorrectPath( solution, action, path ),
          depth,
          showHiddenFiles,
          mode,
          servletResponse
      );
    } catch ( Exception e ) {
      logger.error( "Error retrieving json solution", e );
      throw new InvalidCdfOperationException( e.getMessage() );
    }
  }

  @GET
  @Path( "/viewAction" )
  public void doGetViewAction( @QueryParam( Parameter.SOLUTION ) String solution,
                               @QueryParam( Parameter.PATH ) String path,
                               @QueryParam( Parameter.ACTION ) String action,
                               @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
                               @Context HttpServletRequest servletRequest,
                               @Context HttpServletResponse servletResponse ) throws Exception {

    doPostViewAction( solution, path, action, contentType, null, null, null, null, servletRequest, servletResponse );

  }

  @POST
  @Path( "/viewAction" )
  public void doPostViewAction(
      @QueryParam( Parameter.SOLUTION ) String solution,
      @QueryParam( Parameter.PATH ) String path,
      @QueryParam( Parameter.ACTION ) String action,
      @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
      @FormParam( Parameter.QUERY_TYPE ) String queryType,
      @FormParam( Parameter.QUERY ) String query,
      @FormParam( Parameter.CATALOG ) String catalog,
      @FormParam( Parameter.JNDI ) String jndi,
      @Context HttpServletRequest servletRequest,
      @Context HttpServletResponse servletResponse ) throws Exception {

    String value = determineCorrectPath( solution, action, path );

    HashMap<String, String> paramMap = new HashMap<String, String>();

    if ( !StringUtils.isEmpty( queryType ) && !paramMap.containsKey( Parameter.QUERY_TYPE ) ) {
      paramMap.put( Parameter.QUERY_TYPE, queryType );
    }

    if ( !StringUtils.isEmpty( query ) && !paramMap.containsKey( Parameter.QUERY ) ) {
      paramMap.put( Parameter.QUERY, query );
    }

    if ( !StringUtils.isEmpty( catalog ) && !paramMap.containsKey( Parameter.CATALOG ) ) {
      paramMap.put( Parameter.CATALOG, catalog );
    }

    if ( !StringUtils.isEmpty( jndi ) && !paramMap.containsKey( Parameter.JNDI ) ) {
      paramMap.put( Parameter.JNDI, jndi );
    }

    boolean success =
        ActionEngine.getInstance().executeAction( value, contentType, servletRequest, servletResponse,
        PentahoSessionHolder.getSession(), paramMap );

    if ( success ) {
      servletResponse.getOutputStream().flush();
    }
  }

  private String determineCorrectPath( String solution, String action, String path ) {

    if ( !StringUtils.isEmpty( solution ) || !StringUtils.isEmpty( action ) ) {
      // legacy call using solution, path, action request parameters
      return Util.joinPath( solution, path, action );

    } else if ( !StringUtils.isEmpty( path ) ) {
      // 5.0 call using path
      return path;
    }

    return StringUtils.EMPTY;
  }

  @GET
  @Path( "/cdf-embed.js" )
  @Produces( JAVASCRIPT )
  public void getCdfEmbeddedContext( @Context HttpServletRequest servletRequest,
                                     @Context HttpServletResponse servletResponse ) throws Exception {
    buildCdfEmbedContext(
        servletRequest.getProtocol(),
        servletRequest.getServerName(),
        servletRequest.getServerPort(),
        servletRequest.getSession().getMaxInactiveInterval(),
        servletRequest.getParameter( "locale" ),
        servletRequest,
        servletResponse );
  }

  // CDE will call buildCdfEmbedContext via InterPluginCall
  public void buildCdfEmbedContext( @QueryParam( "protocol" ) String protocol,
                                    @QueryParam( "name" ) String name,
                                    @QueryParam( "port" ) int port,
                                    @QueryParam( "inactiveInterval" ) int inactiveInterval,
                                    @QueryParam( "locale" ) String locale,
                                    @Context HttpServletRequest servletRequest,
                                    @Context HttpServletResponse servletResponse ) throws Exception {
    try {
      EmbeddedHeadersGenerator embeddedHeadersGenerator =
          new EmbeddedHeadersGenerator(
            buildFullServerUrl( protocol, name, port, servletRequest.isSecure() ),
            getConfiguration( "",  Parameter.asHashMap( servletRequest ), inactiveInterval ) );
      if ( !StringUtils.isEmpty( locale ) ) {
        embeddedHeadersGenerator.setLocale( new Locale( locale ) );
      }
      PluginIOUtils.writeOutAndFlush( servletResponse.getOutputStream(), embeddedHeadersGenerator.generate() );
    } catch ( IOException ex ) {
      logger.error( "getCdfEmbeddedContext: " + ex.getMessage(), ex );
      throw ex;
    }
  }

  protected String getConfiguration( String path,
                                     HashMap<String, String> parameterMap,
                                     int inactiveInterval ) throws JSONException {
    return ContextEngine.getInstance().getConfig( path, parameterMap, inactiveInterval );
  }

  protected String buildFullServerUrl( String protocol, String serverName, int serverPort, boolean secure ) {
    String p = HTTP;
    if ( !StringUtils.isEmpty( protocol ) ) {
      p = protocol.split( "/" )[ 0 ].toLowerCase();
    }
    if ( HTTP.equalsIgnoreCase( p ) && secure ) {
      p = HTTPS;
    }
    return p + "://" + serverName + ":" + serverPort + PentahoRequestContextHolder.getRequestContext().getContextPath();
  }

  protected void writeJSONSolution(
      String path,
      int depth,
      boolean showHiddenFiles,
      String mode,
      HttpServletResponse servletResponse ) throws Exception {

    PluginIOUtils.writeOutAndFlush(
        servletResponse.getOutputStream(),
        NavigateComponent.getJSONSolution(
          path,
          depth,
          showHiddenFiles,
          mode ).toString( 2 )
    );
  }
}
