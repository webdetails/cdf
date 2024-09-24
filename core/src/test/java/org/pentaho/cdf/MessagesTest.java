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

package org.pentaho.cdf;

import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Test;

public class MessagesTest extends TestCase {

  @Before
  public void setUp() {
  }

  @Test
  public void testGetEncodedStringNull() throws Exception {
    String result = Messages.getEncodedString( null );
    assertEquals( "", result ); //$NON-NLS-1$
  }

  @Test
  public void testGetEncodedString() throws Exception {
    String result = Messages.getEncodedString( "çéà" ); //$NON-NLS-1$
    assertEquals( "&#xe7;&#xe9;&#xe0;", result );
  }
}
