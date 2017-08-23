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

package org.pentaho.cdf.embed;

import org.apache.commons.lang.StringEscapeUtils;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginManager;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.repository2.ClientRepositoryPaths;
import org.pentaho.platform.repository2.unified.jcr.JcrRepositoryFileUtils;
import org.pentaho.platform.util.messages.LocaleHelper;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class EmbeddedHeadersGenerator {
  static final String DEPRECATED_COMMENT = "\n/** @deprecated - use 'pentaho/environment' module's variable instead */";

  // embedded constants
  static final String INITIAL_COMMENT = "/** This file is generated in cdf to allow using cdf embedded.\n"
      + "It will append to the head tag the dependencies needed, like the FULLY_QUALIFIED_URL**/\n\n";
  static final String REQUIRE_JS_CFG_START = "var requireCfg = {waitSeconds: 30, "
      + "paths: {}, shim: {}, map: {\"*\": {}}, bundles: {}, config: {service: {}}, packages: []};\n\n";

  static final String REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION =
      "requireCfg.config[''cdf/dashboard/Dashboard''] = {0};\n";

  static final String REQUIRE_PATH = "content/common-ui/resources/web/require.js";
  static final String REQUIRE_START_PATH = "content/common-ui/resources/web/require-cfg.js";

  private static final String CONTEXT_PATH_BUILDER = "\nvar CONTEXT_PATH = ''{0}'';\n";
  private static final String FULL_QUALIFIED_URL_BUILDER = "\nvar FULL_QUALIFIED_URL = ''{0}'';\n";
  private static final String SERVER_PROTOCOL_BUILDER = "\nvar SERVER_PROTOCOL = ''{0}'';\n";
  private static final String SESSION_NAME_BUILDER = "\nvar SESSION_NAME = ''{0}'';\n";
  private static final String LOCALE_BUILDER = "\nvar SESSION_LOCALE = ''{0}'';\n";
  private static final String HOME_FOLDER_BUILDER = "\nvar HOME_FOLDER = ''{0}'';\n";

  private static final String RESERVED_CHARS_BUILDER = "\nvar RESERVED_CHARS = ''{0}'';\n";
  private static final String RESERVED_CHARS_DISPLAY_BUILDER = "\nvar RESERVED_CHARS_DISPLAY = ''{0}'';\n";
  private static final String RESERVED_CHARS_REGEX_PATTERN_BUILDER = "\nvar RESERVED_CHARS_REGEX_PATTERN = /{0}/;\n";

  static final String DOCUMENT_SCRIPT =
      "document.write(\"<script language=''javascript'' type=''text/javascript'' src=''{0}''></script>\");\n";
  private static final String REQUIRE_JS = "requirejs";
  private static final String JS = ".js";

  protected Locale locale;
  protected String serverProtocol;
  protected String fullQualifiedURL;
  protected String contextConfiguration;

  public EmbeddedHeadersGenerator( String fullUrl, String contextConfiguration ) {
    this.locale = LocaleHelper.getLocale();

    this.serverProtocol = fullUrl.startsWith( "http" )
        ? fullUrl.substring( 0, fullUrl.indexOf( ":" ) )
        : "http";

    this.fullQualifiedURL = fullUrl;
    this.contextConfiguration = contextConfiguration;
  }

  public String generate() throws IOException {
    StringBuilder sb = new StringBuilder();
    sb.append( printScriptsContext() )
      .append( printRequireJs() )
      .append( printEnvironmentConfig() )
      .append( printUrlContext() )
      .append( printSessionName() )
      .append( printLocale() )
      .append( printHomeFolder() )
      .append( printReservedChars() )
      .append( printReservedCharsDisplay() )
      .append( printReservedRegexPattern() );

    return sb.toString();
  }

  public void setLocale( Locale locale ) {
    this.locale = locale;
  }

  // region Print Methods
  private String printScriptsContext() {

    StringBuilder sb = new StringBuilder();

    sb.append( INITIAL_COMMENT )
      .append( REQUIRE_JS_CFG_START )
      .append( MessageFormat.format( REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION, contextConfiguration ) )
      .append( "// injecting document writes to append the cdf require files\n" );

    List<String> contextScripts = getContextScripts();
    for ( String s : contextScripts ) {
      sb.append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + s ) );
    }

    return sb.toString();
  }

  private String printRequireJs() {
    StringBuilder sb = new StringBuilder();
    sb.append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + REQUIRE_PATH ) )
      .append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + REQUIRE_START_PATH ) );

    return sb.toString();
  }

  private String printEnvironmentConfig() {
    String userID = getSessionName();
    String userHomeFolder = getUserHomeFolderPath();

    StringBuilder reservedChars = new StringBuilder();
    for ( char reserved : getReservedChars() ) {
      reservedChars.append( reserved );
    }

    return "\nrequireCfg.config[\"pentaho/environment\"] = {" +
        "\n  theme: null," +
        "\n  locale: \"" + this.locale + "\"," +
        "\n  user: {" +
        "\n    id: \"" + userID + "\"," +
        "\n    home: \"" + userHomeFolder + "\"" +
        "\n  }," +
        "\n  server: {" +
        "\n    root: \"" + this.fullQualifiedURL + "\"" +
        "\n  }," +
        "\n  reservedChars: \"" + escapeEnvironmentVariable( reservedChars.toString() ) + "\"" +
        "\n};\n";
  }

  private String printUrlContext() {
    String contextPath = DEPRECATED_COMMENT + MessageFormat.format( CONTEXT_PATH_BUILDER, this.fullQualifiedURL );
    String fullQualifiedUrl = DEPRECATED_COMMENT +
        MessageFormat.format( FULL_QUALIFIED_URL_BUILDER, this.fullQualifiedURL );
    String serverProtocol = DEPRECATED_COMMENT + MessageFormat.format( SERVER_PROTOCOL_BUILDER, this.serverProtocol );

    return contextPath + fullQualifiedUrl + serverProtocol;
  }

  private String printSessionName() throws IOException {
    return DEPRECATED_COMMENT + MessageFormat.format( SESSION_NAME_BUILDER, getSessionName() );
  }

  private String printLocale() throws IOException {
    return DEPRECATED_COMMENT + MessageFormat.format( LOCALE_BUILDER, locale.toString() );
  }

  private String printHomeFolder() throws IOException {
    return DEPRECATED_COMMENT + MessageFormat.format( HOME_FOLDER_BUILDER, getUserHomeFolderPath() );
  }

  private String printReservedChars() throws IOException {
    StringBuilder sb = new StringBuilder();
    for ( char c : getReservedChars() ) {
      sb.append( c );
    }

    String reservedChars = escapeEnvironmentVariable( sb.toString() );
    return DEPRECATED_COMMENT + MessageFormat.format( RESERVED_CHARS_BUILDER, reservedChars );
  }

  private String printReservedCharsDisplay() throws IOException {
    List<Character> reservedCharacters = getReservedChars();
    StringBuffer sb = new StringBuffer();
    for ( int i = 0; i < reservedCharacters.size(); i++ ) {
      if ( reservedCharacters.get( i ) >= 0x07 && reservedCharacters.get( i ) <= 0x0d ) {
        sb.append( StringEscapeUtils.escapeJava( "" + reservedCharacters.get( i ) ) );
      } else {
        sb.append( reservedCharacters.get( i ) );
      }
      if ( i + 1 < reservedCharacters.size() ) {
        sb.append( ", " );
      }
    }

    String reservedCharsDisplay = escapeEnvironmentVariable( sb.toString() );
    return DEPRECATED_COMMENT + MessageFormat.format( RESERVED_CHARS_DISPLAY_BUILDER, reservedCharsDisplay );
  }

  private String printReservedRegexPattern() throws IOException {
    return DEPRECATED_COMMENT + MessageFormat.format( RESERVED_CHARS_REGEX_PATTERN_BUILDER, makeReservedCharPattern() );
  }
  // endregion

  private String makeReservedCharPattern() {
    // escape all reserved characters as they may have special meaning to regex engine
    StringBuilder buf = new StringBuilder();
    buf.append( ".*[" );
    for ( Character ch : getReservedChars() ) {
      buf.append( escapeEnvironmentVariable( ch.toString() ) );
    }
    buf.append( "]+.*" );

    return buf.toString();
  }

  protected String getSessionName() {
    IPentahoSession session = getPentahoSession();
    if ( session == null ) {
      return "null";
    }

    return escapeEnvironmentVariable( session.getName() );
  }

  protected String getUserHomeFolderPath() {
    IPentahoSession session = getPentahoSession();
    if ( session == null ) {
      return "null";
    }

    String sessionName = escapeEnvironmentVariable( session.getName() );
    return ClientRepositoryPaths.getUserHomeFolderPath( sessionName );
  }

  protected List<Character> getReservedChars() {
    return JcrRepositoryFileUtils.getReservedChars();
  }

  protected List<String> getContextScripts() {
    List<String> scripts = new ArrayList<>();
    IPluginManager pluginManager = PentahoSystem.get( IPluginManager.class );
    List<String> externalResources = pluginManager.getExternalResourcesForContext( REQUIRE_JS );
    for ( String res : externalResources ) {
      if ( res == null ) {
        continue;
      }
      if ( res.endsWith( JS ) ) {
        scripts.add( res );
      }
    }
    return scripts;
  }

  private String escapeEnvironmentVariable( String value ) {
    if ( value == null) {
      return "null";
    }

    return StringEscapeUtils.escapeJavaScript( value );
  }

  private IPentahoSession getPentahoSession() {
    return PentahoSessionHolder.getSession();
  }
}
