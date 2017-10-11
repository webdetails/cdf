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

package org.pentaho.cdf.packager;

import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

public class CdfHeadersProviderTest extends TestCase {

  private static CdfHeadersProvider cdfHeadersProvider;

  @Before
  protected void setUp() throws Exception {
    cdfHeadersProvider = new CdfHeadersProviderForTests();
  }

  @Test
  public void testGetHeaders() {
    String blueprintHeaders = getHeadersByType( "blueprint" );
    String mobileHeaders = getHeadersByType( "mobile" );
    String bootstrapHeaders = getHeadersByType( "bootstrap" );
    String cleanHeaders = getHeadersByType( "clean" );

    String blueprintExpectedHeaders = "<!-- cdf-blueprint-script-includes -->cdf-blueprint-script-includes<!--"
        + " cdf-blueprint-style-includes -->cdf-blueprint-style-includes<!-- cdf-blueprint-ie8style-includes -->"
        + "cdf-blueprint-ie8style-includes<!-- cdf-cdf-dashboard-script-includes -->cdf-cdf-dashboard-script-includes"
        + "<!-- cdf-cdf-dashboard-style-includes -->cdf-cdf-dashboard-style-includes";
    String mobileExpectedHeaders = "<!-- cdf-mobile-script-includes -->cdf-mobile-script-includes<!--"
        + " cdf-mobile-style-includes -->cdf-mobile-style-includes<!-- cdf-cdf-dashboard-script-includes -->"
        + "cdf-cdf-dashboard-script-includes<!-- cdf-cdf-dashboard-style-includes -->cdf-cdf-dashboard-style-includes";
    String bootstrapExpectedHeaders = "<!-- cdf-bootstrap-script-includes -->cdf-bootstrap-script-includes"
        + "<!-- cdf-bootstrap-ie8script-includes -->cdf-bootstrap-ie8script-includes<!-- cdf-bootstrap-style-includes "
        + "-->cdf-bootstrap-style-includes<!-- file.css.map -->file.css.map<!-- "
        + "cdf-bootstrap-ie8scriptAfterLink-includes -->cdf-bootstrap-ie8scriptAfterLink-includes"
        + "<!-- cdf-cdf-dashboard-script-includes -->cdf-cdf-dashboard-script-includes"
        + "<!-- cdf-cdf-dashboard-style-includes -->cdf-cdf-dashboard-style-includes";
    String cleanExpectedHeaders = "<!-- cdf-clean-script-includes -->cdf-clean-script-includes<!--"
        + " cdf-clean-style-includes -->cdf-clean-style-includes<!-- cdf-cdf-dashboard-script-includes -->"
        + "cdf-cdf-dashboard-script-includes<!-- cdf-cdf-dashboard-style-includes -->cdf-cdf-dashboard-style-includes";

    assertEquals( blueprintExpectedHeaders, blueprintHeaders );
    assertEquals( mobileExpectedHeaders, mobileHeaders );
    assertEquals( bootstrapExpectedHeaders, bootstrapHeaders );
    assertEquals( cleanExpectedHeaders, cleanHeaders );
  }

  @Test
  public void testGetHeadersSimple() throws Exception {
    List<String> componentTypes = new ArrayList<String>();
    componentTypes.add( "testComponent" );

    String blueprintHeaders = cdfHeadersProvider.getHeaders( "blueprint", false, componentTypes );

    String blueprintExpectedHeaders = "<!-- cdf-blueprint-script-includes -->cdf-blueprint-script-includes<!--"
        + " cdf-blueprint-style-includes -->cdf-blueprint-style-includes<!-- cdf-blueprint-ie8style-includes -->"
        + "cdf-blueprint-ie8style-includes<!-- cdf-cdf-dashboard-script-includes -->cdf-cdf-dashboard-script-includes"
        + "<!-- cdf-cdf-dashboard-style-includes -->cdf-cdf-dashboard-style-includes";

    assertEquals( blueprintExpectedHeaders, blueprintHeaders );
  }

  @Test
  public void testGetHeadersInvalidType() throws Exception {
    List<String> componentTypes = new ArrayList<String>();
    componentTypes.add( "testComponent" );

    String blueprintHeaders = cdfHeadersProvider.getHeaders( "", false, componentTypes );

    String blueprintExpectedHeaders = "<!-- cdf-blueprint-script-includes -->cdf-blueprint-script-includes<!--"
        + " cdf-blueprint-style-includes -->cdf-blueprint-style-includes<!-- cdf-blueprint-ie8style-includes -->"
        + "cdf-blueprint-ie8style-includes<!-- cdf-cdf-dashboard-script-includes -->cdf-cdf-dashboard-script-includes"
        + "<!-- cdf-cdf-dashboard-style-includes -->cdf-cdf-dashboard-style-includes";

    assertEquals( blueprintExpectedHeaders, blueprintHeaders );
  }


  private String getHeadersByType( String type ) {
    List<String> componentTypes = new ArrayList<String>();
    componentTypes.add( "testComponent" );
    return cdfHeadersProvider.getHeaders( type, false, null, componentTypes );
  }

}
