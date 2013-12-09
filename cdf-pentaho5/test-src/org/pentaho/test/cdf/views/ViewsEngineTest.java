/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
*
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/


package org.pentaho.test.cdf.views;


import com.orientechnologies.orient.core.exception.ODatabaseException;
import org.junit.Test;
import org.mockito.Mockito;
import org.pentaho.cdf.views.ViewsEngine;
import pt.webdetails.cpf.persistence.IPersistenceEngine;
import pt.webdetails.cpf.persistence.ISimplePersistence;



public class ViewsEngineTest {

  private class ViewsEngineForTest extends ViewsEngine {
    private IPersistenceEngine ipe;
    private ISimplePersistence isp;

    public ViewsEngineForTest() {
    }

    public ViewsEngineForTest( IPersistenceEngine ipe, ISimplePersistence isp ) {
      this.ipe = ipe;
      this.isp = isp;
    }

    @Override
    protected IPersistenceEngine getPersistenceEngine() {
      return ipe;
    }

    @Override
    protected ISimplePersistence getSimplePersistence() {
      return isp;
    }

  }



  @Test
  //Even with PersistenceEngine throwing an exception, it should be able to finish initializatoin
  public void testInitializationException() {
    IPersistenceEngine ipe = Mockito.mock( IPersistenceEngine.class );
    Mockito.when( ipe.classExists( "org.pentaho.cdf.views.ViewEntry" ) ).thenThrow( new ODatabaseException( "Exception" ) );
    ViewsEngineForTest vet = new ViewsEngineForTest( ipe, null );
  }
}
