/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

package org.pentaho.cdf.render;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.environment.packager.ICdfHeadersProvider;
import org.pentaho.cdf.environment.templater.ITemplater;
import org.pentaho.cdf.environment.templater.ITemplater.Section;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.util.Parameter;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.localization.MessageBundlesHelper;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IRWAccess;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.util.RepositoryHelper;
import pt.webdetails.cpf.utils.CharsetHelper;

public class CdfHtmlRenderer {

  private static Log logger = LogFactory.getLog( CdfHtmlRenderer.class );

  public void execute( final OutputStream out, final String solution, final String path, String templateName,
                       String style, String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap,
                       String user, int inactiveInterval ) throws Exception {

    execute( out, solution, path, templateName, style, dashboardsMessagesBaseFilename, parameterMap, user,
        inactiveInterval, false, false );
  }

  public void execute( final OutputStream out, final String solution, final String path, String templateName,
                       String style, String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap,
                       String user, int inactiveInterval, boolean isRequire, boolean loadTheme ) throws Exception {

    IBasicFile dashboardTemplateFile = HtmlDashboardRenderer.getDashboardTemplate( solution, path, templateName );

    execute( out, dashboardTemplateFile, style, dashboardsMessagesBaseFilename, parameterMap, user, inactiveInterval,
        isRequire, loadTheme );
  }

  public void execute( final OutputStream out, final String templatePath, String style,
                       String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap, String user,
                       int inactiveInterval ) throws Exception {

    execute( out, style, templatePath, dashboardsMessagesBaseFilename, parameterMap, user, inactiveInterval, false,
        false );
  }

  public void execute( final OutputStream out, final String templatePath, String style,
                       String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap, String user,
                       int inactiveInterval, boolean isRequire, boolean loadTheme ) throws Exception {

    IBasicFile dashboardTemplateFile = HtmlDashboardRenderer.getDashboardTemplate( templatePath );

    execute( out, dashboardTemplateFile, style, dashboardsMessagesBaseFilename, parameterMap, user, inactiveInterval,
        isRequire, loadTheme );
  }

