/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


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
