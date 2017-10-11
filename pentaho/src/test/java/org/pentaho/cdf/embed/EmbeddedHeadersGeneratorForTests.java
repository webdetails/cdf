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
