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
