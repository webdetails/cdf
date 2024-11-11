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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class EmbeddedHeadersGeneratorForTests extends EmbeddedHeadersGenerator {

  private Map<String, String> mockVariables;
  private List<String> mockContextScripts;

  EmbeddedHeadersGeneratorForTests( Map<String, String> mockVariables, List<String> mockContextScripts ) {
    super( mockVariables.get( "FULL_QUALIFIED_URL" ), mockVariables.get( "CDF_CONTEXT_CONFIG" ) );

    this.mockVariables = mockVariables;
    this.mockContextScripts = mockContextScripts;

    this.locale = new Locale( mockVariables.get( "LOCALE" ) );
  }

  @Override
  protected String getSessionName() {
    return this.mockVariables.get( "SESSION_NAME" );
  }

  @Override
  protected String getUserHomeFolderPath() {
    return this.mockVariables.get( "HOME_FOLDER" );
  }

  @Override
  protected List<Character> getReservedChars() {
    String reservedChars = this.mockVariables.get( "RESERVED_CHARS" );
    int rCharsSize = reservedChars.length();

    List<Character> characters = new ArrayList<>();
    for ( int rChar = 0; rChar < rCharsSize; rChar++ ) {
      characters.add( reservedChars.charAt( rChar ) );
    }

    return characters;
  }

  @Override
  protected List<String> getContextScripts() {
    return this.mockContextScripts;
  }

}
