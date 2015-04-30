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

package org.pentaho.cdf.views;

import com.orientechnologies.orient.core.exception.OCommandExecutionException;
import com.orientechnologies.orient.core.exception.ODatabaseException;
import junit.framework.Assert;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import org.mockito.Mockito;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.platform.api.engine.IPentahoSession;
import pt.webdetails.cpf.persistence.Filter;
import pt.webdetails.cpf.persistence.IPersistenceEngine;
import pt.webdetails.cpf.persistence.ISimplePersistence;

public class ViewsEngineTest {

  private class ViewsEngineForTest extends ViewsEngine {
    private IPersistenceEngine ipe;
    private ISimplePersistence isp;

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

    //@Override
    protected IPentahoSession getSession() {
      IPentahoSession ips =  Mockito.mock( IPentahoSession.class );
      Mockito.when( ips.getName() ).thenReturn( "name" );
      return ips;
    }

  }

  @Test
  //Even with PersistenceEngine throwing an exception, it should be able to finish initialization
  public void testInitializationException() {
    IPersistenceEngine ipe = Mockito.mock( IPersistenceEngine.class );
    Mockito.when( ipe.classExists( "org.pentaho.cdf.views.View" ) )
            .thenThrow( new ODatabaseException( "Exception" ) );
    new ViewsEngineForTest( ipe, null );
  }


  //Should return error when ISimplePersistence.load fails
  @Test
  public void testGetViewFailOnLoad() throws JSONException {
    ISimplePersistence isp = Mockito.mock( ISimplePersistence.class );
    Mockito.when( isp.load( Mockito.eq( View.class ), Mockito.any( Filter.class ) ) )
            .thenThrow( new OCommandExecutionException( "Exception" ) );
    ViewsEngineForTest vet = new ViewsEngineForTest( Mockito.mock( IPersistenceEngine.class ), isp );
    Assert.assertEquals( JsonUtil.JsonStatus.ERROR.getValue(), vet.getView( "x", vet.getSession().getName() )
      .getString( JsonUtil.JsonField.STATUS.getValue() ) );
  }

  //Should return error object when ISimplePersistence.load fails
  @Test
  public void testListViewsFailOnLoad() throws JSONException {
    ISimplePersistence isp = Mockito.mock( ISimplePersistence.class );
    Mockito.when( isp.load( Mockito.eq( View.class ), Mockito.any( Filter.class ) ) )
            .thenThrow( new OCommandExecutionException( "Exception" ) );
    ViewsEngineForTest vet = new ViewsEngineForTest( Mockito.mock( IPersistenceEngine.class ), isp );
    Assert.assertEquals( JsonUtil.JsonStatus.ERROR.getValue(), vet.listViews( vet.getSession().getName() )
      .getString( JsonUtil.JsonField.STATUS.getValue() ) );
  }

}
