/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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
  // embedded constants
  private static final String INITIAL_COMMENT = "/** This file is generated in cdf to allow using cdf embedded.\n"
      + "It will append to the head tag the dependencies needed, like the FULLY_QUALIFIED_URL**/\n\n";
  private static final String REQUIRE_JS_CFG_START = "var requireCfg = {waitSeconds: 30, "
      + "paths: {}, shim: {}, map: {\"*\": {}}, bundles: {}, config: {service: {}}, packages: []};\n\n";

  private static final String REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION =
      "requireCfg.config[''cdf/dashboard/Dashboard''] = {0};\n";

  private static final String REQUIRE_PATH = "content/common-ui/resources/web/require.js";
  private static final String REQUIRE_START_PATH = "content/common-ui/resources/web/require-cfg.js";

  private static final String URL_CONTEXT_BUILDER =
      "var CONTEXT_PATH = ''{0}'';\n\nvar FULL_QUALIFIED_URL = ''{1}'';\n\nvar SERVER_PROTOCOL = ''{2}'';\n\n";
  private static final String SESSION_NAME_BUILDER = "var SESSION_NAME = ''{0}'';\n";
  private static final String LOCALE_BUILDER =
      "//Providing computed Locale for session\nvar SESSION_LOCALE = ''{0}'';\n";
  private static final String HOME_FOLDER_BUILDER =
      "//Providing home folder location for UI defaults\nvar HOME_FOLDER = ''{0}'';\n";
  private static final String RESERVED_CHARS_BUILDER = "var RESERVED_CHARS = ''{0}'';\n";
  private static final String RESERVED_CHARS_DISPLAY_BUILDER = "var RESERVED_CHARS_DISPLAY = ''{0}'';\n";
  private static final String RESERVED_CHARS_REGEX_PATTERN_BUILDER = "var RESERVED_CHARS_REGEX_PATTERN = /{0}/;\n";

  private static final String DOCUMENT_SCRIPT =
      "document.write(\"<script language=''javascript'' type=''text/javascript'' src=''{0}''></script>\");\n";
  private static final String REQUIRE_JS = "requirejs";
  private static final String JS = ".js";

  protected Locale locale;
  protected String fullQualifiedURL;
  protected String contextConfiguration;

  public EmbeddedHeadersGenerator( String fullUrl, String contextConfiguration ) {
    this.locale = LocaleHelper.getLocale();
    this.fullQualifiedURL = fullUrl;
    this.contextConfiguration = contextConfiguration;
  }

  public String generate() throws IOException {
    StringBuilder sb = new StringBuilder();
    sb.append( printScriptsContext() )
      .append( printRequireJs() )
      .append( printUrlContext() )
      .append( printSessionName() )
      .append( printLocale() )
      .append( printHomeFolder() )
      .append( printReservedChars() )
      .append( printReservedCharsDisplay() )
      .append( printReservedRegexPattern() );
    return sb.toString();
  }

  protected String printScriptsContext() {

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

  protected String printRequireJs() {
    StringBuilder sb = new StringBuilder();
    sb.append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + REQUIRE_PATH ) )
      .append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + REQUIRE_START_PATH ) );

    return sb.toString();
  }

  protected String printUrlContext() {
    String serverProtocolValue;
    if ( fullQualifiedURL.startsWith( "http" ) ) {
      serverProtocolValue = fullQualifiedURL.substring( 0, fullQualifiedURL.indexOf( ":" ) );
    } else {
      serverProtocolValue = "http";
    }
    return MessageFormat.format( URL_CONTEXT_BUILDER, fullQualifiedURL, fullQualifiedURL, serverProtocolValue );
  }

  protected String printSessionName() throws IOException {
    return MessageFormat.format( SESSION_NAME_BUILDER, getSessionName() );
  }

  protected String printLocale() throws IOException {
    return MessageFormat.format( LOCALE_BUILDER, locale.toString() );
  }

  protected String printHomeFolder() throws IOException {
    return MessageFormat.format( HOME_FOLDER_BUILDER, getUserHomeFolderPath() );
  }

  protected String printReservedChars() throws IOException {
    StringBuilder sb = new StringBuilder();
    for ( char c : getReservedChars() ) {
      sb.append( c );
    }
    return MessageFormat.format( RESERVED_CHARS_BUILDER, StringEscapeUtils.escapeJavaScript( sb.toString() ) );
  }

  protected String printReservedCharsDisplay() throws IOException {
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
    return MessageFormat.format( RESERVED_CHARS_DISPLAY_BUILDER, StringEscapeUtils.escapeJavaScript( sb.toString() ) );
  }

  protected String printReservedRegexPattern() throws IOException {
    return MessageFormat.format( RESERVED_CHARS_REGEX_PATTERN_BUILDER, makeReservedCharPattern() );
  }

  protected String makeReservedCharPattern() {
    // escape all reserved characters as they may have special meaning to regex engine
    StringBuilder buf = new StringBuilder();
    buf.append( ".*[" );
    for ( Character ch : getReservedChars() ) {
      buf.append( StringEscapeUtils.escapeJavaScript( ch.toString() ) );
    }
    buf.append( "]+.*" );
    return buf.toString();
  }

  public void setLocale( Locale locale ) {
    this.locale = locale;
  }

  protected String getSessionName() {
    if ( PentahoSessionHolder.getSession() == null ) {
      return "null";
    }
    return StringEscapeUtils.escapeJavaScript( PentahoSessionHolder.getSession().getName() );
  }

  protected String getUserHomeFolderPath() {
    if ( PentahoSessionHolder.getSession() != null ) {
      return ClientRepositoryPaths.getUserHomeFolderPath( StringEscapeUtils
        .escapeJavaScript( PentahoSessionHolder.getSession().getName() ) );
    }
    return "null";
  }

  protected List<Character> getReservedChars() {
    return JcrRepositoryFileUtils.getReservedChars();
  }

  protected List<String> getContextScripts() {
    List<String> scripts = new ArrayList<String>();
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
}
