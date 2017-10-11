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

package org.pentaho.cdf.storage;

import org.junit.Test;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.ISecurityHelper;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityHelper;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class ImpersonationHandlerTest {
  @Test
  public void getUserNameTest() throws Exception {
    IPentahoSession thisUserSession = mock( IPentahoSession.class );
    when( thisUserSession.getName() ).thenReturn( "user" );

    IPentahoSession adminUserSession = mock( IPentahoSession.class );
    when( adminUserSession.getName() ).thenReturn( "admin" );

    IPentahoSession otherUserSession = mock( IPentahoSession.class );
    when( otherUserSession.getName() ).thenReturn( "other" );

    ISecurityHelper security = mock( ISecurityHelper.class );
    when( security.isPentahoAdministrator( adminUserSession ) ).thenReturn( true );
    SecurityHelper.setMockInstance( security );

    PentahoSessionHolder.setSession( thisUserSession );
    assertEquals( "user", ImpersonationHandler.getUserName( "user" ) );

    PentahoSessionHolder.setSession( adminUserSession );
    assertEquals( "impersonat", ImpersonationHandler.getUserName( "impersonat" ) );

    PentahoSessionHolder.setSession( otherUserSession );
    assertEquals( "other", ImpersonationHandler.getUserName( "user" ) );

    PentahoSessionHolder.setSession( null );
    boolean gotException = false;
    try {
      assertEquals( "other", ImpersonationHandler.getUserName( "user" ) );
    } catch ( ImpersonationHandler.CdfStorageApiImpersonationException e ) {
      gotException = true;
    }

    assertTrue( gotException );
  }
}
