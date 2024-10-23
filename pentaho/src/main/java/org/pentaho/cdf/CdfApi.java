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


package org.pentaho.cdf;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.owasp.encoder.Encode;
import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.embed.EmbeddedHeadersCallbackGenerator;
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

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static jakarta.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON_TYPE;
import static jakarta.ws.rs.core.MediaType.APPLICATION_XML;
import static jakarta.ws.rs.core.MediaType.TEXT_HTML;
import static jakarta.ws.rs.core.MediaType.TEXT_PLAIN;
import static pt.webdetails.cpf.utils.MimeTypes.CSV;
import static pt.webdetails.cpf.utils.MimeTypes.JAVASCRIPT;
import static pt.webdetails.cpf.utils.MimeTypes.XLS;

@Path( "/pentaho-cdf/api" )
public class CdfApi {

  private static final Log logger = LogFactory.getLog( CdfApi.class );
  private static final String HTTP = "http";
  private static final String HTTPS = "https";
  private static final int DEFAULT_HTTP_PORT = 80;
  private static final int DEFAULT_HTTPS_PORT = 443;

  @GET
  @Path( "/ping" )
  @Produces( TEXT_PLAIN )
  public Response doGetPing() {
    return Response.ok( "{\"ping\":\"ok\"}" ).build();
  }

  @POST
  @Path( "/ping" )
  @Produces( TEXT_PLAIN )
  public Response doPostPing() {
    return Response.ok( "{\"ping\":\"ok\"}" ).build();
  }

  @GET
  @Path( "/getResource" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public Response getResource( @QueryParam( Parameter.RESOURCE ) String resource,
                           @QueryParam( Parameter.PATH ) String path ) {
    try {

      if ( !StringUtils.isEmpty( resource ) && StringUtils.isEmpty( path ) ) {
        // legacy calls used resource param; 5.0 calls use path param
        path = resource;
      }
      if ( StringUtils.isEmpty( path ) ) {
        logger.warn( "invalid call: empty path and resource parameters" );
        return Response.status( Response.Status.BAD_REQUEST ).build();
      }

      path = path.endsWith( "/content" ) ? path.substring( 0, path.indexOf( "/content" ) ) : path;

      String contentType = MimeHelper.getMimeTypeFromFileName( path );

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
        return Response.status( Response.Status.NOT_FOUND ).build();
      }

      final String filePath = path;
      StreamingOutput stream = new StreamingOutput() {
        @Override
        public void write( OutputStream outputStream ) throws IOException {
          PluginIOUtils.writeOutAndFlush( outputStream, systemAccess.getFileInputStream( filePath ) );
        }
      };

      return Response.ok( stream, contentType ).build();
    } catch ( Exception e ) {
      logger.error( e );
      return Response.status( Response.Status.FORBIDDEN ).build();
    }
  }

  @POST
  @Path( "/getResource" )
  public Response postResource( @QueryParam( Parameter.RESOURCE ) String resource,
                            @QueryParam( Parameter.PATH ) String path ) {
    return getResource( resource, path );
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
  public Response clearCache( ) {
    ContextEngine.clearCache();
    return Response.ok( "Cache Cleared" ).build();
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
      @Context HttpServletResponse response ) throws IOException {

    export( solution, path, action, contentType, exportType, request, response );
  }
  @GET
  @Path( "/export" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED } )
  public Response export(
      @QueryParam( Parameter.SOLUTION ) String solution,
      @QueryParam( Parameter.PATH ) String path,
      @QueryParam( Parameter.ACTION ) String action,
      @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
      @QueryParam( Parameter.EXPORT_TYPE ) @DefaultValue( IExport.DEFAULT_EXPORT_TYPE ) String exportType,
      @Context HttpServletRequest request,
      @Context HttpServletResponse response ) throws IOException {

    // set default response status
    response.setStatus( HttpServletResponse.SC_OK );

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

    return Response.status( response.getStatus() ).build();
  }

  @GET
  @Path( "/callAction" )
  public Response callAction( @QueryParam( Parameter.SOLUTION ) String solution,
                          @QueryParam( Parameter.PATH ) String path,
                          @QueryParam( Parameter.ACTION ) String action,
                          @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
                          @Context HttpServletRequest servletRequest,
                          @Context HttpServletResponse servletResponse )
    throws IOException {

    // set default response status
    servletResponse.setStatus( HttpServletResponse.SC_OK );

    String value = determineCorrectPath( solution, action, path );

    ActionEngine.getInstance().executeAction( value, contentType, servletRequest, servletResponse,
        PentahoSessionHolder.getSession(), Parameter.asHashMap( servletRequest ) );

    return Response.status( servletResponse.getStatus() ).build();
  }