  public void execute( OutputStream out, IBasicFile dashboardTemplateFile, String style,
                       String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap, String user,
                       int inactiveInterval, boolean isRequire, boolean loadTheme ) throws Exception {

    String intro = ""; //$NON-NLS-1$
    String footer = ""; //$NON-NLS-1$

    IReadAccess systemAccess = getPluginSystemReader( null );
    style = StringUtils.isEmpty( style ) ? "" : "-" + style;

    final String dashboardTemplate = "template-dashboard" + style + ".html"; //$NON-NLS-1$

    ArrayList<String> i18nTagsList = new ArrayList<String>();
    final String requireDashboardTemplate = "template-dashboard" + style + "-require.html";
    IBasicFile templateResourceFile = null;
    IReadAccess pluginRepoAccess = getPluginRepositoryReader( "templates/" );

    if ( isRequire && pluginRepoAccess.fileExists( requireDashboardTemplate ) ) {
      templateResourceFile = pluginRepoAccess.fetchFile( requireDashboardTemplate );
    } else if ( isRequire && systemAccess.fileExists( requireDashboardTemplate ) ) {
      templateResourceFile = systemAccess.fetchFile( requireDashboardTemplate );
    } else if ( pluginRepoAccess.fileExists( dashboardTemplate ) ) {
      templateResourceFile = pluginRepoAccess.fetchFile( dashboardTemplate );
    } else if ( systemAccess.fileExists( dashboardTemplate ) ) {
      // then try in system
      templateResourceFile = systemAccess.fetchFile( dashboardTemplate );
    }

    String templateContent;
    if ( templateResourceFile != null ) { //if a file was obtained correctly
      templateContent = getContentString( templateResourceFile.getContents() );
    } else { //if not get a default one
      logger.error( "Template " + dashboardTemplate + " not available on cdf/templates, loading fallback instead" );
      templateContent = getContentString( systemAccess.fetchFile( "template-dashboard.html" ).getContents() );
    }

    if ( !isRequire ) {
      // Process i18n on dashboard outer template
      templateContent = updateUserLanguageKey( templateContent );
      templateContent = processi18nTags( templateContent, i18nTagsList );
      // Process i18n on dashboard outer template - end
    }

    ITemplater templater = getTemplater();

    intro = templater.getTemplateSection( templateContent, Section.HEADER );
    footer = templater.getTemplateSection( templateContent, Section.FOOTER );

    final String dashboardContent = getDashboardContent( dashboardTemplateFile.getContents(), i18nTagsList );

    // Merge dashboard related message file with global message file and save it in the dashboard cache
    String path = StringUtils.defaultIfEmpty( FilenameUtils.getPathNoEndSeparator( dashboardTemplateFile.getPath() ),
        getPluginRepositoryDir() );
    path = !path.startsWith( String.valueOf( RepositoryHelper.SEPARATOR ) ) ? RepositoryHelper.SEPARATOR + path : path;

    if ( !isRequire ) {
      intro = getMessageBundlesHelper( path ).replaceParameters( intro, i18nTagsList );
    }

    /*
     * Add cdf libraries
     */
    // final Date startDate = new Date();
    final int headIndex = intro.indexOf( "<head>" );
    final int length = intro.length();
    // final Hashtable addedFiles = new Hashtable();

    out.write( intro.substring( 0, headIndex + 6 ).getBytes( CharsetHelper.getEncoding() ) );
    if ( !isRequire ) { // Concat libraries to html head content
      getHeadersInternal( dashboardContent, parameterMap, out );
    } else { // add the webcontext dependency checking if webcontext should load pentaho active theme
      getWebContextHeader( out, loadTheme );
    }
    out.write( intro.substring( headIndex + 6, length ).getBytes( CharsetHelper.getEncoding() ) );

    if ( !isRequire ) {
      // Add context
      try {
        generateContext( out, parameterMap, inactiveInterval );
      } catch ( Exception e ) {
        logger.error( "Error generating cdf context.", e );
      }
      // Add storage
      try {
        generateStorage( out, user );
      } catch ( Exception e ) {
        logger.error( "Error in cdf storage.", e );
      }
    } else {
      out.write( MessageFormat.format( CdfConstants.INLINE_SCRIPT, "requireCfg.config = requireCfg.config || {};\n"
          + "requireCfg.config['cdf/dashboard/Dashboard'] = "
          + getConfiguration( path, parameterMap, inactiveInterval ) + ";\n"
          + "requirejs.config(requireCfg);" ).getBytes( CharsetHelper.getEncoding() ) );
    }

    out.write( "<div id=\"dashboardContent\">".getBytes( CharsetHelper.getEncoding() ) );

    out.write( dashboardContent.getBytes( CharsetHelper.getEncoding() ) );
    out.write( "</div>".getBytes( CharsetHelper.getEncoding() ) );
    out.write( footer.getBytes( CharsetHelper.getEncoding() ) );
  }

  protected String getConfiguration( String path, HashMap<String, String> parameterMap,
                                     int inactiveInterval ) throws JSONException {
    return ContextEngine.getInstance().getConfig( path, parameterMap, inactiveInterval );
  }

  protected void getWebContextHeader( OutputStream out, boolean loadTheme ) throws Exception {
    String webcontext = "<script language=\"javascript\" type=\"text/javascript\" src=\"webcontext"
        + ".js?context=cdf&application=pentaho/cdf" + ( loadTheme ? "" : "&amp;requireJsOnly=true" ) + "\"></script>";
    out.write( webcontext.getBytes( CharsetHelper.getEncoding() ) );
  }

  public boolean matchComponent( int keyIndex, final String key, final String content ) {

    for ( int i = keyIndex - 1; i > 0; i-- ) {
      if ( content.charAt( i ) == ':' || content.charAt( i ) == '"' || ( "" + content.charAt( i ) ).trim()
          .equals( "" ) ) {
        // noinspection UnnecessaryContinue
        continue;
      } else {
        if ( ( i - 3 ) > 0 && content.substring( ( i - 3 ), i + 1 ).equals( "type" ) ) {
          return true;
        }

        break;
      }
    }

    keyIndex = content.indexOf( key, keyIndex + key.length() );
    if ( keyIndex != -1 ) {
      return matchComponent( keyIndex, key, content );
    }

    return false;
  }

