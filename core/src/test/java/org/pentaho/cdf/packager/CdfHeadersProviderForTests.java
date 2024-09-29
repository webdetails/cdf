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


package org.pentaho.cdf.packager;

import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import pt.webdetails.cpf.context.api.IUrlProvider;
import pt.webdetails.cpf.packager.DependenciesPackage;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IRWAccess;
import pt.webdetails.cpf.repository.api.IReadAccess;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import static org.mockito.Mockito.*;

public class CdfHeadersProviderForTests extends CdfHeadersProvider {

  private IContentAccessFactory mockFactory;
  private IReadAccess mockReadAccess;
  private IRWAccess mockRWAccess;
  private IUrlProvider mockUrlProvider;

  private static final String resourceDir = System.getProperty( "user.dir" ) + "/src/test/resources/resource/";

  protected IContentAccessFactory getContentAccess() {
    mockFactory = mock( IContentAccessFactory.class );
    mockReadAccess = mock( IReadAccess.class );
    mockRWAccess = mock( IRWAccess.class );

    when( mockReadAccess.fileExists( anyString() ) ).thenReturn( true );

    when( mockRWAccess.saveFile( anyString(), any( InputStream.class ) ) ).thenReturn( true );

    try {
      when( mockReadAccess.getFileInputStream( anyString() ) ).thenAnswer( new Answer<Object>() {
        @Override public Object answer( InvocationOnMock invocation ) throws Throwable {
          String filePath = (String) invocation.getArguments()[0];
          File f = new File( resourceDir + filePath );
          return new FileInputStream( f );
        }
      } );
    } catch ( IOException e ) {
      e.printStackTrace();
    }

    when( mockFactory.getPluginSystemReader( anyString() ) ).thenReturn( mockReadAccess );
    when( mockFactory.getPluginSystemWriter( anyString() ) ).thenReturn( mockRWAccess );
    return mockFactory;
  }

  protected IUrlProvider getUrlProvider() {
    return mock( IUrlProvider.class );
  }

  protected void appendDependencies( StringBuilder deps, DependenciesPackage pkg, boolean minify,
      String absRoot, final ArrayList<String> files ) {
    deps.append( pkg.getName() );
  }

  protected void appendDependencies( StringBuilder deps, DependenciesPackage pkg, boolean minify, String absRoot ) {
    deps.append( pkg.getName() );

  }

}
