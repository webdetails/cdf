/*!
 * Copyright 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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