  protected String getDashboardContent( InputStream is, ArrayList<String> i18nTagsList ) throws Exception {
    // Fixed ISSUE #CDF-113
    // BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    BufferedReader reader = new BufferedReader(
        new InputStreamReader( is, Charset.forName( CdfEngine.getEnvironment().getSystemEncoding() ) ) );

    StringBuilder sb = new StringBuilder();
    String line = null;
    while ( ( line = reader.readLine() ) != null ) {
      // Process i18n for each line of the dashboard output
      line = processi18nTags( line, i18nTagsList );
      // Process i18n - end
      sb.append( line + "\n" ); //$NON-NLS-1$
    }
    is.close();
    return sb.toString();
  }

  protected String processi18nTags( String content, ArrayList<String> tagsList ) {

    String tagPattern = "CDF.i18n\\(\""; //$NON-NLS-1$
    String[] test = content.split( tagPattern );
    if ( test.length == 1 ) {
      return content;
    }
    StringBuffer resBuffer = new StringBuffer();
    int i;
    String tagValue;
    resBuffer.append( test[ 0 ] );
    for ( i = 1; i < test.length; i++ ) {

      // First tag is processed differently that other because is the only case where I don't
      // have key in first position
      resBuffer.append( "<span id=\"" ); //$NON-NLS-1$
      if ( i != 0 ) {
        // Right part of the string with the value of the tag herein
        tagValue = test[ i ].substring( 0, test[ i ].indexOf( "\")" ) ); //$NON-NLS-1$
        tagsList.add( tagValue );
        resBuffer.append( updateSelectorName( tagValue ) );
        resBuffer.append( "\"></span>" ); //$NON-NLS-1$
        resBuffer.append( test[ i ].substring( test[ i ].indexOf( "\")" ) + 2, test[ i ].length() ) ); //$NON-NLS-1$
      }
    }
    return resBuffer.toString();
  }

  private String updateSelectorName( String name ) {
    // If we've the character . in the message key substitute it conventionally to _
    // when dynamically generating the selector name. The "." character is not permitted in the
    // selector id name
    return name.replace( ".", "_" );
  }

  private String buildMessageSetCode( ArrayList<String> tagsList ) {
    StringBuffer messageCodeSet = new StringBuffer();
    for ( String tag : tagsList ) {
      messageCodeSet
        .append( "\\$('#" ).append( updateSelectorName( tag ) ).append( "').html(jQuery.i18n.prop('" ).append( tag )
        .append( "'));\n" ); //$NON-NLS-1$
    }
    return messageCodeSet.toString();
  }

  protected String updateUserLanguageKey( String intro ) {
    // Fill the template with the correct user locale
    intro =
      intro.replaceAll( "#\\{LANGUAGE_CODE\\}", CdfEngine.getEnvironment().getLocale().getLanguage() ); //$NON-NLS-1$
    return intro;
  }

  public static void getHeaders( HashMap<String, String> paramMap, OutputStream out ) throws Exception {
    String dashboardContent = StringUtils.defaultString( paramMap.get( Parameter.DASHBOARD_CONTENT ) );
    getHeaders( dashboardContent, paramMap, out );
  }

  protected void getHeadersInternal( String dashboardContent, HashMap<String, String> paramMap, OutputStream out )
    throws Exception {
    getHeaders( dashboardContent, paramMap, out );
  }

  public static void getHeaders( String dashboardContent, HashMap<String, String> paramMap, OutputStream out )
    throws Exception {

    final String dashboardType = StringUtils.defaultIfEmpty( paramMap.get( Parameter.DASHBOARD_TYPE ), "blueprint" );
    final boolean isDebugMode = Boolean.TRUE.toString().equalsIgnoreCase( paramMap.get( Parameter.DEBUG ) );
    String root = StringUtils.defaultString( paramMap.get( Parameter.ROOT ) );
    String scheme = StringUtils.defaultIfEmpty( paramMap.get( Parameter.SCHEME ), "http" );
    boolean absolute = StringUtils.defaultIfEmpty( paramMap.get( Parameter.ABSOLUTE ), "false" ).equals( "true" );

    getHeaders( dashboardContent, dashboardType, absolute, root, scheme, isDebugMode, out );
  }

  public static void getHeaders( String dashboardContent, String dashboardType, boolean absolute, String root,
                                 String scheme, boolean isDebugMode, OutputStream out ) throws Exception {

    ICdfHeadersProvider cdfHeaders = CdfEngine.getEnvironment().getCdfHeadersProvider();
    // Identify which extra JSs and CSSs to add to header, according to components being used
    List<String> componentTypes = new ArrayList<String>( CdfConstants.DASHBOARD_COMPONENT_TYPES.length );
    if ( dashboardContent != null ) {
      componentTypes = new ArrayList<String>();
      // search for component types in dashboardsContent (e.g. template.html)
      for ( String[] componenType : CdfConstants.DASHBOARD_COMPONENT_TYPES ) {
        // Screen Scrap to get component types from dashboardContent
        if ( Pattern.compile( String.format( "type:\\s*[\"'](?i)%s[a-z]*[\"']", componenType[ 0 ] ) )
            .matcher( dashboardContent ).find() ) {
          componentTypes.add( componenType[ 1 ] );
        }
      }
    }
    if ( absolute ) {
      String webRoot;

      // some dashboards need full absolute urls
      if ( !StringUtils.isEmpty( root ) ) {
        if ( root.contains( "/" ) ) {
          // file paths are already absolute, which didn't happen before
          root = root.substring( 0, root.indexOf( "/" ) );
        }
        webRoot = scheme + "://" + root;
      } else {
        webRoot = CdfEngine.getEnvironment().getPathProvider().getWebappContextRoot();
      }

      out.write( cdfHeaders.getHeaders( dashboardType, isDebugMode, webRoot, componentTypes )
          .getBytes( CharsetHelper.getEncoding() ) );
    } else {
      out.write(
          cdfHeaders.getHeaders( dashboardType, isDebugMode, componentTypes ).getBytes( CharsetHelper.getEncoding() ) );
    }
  }

  protected void generateStorage( final OutputStream out, final String user ) throws Exception {

    JSONObject result = StorageEngine.getInstance().read( user );

    StringBuilder s = new StringBuilder();
    s.append( "\n<script language=\"javascript\" type=\"text/javascript\">\n" );
    s.append( "  Dashboards.storage = " );
    s.append( result.toString( 2 ) ).append( "\n" );
    s.append( "</script>\n" );
    // setResponseHeaders(MIME_PLAIN,0,null);
    out.write( s.toString().getBytes( CharsetHelper.getEncoding() ) );
  }

  protected void generateContext( final OutputStream out, HashMap parameterMap, int inactiveInterval )
    throws Exception {
    ContextEngine.getInstance().generateContext( out, parameterMap, inactiveInterval );
  }

  protected IReadAccess getPluginSystemReader( String path ) {
    return CdfEngine.getPluginSystemReader( path );
  }

  protected IReadAccess getPluginRepositoryReader( String path ) {
    return CdfEngine.getPluginRepositoryReader( path );
  }

  protected String getPluginRepositoryDir() {
    return CdfEngine.getEnvironment().getCdfPluginRepositoryDir();
  }

  protected Locale getLocale() {
    return CdfEngine.getEnvironment().getLocale();
  }

  protected MessageBundlesHelper getMessageBundlesHelper( String path ) throws IOException {
    IContentAccessFactory factory = CdfEngine.getEnvironment().getContentAccessFactory();
    String cdfStaticBaseUrl = CdfEngine.getEnvironment().getPathProvider().getPluginStaticBaseUrl();
    IRWAccess cdfSystemWriter = factory.getPluginSystemWriter( null );

    return new MessageBundlesHelper( path,
      Util.getAppropriateReadAccess( path, factory, CdfEngine.getEnvironment().getPluginId(),
        CdfEngine.getEnvironment().getSystemDir(), getPluginRepositoryDir() ),
      cdfSystemWriter, CdfEngine.getEnvironment().getLocale(),
      cdfStaticBaseUrl );
  }

  protected String getContentString( InputStream inputStream ) throws IOException {
    return Util.toString( inputStream );
  }

  protected ITemplater getTemplater() {
    return CdfEngine.getEnvironment().getTemplater();
  }
}
