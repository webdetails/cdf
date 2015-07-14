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

import junit.framework.Assert;
import junit.framework.TestCase;

import java.io.IOException;
import java.util.Locale;

public class EmbeddedHeadersGeneratorTest extends TestCase {

  public void testGenerateEmbeddedHeaders() throws IOException {
    String expected = "/** This file is generated in cdf to allow using cdf embedded.\n"
        + "It will append to the head tag the dependencies needed, like the FULLY_QUALIFIED_URL**/\n"
        + "\n"
        + "var requireCfg = {waitSeconds: 30, paths: {}, shim: {}, map: {\"*\": {}}, bundles: {}, config: {service: {}}, packages: []};\n"
        + "\n"
        + "requireCfg.config['cdf/dashboard/Dashboard'] = TEST_CONFIGURATION;\n"
        + "// injecting document writes to append the cdf require files\n"
        + "document.write(\"<script language='javascript' type='text/javascript' "
        + "src='httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/content/pentaho-cdf/js/cdf-require-js-cfg"
        + ".js'></script>\");\n"
        + "document.write(\"<script language='javascript' type='text/javascript' "
        + "src='httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/content/common-ui/resources/web/common-ui-require-js-cfg"
        + ".js'></script>\");\n"
        + "document.write(\"<script language='javascript' type='text/javascript' "
        + "src='httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/content/common-ui/resources/web/require.js'></script>\");\n"
        + "document.write(\"<script language='javascript' type='text/javascript' "
        + "src='httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/content/common-ui/resources/web/require-cfg.js'></script>\");\n"
        + "var CONTEXT_PATH = 'httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/';\n"
        + "\n"
        + "var FULL_QUALIFIED_URL = 'httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/';\n"
        + "\n"
        + "var SERVER_PROTOCOL = 'httpTESTPROTOCOL';\n"
        + "\n"
        + "var SESSION_NAME = 'TEST_SESSION_NAME';\n"
        + "//Providing computed Locale for session\n"
        + "var SESSION_LOCALE = 'test_locale';\n"
        + "//Providing home folder location for UI defaults\n"
        + "var HOME_FOLDER = 'TEST_USER_HOME_FOLDER_PATH';\n"
        + "var RESERVED_CHARS = 'ab';\n"
        + "var RESERVED_CHARS_DISPLAY = 'a, b';\n"
        + "var RESERVED_CHARS_REGEX_PATTERN = /.*[ab]+.*/;\n";

    EmbeddedHeadersGenerator embeddedHeadersGenerator =
        new EmbeddedHeadersGeneratorForTests( "httpTESTPROTOCOL:TEST_FULL_QUALIFIED_URL/", "TEST_CONFIGURATION" );
    embeddedHeadersGenerator.setLocale( new Locale( "TEST_LOCALE" ) );
    String result = embeddedHeadersGenerator.generate();

    Assert.assertEquals( expected, result );
  }

}
