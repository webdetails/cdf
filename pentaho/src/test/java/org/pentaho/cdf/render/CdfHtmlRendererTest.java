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


package org.pentaho.cdf.render;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;

import junit.framework.TestCase;
import org.json.JSONException;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import org.pentaho.cdf.environment.templater.ITemplater;
import pt.webdetails.cpf.localization.MessageBundlesHelper;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IReadAccess;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;


public class CdfHtmlRendererTest extends TestCase {
  CdfHtmlRenderer cdfHtmlRenderer;

  @Before
  public void setUp() {
    cdfHtmlRenderer = spy( new CdfHtmlRenderer() );
    try {
      doReturn( "" ).when( cdfHtmlRenderer )
        .getConfiguration(  any(), Mockito.<HashMap>any(), anyInt() );
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
    doReturn( intro ).when( templater ).getTemplateSection( any(), any( ITemplater.Section.class ) );
    doReturn( templater ).when( cdfHtmlRenderer ).getTemplater();

    doReturn( "" ).when( cdfHtmlRenderer ).updateUserLanguageKey( any() );
    doReturn( "" ).when( cdfHtmlRenderer ).processi18nTags( any(), Mockito.<ArrayList>any() );
    doReturn( "" ).when( cdfHtmlRenderer ).getDashboardContent( Mockito.<InputStream>any(), Mockito.<ArrayList>any() );

    doReturn( "/public/cdf" ).when( cdfHtmlRenderer ).getPluginRepositoryDir();
    MessageBundlesHelper mbh = mock( MessageBundlesHelper.class );
    doReturn( intro ).when( mbh ).replaceParameters( any(), Mockito.<ArrayList>any() );
    doReturn( mbh ).when( cdfHtmlRenderer ).getMessageBundlesHelper( any() );

    doNothing().when( cdfHtmlRenderer )
      .getHeadersInternal( any(), Mockito.<HashMap>any(), Mockito.<OutputStream>any() );
    doNothing().when( cdfHtmlRenderer ).generateContext( Mockito.<OutputStream>any(), Mockito.<HashMap>any(), anyInt() );
    doNothing().when( cdfHtmlRenderer ).generateStorage( Mockito.<OutputStream>any(), any() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/true, /*loadTheme*/false );

    verify( cdfHtmlRenderer, times( 0 ) )
      .getHeadersInternal( any(), Mockito.<HashMap>any(), Mockito.<OutputStream>any() );
    verify( cdfHtmlRenderer, times( 0 ) ).generateContext( Mockito.<OutputStream>any(), Mockito.<HashMap>any(), anyInt() );
    verify( cdfHtmlRenderer, times( 0 ) ).generateStorage( Mockito.<OutputStream>any(), any() );
    verify( cdfHtmlRenderer, times( 1 ) ).getWebContextHeader( Mockito.<OutputStream>any(), anyBoolean() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/false, /*loadTheme*/false );

    verify( cdfHtmlRenderer, times( 1 ) )
      .getHeadersInternal( any(), Mockito.<HashMap>any(), Mockito.<OutputStream>any() );
    verify( cdfHtmlRenderer, times( 1 ) ).generateContext( Mockito.<OutputStream>any(), any( HashMap.class ), anyInt() );
    verify( cdfHtmlRenderer, times( 1 ) ).generateStorage( Mockito.<OutputStream>any(), any() );
    verify( cdfHtmlRenderer, times( 1 ) ).getWebContextHeader( Mockito.<OutputStream>any(), anyBoolean() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/true, /*loadTheme*/true );

    verify( cdfHtmlRenderer, times( 1 ) )
      .getHeadersInternal( any(), Mockito.<HashMap>any(), Mockito.<OutputStream>any() );
    verify( cdfHtmlRenderer, times( 1 ) ).generateContext( Mockito.<OutputStream>any(), any( HashMap.class ), anyInt() );
    verify( cdfHtmlRenderer, times( 1 ) ).generateStorage( Mockito.<OutputStream>any(), any() );
    verify( cdfHtmlRenderer, times( 2 ) ).getWebContextHeader( Mockito.<OutputStream>any(), anyBoolean() );

    cdfHtmlRenderer.execute( outputStream, basicFile, style, messages, parameterMap, user, inactiveInterval,
      /*isRequire*/false, /*loadTheme*/true );

    verify( cdfHtmlRenderer, times( 2 ) )
      .getHeadersInternal( any(), Mockito.<HashMap>any(), Mockito.<OutputStream>any() );
    verify( cdfHtmlRenderer, times( 2 ) ).generateContext( Mockito.<OutputStream>any(), Mockito.<HashMap>any(), anyInt() );
    verify( cdfHtmlRenderer, times( 2 ) ).generateStorage( Mockito.<OutputStream>any(), any() );
    verify( cdfHtmlRenderer, times( 2 ) ).getWebContextHeader( Mockito.<OutputStream>any(), anyBoolean() );
  }
}
