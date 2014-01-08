package org.pentaho.cdf.render;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONObject;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.environment.packager.ICdfHeadersProvider;
import org.pentaho.cdf.environment.templater.ITemplater;
import org.pentaho.cdf.environment.templater.ITemplater.Section;
import org.pentaho.cdf.localization.MessageBundlesHelper;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.util.Parameter;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.utils.CharsetHelper;

public class CdfHtmlRenderer {

  private static Log logger = LogFactory.getLog( CdfHtmlRenderer.class );

  public void execute( final OutputStream out, final String solution, final String path, String templateName,
      String style, String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap, String user )
    throws Exception {

    IBasicFile dashboardTemplateFile = HtmlDashboardRenderer.getDashboardTemplate( solution, path, templateName );

    execute( out, dashboardTemplateFile, style, dashboardsMessagesBaseFilename, parameterMap, user );
  }

  public void execute( final OutputStream out, final String templatePath, String style,
      String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap, String user ) throws Exception {

    IBasicFile dashboardTemplateFile = HtmlDashboardRenderer.getDashboardTemplate( templatePath );

    execute( out, dashboardTemplateFile, style, dashboardsMessagesBaseFilename, parameterMap, user );
  }

  public void execute( OutputStream out, IBasicFile dashboardTemplateFile, String style,
      String dashboardsMessagesBaseFilename, HashMap<String, String> parameterMap, String user ) throws Exception {

    String intro = ""; //$NON-NLS-1$
    String footer = ""; //$NON-NLS-1$

    IReadAccess systemAccess = CdfEngine.getPluginSystemReader( null );
    style = StringUtils.isEmpty( style ) ? "" : "-" + style;

    final String dashboardTemplate = "template-dashboard" + style + ".html"; //$NON-NLS-1$

    ArrayList<String> i18nTagsList = new ArrayList<String>();

    IBasicFile templateResourceFile = null;
    IReadAccess pluginRepoAccess = CdfEngine.getPluginRepositoryReader( "templates/" );

    if ( pluginRepoAccess.fileExists( dashboardTemplate ) ) {
      templateResourceFile = pluginRepoAccess.fetchFile( dashboardTemplate );

    } else if ( systemAccess.fileExists( dashboardTemplate ) ) {
      // then try in system
      templateResourceFile = systemAccess.fetchFile( dashboardTemplate );
    }

    String templateContent = Util.toString( templateResourceFile.getContents() );
    // Process i18n on dashboard outer template
    templateContent = updateUserLanguageKey( templateContent );
    templateContent = processi18nTags( templateContent, i18nTagsList );
    // Process i18n on dashboard outer template - end

    ITemplater templater = CdfEngine.getEnvironment().getTemplater();

    intro = templater.getTemplateSection( templateContent, Section.HEADER );
    footer = templater.getTemplateSection( templateContent, Section.FOOTER );

    final String dashboardContent = getDashboardContent( dashboardTemplateFile.getContents(), i18nTagsList );

    // Merge dashboard related message file with global message file and save it in the dashboard cache
    MessageBundlesHelper mbh =
        new MessageBundlesHelper( dashboardTemplateFile.getPath(), dashboardsMessagesBaseFilename );

    intro = replaceIntroParameters( intro, mbh, i18nTagsList, dashboardsMessagesBaseFilename );

    /*
     * Add cdf libraries
     */
    // final Date startDate = new Date();
    final int headIndex = intro.indexOf( "<head>" );
    final int length = intro.length();
    // final Hashtable addedFiles = new Hashtable();

    out.write( intro.substring( 0, headIndex + 6 ).getBytes( CharsetHelper.getEncoding() ) );
    // Concat libraries to html head content
    getHeaders( dashboardContent, parameterMap, out );
    out.write( intro.substring( headIndex + 6, length ).getBytes( CharsetHelper.getEncoding() ) );
    // Add context
    try {
      ContextEngine.generateContext( out, parameterMap );
    } catch ( Exception e ) {
      logger.error( "Error generating cdf context.", e );
    }
    // Add storage
    try {
      generateStorage( out, user );
    } catch ( Exception e ) {
      logger.error( "Error in cdf storage.", e );
    }

    out.write( "<div id=\"dashboardContent\">".getBytes( CharsetHelper.getEncoding() ) );

    out.write( dashboardContent.getBytes( CharsetHelper.getEncoding() ) );
    out.write( "</div>".getBytes( CharsetHelper.getEncoding() ) );
    out.write( footer.getBytes( CharsetHelper.getEncoding() ) );
  }