  @GET
  @Path( "/getJSONSolution" )
  @Consumes( { APPLICATION_XML, APPLICATION_JSON } )
  @Produces( APPLICATION_JSON )
  public Response getJSONSolution(
      @QueryParam( Parameter.SOLUTION ) String solution,
      @QueryParam( Parameter.PATH ) @DefaultValue( "/" ) String path,
      @QueryParam( Parameter.ACTION ) String action,
      @QueryParam( Parameter.DEPTH ) @DefaultValue( "-1" ) int depth,
      @QueryParam( Parameter.SHOW_HIDDEN_FILES ) @DefaultValue( "false" ) boolean showHiddenFiles,
      @QueryParam( Parameter.MODE ) @DefaultValue( "*" ) String mode )
    throws InvalidCdfOperationException {

    try {
      String jsonSolution = writeJSONSolution(
        determineCorrectPath( solution, action, path ),
        depth,
        showHiddenFiles,
        mode );

      Map<String, String> mtParameters = new HashMap<>();
      mtParameters.put( "charset", CharsetHelper.getEncoding() );

      MediaType contentType = new MediaType( APPLICATION_JSON_TYPE.getType(), APPLICATION_JSON_TYPE.getSubtype(), mtParameters );

      return Response.ok( jsonSolution, contentType ).build();
    } catch ( JSONException e ) {
      logger.error( "Error retrieving json solution", e );
      throw new InvalidCdfOperationException( e.getMessage() );
    }
  }

  @GET
  @Path( "/viewAction" )
  public Response doGetViewAction( @QueryParam( Parameter.SOLUTION ) String solution,
                               @QueryParam( Parameter.PATH ) String path,
                               @QueryParam( Parameter.ACTION ) String action,
                               @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
                               @Context HttpServletRequest servletRequest,
                               @Context HttpServletResponse servletResponse ) throws IOException {

    return doPostViewAction( solution, path, action, contentType, null, null, null, null, servletRequest, servletResponse );
  }

