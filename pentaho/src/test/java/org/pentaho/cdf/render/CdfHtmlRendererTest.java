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

package org.pentaho.cdf.render;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;

import junit.framework.TestCase;
import org.json.JSONException;
import org.junit.Before;
import org.junit.Test;
import org.pentaho.cdf.environment.templater.ITemplater;
import pt.webdetails.cpf.localization.MessageBundlesHelper;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IReadAccess;

import static org.mockito.Mockito.*;

public class CdfHtmlRendererTest extends TestCase {
  CdfHtmlRenderer cdfHtmlRenderer;

  @Before
  public void setUp() {
    cdfHtmlRenderer = spy( new CdfHtmlRenderer() );
    try {
      doReturn( "" ).when( cdfHtmlRenderer )
        .getConfiguration(  anyString(), any( HashMap.class ), anyInt() );
    } catch ( JSONException e ) {
      e.printStackTrace();
    }
  }

  @Test
  public void testExecuteRequire() throws Exception {
    OutputStream outputStream = mock( OutputStream.class );
    IBasicFile basicFile = mock( IBasicFile.class );
    String style = "myStyle",
        messages = "myMessages",
        user = "admin";

    HashMap<String, String> parameterMap = new HashMap<String, String>();
    boolean isRequire = true;
    int inactiveInterval = 1234;

    String testContent = "testContent";

    IBasicFile templateFile = mock( IBasicFile.class );
    InputStream templateContent = mock( InputStream.class );
    doReturn( templateContent ).when( templateFile ).getContents();

    IReadAccess systemAccess = mock( IReadAccess.class );
    doReturn( true ).when( systemAccess ).fileExists( "template-dashboard-myStyle.html" );
    doReturn( templateFile ).when( systemAccess ).fetchFile( "template-dashboard-myStyle.html" );
    doReturn( systemAccess ).when( cdfHtmlRenderer ).getPluginSystemReader( null );

    IReadAccess pluginRepoAccess = mock( IReadAccess.class );
    doReturn( true ).when( pluginRepoAccess ).fileExists( "template-dashboard-myStyle.html" );
    doReturn( templateFile ).when( pluginRepoAccess ).fetchFile( "template-dashboard-myStyle.html" );
    doReturn( pluginRepoAccess ).when( cdfHtmlRenderer ).getPluginRepositoryReader( "templates/" );

    doReturn( testContent ).when( cdfHtmlRenderer ).getContentString( templateContent );

    ITemplater templater = mock( ITemplater.class );
    String intro = "<head></head>";
    doReturn( intro ).when( templater ).getTemplateSection( anyString(), any( ITemplater.Section.class ) );
    doReturn( templater ).when( cdfHtmlRenderer ).getTemplater();

    doReturn( "" ).when( cdfHtmlRenderer ).updateUserLanguageKey( anyString() );
    doReturn( "" ).when( cdfHtmlRenderer ).processi18nTags( anyString(), any( ArrayList.class ) );
    doReturn( "" ).when( cdfHtmlRenderer ).getDashboardContent( any( InputStream.class ), any( ArrayList.class ) );

    doReturn( "/public/cdf" ).when( cdfHtmlRenderer ).getPluginRepositoryDir();
    MessageBundlesHelper mbh = mock( MessageBundlesHelper.class );
    doReturn( intro ).when( mbh ).replaceParameters( anyString(), any( ArrayList.class ) );
    doReturn( mbh ).when( cdfHtmlRenderer ).getMessageBundlesHelper( anyString() );

    doNothing().when( cdfHtmlRenderer )
      .getHeadersInternal( anyString(), any( HashMap.class ), any( OutputStream.class ) );
    doNothing().when( cdfHtmlRenderer ).generateContext( any( OutputStream.class ), any( HashMap.class ), anyInt() );
    doNothing().when( cdfHtmlRenderer ).generateStorage( any( OutputStream.class ), anyString() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/true, /*loadTheme*/false );

    verify( cdfHtmlRenderer, times( 0 ) )
      .getHeadersInternal( anyString(), any( HashMap.class ), any( OutputStream.class ) );
    verify( cdfHtmlRenderer, times( 0 ) ).generateContext( any( OutputStream.class ), any( HashMap.class ), anyInt() );
    verify( cdfHtmlRenderer, times( 0 ) ).generateStorage( any( OutputStream.class ), anyString() );
    verify( cdfHtmlRenderer, times( 1 ) ).getWebContextHeader( any( OutputStream.class ), anyBoolean() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/false, /*loadTheme*/false );

    verify( cdfHtmlRenderer, times( 1 ) )
      .getHeadersInternal( anyString(), any( HashMap.class ), any( OutputStream.class ) );
    verify( cdfHtmlRenderer, times( 1 ) ).generateContext( any( OutputStream.class ), any( HashMap.class ), anyInt() );
    verify( cdfHtmlRenderer, times( 1 ) ).generateStorage( any( OutputStream.class ), anyString() );
    verify( cdfHtmlRenderer, times( 1 ) ).getWebContextHeader( any( OutputStream.class ), anyBoolean() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/true, /*loadTheme*/true );

    verify( cdfHtmlRenderer, times( 1 ) )
      .getHeadersInternal( anyString(), any( HashMap.class ), any( OutputStream.class ) );
    verify( cdfHtmlRenderer, times( 1 ) ).generateContext( any( OutputStream.class ), any( HashMap.class ), anyInt() );
    verify( cdfHtmlRenderer, times( 1 ) ).generateStorage( any( OutputStream.class ), anyString() );
    verify( cdfHtmlRenderer, times( 2 ) ).getWebContextHeader( any( OutputStream.class ), anyBoolean() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/false, /*loadTheme*/true );

    verify( cdfHtmlRenderer, times( 2 ) )
      .getHeadersInternal( anyString(), any( HashMap.class ), any( OutputStream.class ) );
    verify( cdfHtmlRenderer, times( 2 ) ).generateContext( any( OutputStream.class ), any( HashMap.class ), anyInt() );
    verify( cdfHtmlRenderer, times( 2 ) ).generateStorage( any( OutputStream.class ), anyString() );
    verify( cdfHtmlRenderer, times( 2 ) ).getWebContextHeader( any( OutputStream.class ), anyBoolean() );
  }
}
