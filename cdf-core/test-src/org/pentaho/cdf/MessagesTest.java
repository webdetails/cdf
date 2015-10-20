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