  @POST
  @Path( "/viewAction" )
  public Response doPostViewAction(
      @QueryParam( Parameter.SOLUTION ) String solution,
      @QueryParam( Parameter.PATH ) String path,
      @QueryParam( Parameter.ACTION ) String action,
      @QueryParam( Parameter.CONTENT_TYPE ) @DefaultValue( TEXT_HTML ) String contentType,
      @FormParam( Parameter.QUERY_TYPE ) String queryType,
      @FormParam( Parameter.QUERY ) String query,
      @FormParam( Parameter.CATALOG ) String catalog,
      @FormParam( Parameter.JNDI ) String jndi,
      @Context HttpServletRequest servletRequest,
      @Context HttpServletResponse servletResponse ) throws IOException {

    // set default response status
    servletResponse.setStatus( HttpServletResponse.SC_OK );

    String value = determineCorrectPath( solution, action, path );

    HashMap<String, String> paramMap = new HashMap<>();

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

    return Response.status( servletResponse.getStatus() ).build();
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
  public Response getCdfEmbeddedContext( @Context HttpServletRequest servletRequest,
                                     @Context HttpServletResponse servletResponse ) throws Exception {
    return buildCdfEmbedContext(
        servletRequest.getProtocol(),
        servletRequest.getServerName(),
        servletRequest.getServerPort(),
        servletRequest.getSession().getMaxInactiveInterval(),
        servletRequest.getParameter( "locale" ),
        servletRequest );
  }

  // CDE will call buildCdfEmbedContext via InterPluginCall
  public Response buildCdfEmbedContext( @QueryParam( "protocol" ) String protocol,
                                    @QueryParam( "name" ) String name,
                                    @QueryParam( "port" ) int port,
                                    @QueryParam( "inactiveInterval" ) int inactiveInterval,
                                    @QueryParam( "locale" ) String locale,
                                    @Context HttpServletRequest servletRequest ) throws Exception {
    return buildCdfEmbedContextSecure( protocol, name, port, inactiveInterval, locale, servletRequest.isSecure(), servletRequest );
  }

  // CDE will call buildCdfEmbedContext via InterPluginCall
  public Response buildCdfEmbedContextSecure( @QueryParam( "protocol" ) String protocol,
                                    @QueryParam( "name" ) String name,
                                    @QueryParam( "port" ) int port,
                                    @QueryParam( "inactiveInterval" ) int inactiveInterval,
                                    @QueryParam( "locale" ) String locale,
                                    @QueryParam( "secure" ) boolean secure,
                                    @Context HttpServletRequest servletRequest ) throws Exception {
    EmbeddedHeadersGenerator embeddedHeadersGenerator =
        new EmbeddedHeadersGenerator(
          buildFullServerUrl( protocol, name, port, secure ),
          getConfiguration( "",  Parameter.asHashMap( servletRequest ), inactiveInterval ) );
    if ( !StringUtils.isEmpty( locale ) ) {
      embeddedHeadersGenerator.setLocale( new Locale( locale ) );
    }

    try {
      return Response.ok( embeddedHeadersGenerator.generate(), JAVASCRIPT ).build();
    } catch ( IOException ex ) {
      logger.error( "getCdfEmbeddedContext: " + ex.getMessage(), ex );
      throw ex;
    }
  }

  @GET
  @Path( "/cdf-embed-callback.js" )
  @Produces( JAVASCRIPT )
  public Response getCdfEmbeddedCallbackContext( @Context HttpServletRequest servletRequest ) throws Exception {
    return buildCdfEmbedCallbackContextSecure(
      servletRequest.getProtocol(),
      servletRequest.getServerName(),
      servletRequest.getServerPort(),
      servletRequest.getSession().getMaxInactiveInterval(),
      servletRequest.getParameter( "locale" ),
      servletRequest.isSecure(),
      servletRequest.getParameter( "callbackFunctionName" ),
      servletRequest );
  }

  // CDE will call buildCdfEmbedContext via InterPluginCall
  public Response buildCdfEmbedCallbackContextSecure( @QueryParam( "protocol" ) String protocol,
                                                  @QueryParam( "name" ) String name,
                                                  @QueryParam( "port" ) int port,
                                                  @QueryParam( "inactiveInterval" ) int inactiveInterval,
                                                  @QueryParam( "locale" ) String locale,
                                                  @QueryParam( "secure" ) boolean secure,
                                                  @QueryParam( "callbackFunctionName" ) String callbackFunctionName,
                                                  @Context HttpServletRequest servletRequest ) throws Exception {
    EmbeddedHeadersCallbackGenerator embeddedHeadersCallbackGenerator = new EmbeddedHeadersCallbackGenerator(
      buildFullServerUrl( protocol, name, port, secure ),
      getConfiguration( "",  Parameter.asHashMap( servletRequest ), inactiveInterval ) );
    if ( !StringUtils.isEmpty( locale ) ) {
      embeddedHeadersCallbackGenerator.setLocale( new Locale( locale ) );
    }
    if ( !StringUtils.isEmpty( callbackFunctionName ) ) {
      embeddedHeadersCallbackGenerator.setCallbackFunctionName( callbackFunctionName );
    }

    try {
      return Response.ok( embeddedHeadersCallbackGenerator.generate(), JAVASCRIPT ).build();
    } catch ( IOException ex ) {
      logger.error( "buildCdfEmbedCallbackContextSecure: " + ex.getMessage(), ex );
      throw ex;
    }
  }

  protected String getConfiguration( String path,
                                     HashMap<String, String> parameterMap,
                                     int inactiveInterval ) throws JSONException {
    return ContextEngine.getInstance().getConfig( path, parameterMap, inactiveInterval );
  }

  /**
   * Builds a full URL based in the given parameters
   * @param protocol The protocol version, which can be HTTP/0.9, HTTP/1.0, HTTP/1.1 or HTTP/2.0
   * @param serverName The hostname specified by the Host http header
   * @param serverPort The server port to which the connection was established
   * @param secure Indicates if the HTTPS scheme was used
   * @return
   */
  protected String buildFullServerUrl( String protocol, String serverName, int serverPort, boolean secure ) {
    // the http protocol is completely unnecessary here since it has no relation to the scheme used and not used in the construction of the url
    // the http protocol specifies the protocol version while the scheme specifies if http, https, ftp or another scheme was used
    // it is up to the http client (web browser or other) to tell the server which version of the protocol is going to be used
    String scheme = secure ? HTTPS : HTTP;
    String port =
      ( !secure && serverPort == DEFAULT_HTTP_PORT ) || ( secure && serverPort == DEFAULT_HTTPS_PORT ) ? "" : ":" + serverPort;

    return scheme + "://" + Encode.forJavaScriptBlock( Encode.forHtmlUnquotedAttribute( serverName ) )
      + port + PentahoRequestContextHolder.getRequestContext().getContextPath();
  }

  protected String writeJSONSolution(
      String path,
      int depth,
      boolean showHiddenFiles,
      String mode ) throws JSONException {

    return NavigateComponent.getJSONSolution(
        path,
        depth,
        showHiddenFiles,
        mode ).toString( 2 );
  }
}
