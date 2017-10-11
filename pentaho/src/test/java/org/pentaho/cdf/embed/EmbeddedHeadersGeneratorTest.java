/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

import junit.framework.TestCase;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.pentaho.cdf.embed.EmbeddedHeadersGenerator.REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION;

public class EmbeddedHeadersGeneratorTest extends TestCase {

  private Map<String, String> mockVariables;
  private List<String> mockContextScripts;
  private EmbeddedHeadersGenerator embeddedHeadersGenerator;

  public void testGenerateEmbeddedHeaders() throws IOException {
    setupTest();

    String result = this.embeddedHeadersGenerator.generate();
    String expected = getEmbeddedHeadersExpectedResult();
    assertEquals( expected, result );
  }

  private void setupTest() {
    this.mockVariables = new HashMap<>();
    mockVariables.put( "SESSION_NAME", "TEST_SESSION_NAME" );
    mockVariables.put( "HOME_FOLDER", "TEST_USER_HOME_FOLDER_PATH" );
    mockVariables.put( "SERVER_PROTOCOL", "httpTESTPROTOCOL" );
    mockVariables.put( "FULL_QUALIFIED_URL", "httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/" );
    mockVariables.put( "LOCALE", "TEST_LOCALE" );
    mockVariables.put( "RESERVED_CHARS", "ab" );
    mockVariables.put( "CDF_CONTEXT_CONFIG", "TEST_CONFIGURATION" );

    this.mockContextScripts = new ArrayList<>();
    mockContextScripts.add( "content/pentaho-cdf/js/cdf-require-js-cfg.js" );
    mockContextScripts.add( "content/common-ui/resources/web/common-ui-require-js-cfg.js" );

    this.embeddedHeadersGenerator = new EmbeddedHeadersGeneratorForTests( this.mockVariables, this.mockContextScripts );
  }

  private String getDocumentWriteScriptTag( String resource ) {
    String resourceFullUrl = this.mockVariables.get( "FULL_QUALIFIED_URL" ) + resource;

    return MessageFormat.format( EmbeddedHeadersGenerator.DOCUMENT_SCRIPT, resourceFullUrl );
  }

  private String getGlobalEnvVariable( String variable, String value ) {
    String quote = variable.equals( "RESERVED_CHARS_REGEX_PATTERN" ) ? "" : "'";

    return String.format( "%s\nvar %s = %s%s%s;\n", EmbeddedHeadersGenerator.DEPRECATED_COMMENT, variable, quote, value, quote );
  }

  private String getEmbeddedHeadersExpectedResult() {
    String fullQualifiedUrl = this.mockVariables.get( "FULL_QUALIFIED_URL" );
    String serverProtocol = this.mockVariables.get( "SERVER_PROTOCOL" );
    String sessionName = this.mockVariables.get( "SESSION_NAME" );
    String folderPath = this.mockVariables.get( "HOME_FOLDER" );
    String locale = ( new Locale( this.mockVariables.get( "LOCALE" ) ) ).toString();
    String reservedChars = this.mockVariables.get( "RESERVED_CHARS" );
    String cdfContextConfiguration = this.mockVariables.get( "CDF_CONTEXT_CONFIG" );

    // Initial comment and requireCfg initial configuration
    StringBuilder expected = new StringBuilder( EmbeddedHeadersGenerator.INITIAL_COMMENT );
    expected.append( EmbeddedHeadersGenerator.REQUIRE_JS_CFG_START );
    expected.append( MessageFormat.format( REQUIRE_DASHBOARD_CONTEXT_CONFIGURATION, cdfContextConfiguration ) );

    // Including context and require scripts
    expected.append( "// injecting document writes to append the cdf require files\n" );
    this.mockContextScripts.forEach( script -> expected.append( getDocumentWriteScriptTag( script ) ) );
    expected.append( getDocumentWriteScriptTag( EmbeddedHeadersGenerator.REQUIRE_PATH ) );
    expected.append( getDocumentWriteScriptTag( EmbeddedHeadersGenerator.REQUIRE_START_PATH ) );

    // Hitachi Vantara Environment configuration
    expected.append( "\nrequireCfg.config[\"pentaho/environment\"] = {" );
    expected.append( "\n  theme: null," );
    expected.append( "\n  locale: \"" ).append( locale ).append( "\"," );
    expected.append( "\n  user: {" );
    expected.append( "\n    id: \"" ).append( sessionName ).append( "\"," );
    expected.append( "\n    home: \"" ).append( folderPath ).append( "\"" );
    expected.append( "\n  }," );
    expected.append( "\n  server: {" );
    expected.append( "\n    root: \"" ).append( fullQualifiedUrl ).append( "\"" );
    expected.append( "\n  }," );
    expected.append( "\n  reservedChars: \"" ).append( reservedChars ).append( "\"" );
    expected.append( "\n};\n" );

    // Defining global environment variables
    expected.append( getGlobalEnvVariable( "CONTEXT_PATH", fullQualifiedUrl ) );
    expected.append( getGlobalEnvVariable( "FULL_QUALIFIED_URL", fullQualifiedUrl ) );
    expected.append( getGlobalEnvVariable( "SERVER_PROTOCOL", serverProtocol ) );
    expected.append( getGlobalEnvVariable( "SESSION_NAME", sessionName ) );
    expected.append( getGlobalEnvVariable( "SESSION_LOCALE", locale ) );
    expected.append( getGlobalEnvVariable( "HOME_FOLDER", folderPath ) );
    expected.append( getGlobalEnvVariable( "RESERVED_CHARS", reservedChars ) );
    expected.append( getGlobalEnvVariable( "RESERVED_CHARS_DISPLAY", "a, b" ) );
    expected.append( getGlobalEnvVariable( "RESERVED_CHARS_REGEX_PATTERN", "/.*[ab]+.*/" ) );

    return expected.toString();
  }

}
