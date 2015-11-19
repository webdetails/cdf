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

import java.util.ArrayList;
import java.util.List;

public class EmbeddedHeadersGeneratorForTests extends EmbeddedHeadersGenerator {

  public EmbeddedHeadersGeneratorForTests( String fullQualifiedUrl, String contextConfiguration ) {
    super( fullQualifiedUrl, contextConfiguration );
  }

  @Override
  protected String getSessionName() {
    return "TEST_SESSION_NAME";
  }

  @Override
  protected String getUserHomeFolderPath() {
    return "TEST_USER_HOME_FOLDER_PATH";
  }

  @Override
  protected List<Character> getReservedChars() {
    List<Character> characters = new ArrayList<Character>();
    characters.add( 'a' );
    characters.add( 'b' );
    return characters;
  }

  @Override
  protected List<String> getContextScripts() {
    List<String> configurations = new ArrayList<String>();
    configurations.add( "content/pentaho-cdf/js/cdf-require-js-cfg.js" );
    configurations.add( "content/common-ui/resources/web/common-ui-require-js-cfg.js" );
    return configurations;
  }

}
