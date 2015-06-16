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
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.repository2.ClientRepositoryPaths;
import org.pentaho.platform.repository2.unified.jcr.JcrRepositoryFileUtils;
import org.pentaho.platform.util.messages.LocaleHelper;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.List;
import java.util.Locale;

public class EmbeddedHeadersGenerator {
  // embedded constants
  private static final String INITIAL_COMMENT = "/** This file is generated in cdf to allow using cdf embedded.\n"
      + "It will append to the head tag the dependencies needed, like the FULLY_QUALIFIED_URL**/\n\n";
  private final String REQUIRE_JS_CFG_START = "var requireCfg = {waitSeconds: 30, "
      + "paths: {}, shim: {}, map: {\"*\": {}}, bundles: {}, config: {service: {}}, packages: []};\n\n";

  private final String REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION = "requireCfg.config[''cdf/dashboard/Dashboard''] = {0};\n";

  private final String CDF_LIB_PATH = "content/pentaho-cdf/js/lib/cdf-lib-require-js-cfg.js";
  private final String CDF_PATH = "content/pentaho-cdf/js/cdf-require-js-cfg.js";

  private final String REQUIRE_PATH = "content/common-ui/resources/web/require.js";
  private final String REQUIRE_START_PATH = "content/common-ui/resources/web/require-cfg.js";
  private final String COMMON_UI_START_PATH = "content/common-ui/resources/web/common-ui-require-js-cfg.js";

  private final String URL_CONTEXT_BUILDER =
      "var CONTEXT_PATH = ''{0}'';\n\nvar FULL_QUALIFIED_URL = ''{1}'';\n\nvar SERVER_PROTOCOL = ''{2}'';\n\n";
  private final String SESSION_NAME_BUILDER = "var SESSION_NAME = ''{0}'';\n";
  private final String LOCALE_BUILDER =
      "//Providing computed Locale for session\nvar SESSION_LOCALE = ''{0}'';\n";
  private final String HOME_FOLDER_BUILDER =
      "//Providing home folder location for UI defaults\nvar HOME_FOLDER = ''{0}'';\n";
  private final String RESERVED_CHARS_BUILDER = "var RESERVED_CHARS = ''{0}'';\n";
  private final String RESERVED_CHARS_DISPLAY_BUILDER = "var RESERVED_CHARS_DISPLAY = ''{0}'';\n";
  private final String RESERVED_CHARS_REGEX_PATTERN_BUILDER = "var RESERVED_CHARS_REGEX_PATTERN = /{0}/;\n";

  protected Locale locale;
  protected String fullyQualifiedURL;
  protected String contextConfiguration;

  public EmbeddedHeadersGenerator( String fullUrl ) {
    this(fullUrl, "{}");
  }

  public EmbeddedHeadersGenerator( String fullUrl, String contextConfiguration ) {
    this.locale = LocaleHelper.getLocale();
    this.fullyQualifiedURL = fullUrl;
    this.contextConfiguration = contextConfiguration;
  }

  public String generate() throws IOException {
    StringBuilder sb = new StringBuilder();
    sb.append( printScriptsContext() )
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

      .append( "// injecting document writes to append the cdf require files\n" )
        .append( "document.write(\"<script language='javascript' type='text/javascript' src='"
          + fullyQualifiedURL + CDF_PATH + "'></script>\");\n" )
        .append( "document.write(\"<script language='javascript' type='text/javascript' src='"
          + fullyQualifiedURL + CDF_LIB_PATH + "'></script>\");\n" )
        .append( "document.write(\"<script language='javascript' type='text/javascript' src='"
          + fullyQualifiedURL + COMMON_UI_START_PATH + "'></script>\");\n" )
        .append( "document.write(\"<script language='javascript' type='text/javascript' src='"
          + fullyQualifiedURL + REQUIRE_PATH + "'></script>\");\n" )
        .append( "document.write(\"<script language='javascript' type='text/javascript' src='"
          + fullyQualifiedURL + REQUIRE_START_PATH + "'></script>\");\n" );

    return sb.toString();
  }


  protected String printUrlContext() {
    String serverProtocolValue;
    if ( fullyQualifiedURL.startsWith( "http" ) ) {
      serverProtocolValue = fullyQualifiedURL.substring( 0, fullyQualifiedURL.indexOf( ":" ) );
    } else {
      serverProtocolValue = "http";
    }
    return MessageFormat.format( URL_CONTEXT_BUILDER, fullyQualifiedURL, fullyQualifiedURL, serverProtocolValue );
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
}