  public boolean matchComponent( int keyIndex, final String key, final String content ) {

    for ( int i = keyIndex - 1; i > 0; i-- ) {
      if ( content.charAt( i ) == ':' || content.charAt( i ) == '"' || ( "" + content.charAt( i ) ).trim().equals( "" ) ) {
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

  private String getDashboardContent( InputStream is, ArrayList<String> i18nTagsList ) throws Exception {
    // Fixed ISSUE #CDF-113
    // BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    BufferedReader reader =
        new BufferedReader(
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

  private String processi18nTags( String content, ArrayList<String> tagsList ) {

    String tagPattern = "CDF.i18n\\(\""; //$NON-NLS-1$
    String[] test = content.split( tagPattern );
    if ( test.length == 1 ) {
      return content;
    }
    StringBuffer resBuffer = new StringBuffer();
    int i;
    String tagValue;
    resBuffer.append( test[0] );
    for ( i = 1; i < test.length; i++ ) {

      // First tag is processed differently that other because is the only case where I don't
      // have key in first position
      resBuffer.append( "<span id=\"" ); //$NON-NLS-1$
      if ( i != 0 ) {
        // Right part of the string with the value of the tag herein
        tagValue = test[i].substring( 0, test[i].indexOf( "\")" ) ); //$NON-NLS-1$
        tagsList.add( tagValue );
        resBuffer.append( updateSelectorName( tagValue ) );
        resBuffer.append( "\"></span>" ); //$NON-NLS-1$
        resBuffer.append( test[i].substring( test[i].indexOf( "\")" ) + 2, test[i].length() ) ); //$NON-NLS-1$
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

  private String replaceIntroParameters( String intro, MessageBundlesHelper mbh, ArrayList<String> i18nTagsList,
      String dashboardsMessagesBaseFilename ) throws Exception {
    mbh.saveI18NMessageFilesToCache();
    String messageSetPath = mbh.getMessageFilesCacheUrl() + "/"; //$NON-NLS-1$

    // If dashboard specific files aren't specified set message filename in cache to the global messages file filename
    if ( dashboardsMessagesBaseFilename == null )
      dashboardsMessagesBaseFilename = CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME;

    intro = intro.replaceAll( "\\{load\\}", "onload=\"load()\"" ); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    intro = intro.replaceAll( "\\{body-tag-unload\\}", "" ); //$NON-NLS-1$
    intro = intro.replaceAll( "#\\{GLOBAL_MESSAGE_SET_NAME\\}", dashboardsMessagesBaseFilename ); //$NON-NLS-1$
    intro = intro.replaceAll( "#\\{GLOBAL_MESSAGE_SET_PATH\\}", messageSetPath ); //$NON-NLS-1$
    intro = intro.replaceAll( "#\\{GLOBAL_MESSAGE_SET\\}", buildMessageSetCode( i18nTagsList ) ); //$NON-NLS-1$
    return intro;
  }

  private String buildMessageSetCode( ArrayList<String> tagsList ) {
    StringBuffer messageCodeSet = new StringBuffer();
    for ( String tag : tagsList ) {
      messageCodeSet
          .append( "\\$('#" ).append( updateSelectorName( tag ) ).append( "').html(jQuery.i18n.prop('" ).append( tag ).append( "'));\n" ); //$NON-NLS-1$
    }
    return messageCodeSet.toString();
  }

  private String updateUserLanguageKey( String intro ) {
    // Fill the template with the correct user locale
    intro = intro.replaceAll( "#\\{LANGUAGE_CODE\\}", CdfEngine.getEnvironment().getLocale().getLanguage() ); //$NON-NLS-1$
    return intro;
  }

  public static void getHeaders( HashMap<String, String> paramMap, OutputStream out ) throws Exception {

    String dashboardContent = StringUtils.defaultString( paramMap.get( Parameter.DASHBOARD_CONTENT ) );
    getHeaders( dashboardContent, paramMap, out );
  }

  public static void getHeaders( String dashboardContent, HashMap<String, String> paramMap, OutputStream out )
    throws Exception {

    final String dashboardType = StringUtils.defaultIfEmpty( paramMap.get( Parameter.DASHBOARD_TYPE ), "blueprint" );
    final boolean isDebugMode = Boolean.TRUE.toString().equalsIgnoreCase( paramMap.get( Parameter.DEBUG ) );
    String root = StringUtils.defaultString( paramMap.get( Parameter.ROOT ) );
    String scheme = StringUtils.defaultIfEmpty( paramMap.get( Parameter.SCHEME ), "http" );

    getHeaders( dashboardContent, dashboardType, root, scheme, isDebugMode, out );
  }

  public static void getHeaders( String dashboardContent, String dashboardType, String root, String scheme,
      boolean isDebugMode, OutputStream out ) throws Exception {

    ICdfHeadersProvider cdfHeaders = CdfEngine.getEnvironment().getCdfHeadersProvider();
    boolean includeAll = dashboardContent != null;
    String headers;
    if ( !StringUtils.isEmpty( root ) ) {
      // some dashboards need full absolute urls
      if ( root.contains( "/" ) ) {
        // file paths are already absolute, which didn't happen before
        root = root.substring( 0, root.indexOf( "/" ) );
      }
      String absRoot = scheme + "://" + root;
      headers = cdfHeaders.getHeaders( dashboardType, isDebugMode, absRoot, includeAll );
    } else {
      headers = cdfHeaders.getHeaders( dashboardType, isDebugMode, includeAll );
    }
    out.write( headers.getBytes( CharsetHelper.getEncoding() ) );
  }

  private void generateStorage( final OutputStream out, final String user ) throws Exception {

    JSONObject result = StorageEngine.getInstance().read( user );

    StringBuilder s = new StringBuilder();
    s.append( "\n<script language=\"javascript\" type=\"text/javascript\">\n" );
    s.append( "  Dashboards.storage = " );
    s.append( result.toString( 2 ) ).append( "\n" );
    s.append( "</script>\n" );
    // setResponseHeaders(MIME_PLAIN,0,null);
    out.write( s.toString().getBytes( CharsetHelper.getEncoding() ) );
  }
}
