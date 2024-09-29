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


package org.pentaho.cdf.embed;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.List;

public class EmbeddedHeadersCallbackGenerator extends EmbeddedHeadersGenerator {
  static final String DOCUMENT_SCRIPT_START = "new Promise(function (resolve, reject) {";
  static final String DOCUMENT_SCRIPT = "loadScript(''{0}'').then( () => '{'\n";
  static final String DOCUMENT_SCRIPT_CALLBACK = "loadScript(''{0}'').then( () => '{'\n{1}\n";
  static final String DOCUMENT_SCRIPT_CALLBACK_CALL = "if({0}) {0}();";
  static final String DOCUMENT_SCRIPT_END = "})";
  static final String DOCUMENT_SCRIPT_CHAIN_END = ";\n";

  protected String callbackFunctionName = "undefined";

  public EmbeddedHeadersCallbackGenerator( String fullUrl, String contextConfiguration ) {
    super(fullUrl, contextConfiguration);
  }

  public String generate() throws IOException {
    StringBuilder sb = new StringBuilder();
    sb.append( printUrlContext() )
      .append( printSessionName() )
      .append( printLocale() )
      .append( printHomeFolder() )
      .append( printReservedChars() )
      .append( printReservedCharsDisplay() )
      .append( printReservedRegexPattern() )
      .append( printScriptsContext() );

    return sb.toString();
  }

  public void setCallbackFunctionName( String callbackFunctionName ) {
    this.callbackFunctionName = callbackFunctionName;
  }

  protected String printScriptsContext() {

    StringBuilder sb = new StringBuilder();

    sb.append( INITIAL_COMMENT )
      .append( REQUIRE_JS_CFG_START )
      .append( printEnvironmentConfig() )
      .append( MessageFormat.format( REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION, contextConfiguration ) )
      .append( "// loading the cdf require files\n" )
      .append("function loadScript(src) {\n"+
        "  return new Promise(function (resolve, reject) {\n"+
        "    var newScriptElement;\n"+
        "    newScriptElement = document.createElement('script');\n"+
        "    newScriptElement.src = src;\n"+
        "    newScriptElement.async = true;\n"+
        "    newScriptElement.onload = resolve;\n"+
        "    newScriptElement.onerror = reject;\n"+
        "    document.head.appendChild(newScriptElement);\n"+
        "  });\n"+
        "}\n");

    sb.append( DOCUMENT_SCRIPT_START );
    List<String> contextScripts = getContextScripts();
    for ( String s : contextScripts ) {
      sb.append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + s ) );
    }

    //RequireJS
    String callbackCall = MessageFormat.format( DOCUMENT_SCRIPT_CALLBACK_CALL, callbackFunctionName );
    sb.append( MessageFormat.format( DOCUMENT_SCRIPT, fullQualifiedURL + REQUIRE_PATH ) )
      .append( MessageFormat.format( DOCUMENT_SCRIPT_CALLBACK, fullQualifiedURL + REQUIRE_START_PATH, callbackCall ) );

    //Add end tags
    for ( int i = 0; i < contextScripts.size(); i++ ) {
      sb.append( DOCUMENT_SCRIPT_END );
    }
    //Add RequireJS end tags
    sb.append(DOCUMENT_SCRIPT_END).append(DOCUMENT_SCRIPT_END);

    //Add final tag for the chained scripts loading instruction
    sb.append( DOCUMENT_SCRIPT_END ).append( DOCUMENT_SCRIPT_CHAIN_END );

    return sb.toString();
  }
}
